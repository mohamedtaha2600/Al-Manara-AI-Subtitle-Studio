from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import os
import subprocess
import json
import re
from pathlib import Path

# Import config for proper path resolution
try:
    from config import UPLOAD_DIR
except ImportError:
    from app.config import UPLOAD_DIR

router = APIRouter()

# Global storage for export jobs status
export_jobs = {}

class SilenceRequest(BaseModel):
    file_path: str # This is actually the file_id from frontend
    threshold: int = -30
    min_duration: float = 0.5
    padding: float = 0.1

@router.post("/silence/detect")
async def detect_silence_endpoint(request: SilenceRequest):
    """
    Detects silent periods in a media file using FFmpeg's silencedetect filter.
    Returns a list of silence segments.
    """
    # The file_path from frontend is actually the file_id (e.g., "abc123.mp4")
    file_id = request.file_path
    
    # Try multiple possible locations
    possible_paths = [
        Path(UPLOAD_DIR) / file_id,  # shared/uploads/file_id
        Path(UPLOAD_DIR) / f"{file_id}",  # shared/uploads/file_id
        Path(file_id),  # Direct path if absolute
    ]
    
    resolved_path = None
    for path in possible_paths:
        if path.exists():
            resolved_path = str(path)
            break
    
    if not resolved_path:
        print(f"[SILENCE] File not found. Tried paths: {possible_paths}")
        raise HTTPException(status_code=404, detail=f"File not found: {file_id}. Checked: {UPLOAD_DIR}")

    try:
        print(f"[SILENCE] Analyzing: {resolved_path}")
        segments = await detect_silence(resolved_path, request.threshold, request.min_duration)
        print(f"[SILENCE] Found {len(segments)} silence segments")
        return {"segments": segments}
    except Exception as e:
        print(f"[SILENCE] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


async def detect_silence(file_path: str, threshold_db: int = -30, min_duration: float = 0.5):
    """
    Internal logic.
    Detects silent periods in a media file using FFmpeg's silencedetect filter.
    Returns a list of silence segments: [{'start': 0.0, 'end': 1.5, 'duration': 1.5}, ...]
    """
    # ... (rest of logic unchanged)
    
    cmd = [
        'ffmpeg',
        '-i', file_path,
        '-af', f'silencedetect=noise={threshold_db}dB:d={min_duration}',
        '-f', 'null',
        '-'
    ]
    
    # ... (rest of implementation)


    try:
        # Run ffmpeg and capture stderr (where silencedetect writes its output)
        process = subprocess.Popen(
            cmd,
            stderr=subprocess.PIPE,
            stdout=subprocess.PIPE,
            universal_newlines=True,
            encoding='utf-8' # Ensure UTF-8 decoding
        )
        
        _, stderr = process.communicate()
        
        if process.returncode != 0:
            raise Exception(f"FFmpeg failed: {stderr}")

        # Parse raw output
        silence_list = []
        
        # Regex to find silence_start and silence_end
        # [silencedetect @ 0000...] silence_start: 12.456
        # [silencedetect @ 0000...] silence_end: 14.123 | silence_duration: 1.667
        
        current_start = None
        
        for line in stderr.splitlines():
            if 'silence_start' in line:
                match = re.search(r'silence_start: (\d+(\.\d+)?)', line)
                if match:
                    current_start = float(match.group(1))
            
            elif 'silence_end' in line:
                match_end = re.search(r'silence_end: (\d+(\.\d+)?)', line)
                match_dur = re.search(r'silence_duration: (\d+(\.\d+)?)', line)
                
                if match_end and current_start is not None:
                    end_time = float(match_end.group(1))
                    duration = float(match_dur.group(1)) if match_dur else (end_time - current_start)
                    
                    silence_list.append({
                        'start': current_start,
                        'end': end_time,
                        'duration': duration
                    })
                    current_start = None # Reset
                    
        return silence_list

    except Exception as e:
        print(f"Error detecting silence: {str(e)}")
        raise e


# ============= EXPORT ENDPOINT =============

class ExportSilenceRequest(BaseModel):
    file_id: str
    silence_segments: list  # List of {start, end} dicts to REMOVE
    output_name: str = "output_no_silence"

@router.post("/silence/export")
async def export_without_silence(request: ExportSilenceRequest, background_tasks: BackgroundTasks):
    """
    Export video/audio with silence segments removed.
    Runs in background and returns a job_id.
    """
    import uuid
    job_id = str(uuid.uuid4())
    
    export_jobs[job_id] = {
        "status": "processing",
        "progress": 0,
        "message": "بدء معالجة الفيديو...",
        "output_file": None
    }
    
    background_tasks.add_task(run_silence_export_task, job_id, request)
    
    return {"job_id": job_id}

@router.get("/silence/export/status/{job_id}")
async def get_export_status(job_id: str):
    if job_id not in export_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return export_jobs[job_id]

async def run_silence_export_task(job_id: str, request: ExportSilenceRequest):
    from config import UPLOAD_DIR, EXPORT_DIR
    import uuid
    
    # Resolve input file path
    input_path = Path(UPLOAD_DIR) / request.file_id
    if not input_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {request.file_id}")
    
    # Generate output filename
    ext = input_path.suffix
    output_filename = f"{request.output_name}_{uuid.uuid4().hex[:8]}{ext}"
    output_path = Path(EXPORT_DIR) / output_filename
    
    try:
        # Get video duration using ffprobe
        duration_cmd = ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', 
                       '-of', 'default=noprint_wrappers=1:nokey=1', str(input_path)]
        result = subprocess.run(duration_cmd, capture_output=True, text=True)
        total_duration = float(result.stdout.strip())
        
        # Build keep segments (inverse of silence segments)
        silence_sorted = sorted(request.silence_segments, key=lambda x: x['start'])
        keep_segments = []
        current_pos = 0.0
        
        for silence in silence_sorted:
            if silence['start'] > current_pos:
                keep_segments.append({
                    'start': current_pos,
                    'end': silence['start']
                })
            current_pos = silence['end']
        
        # Add final segment if there's content after last silence
        if current_pos < total_duration:
            keep_segments.append({
                'start': current_pos,
                'end': total_duration
            })
        
        if not keep_segments:
            raise HTTPException(status_code=400, detail="No content to keep after removing silence")
        
        print(f"[EXPORT] Keeping {len(keep_segments)} segments, removing {len(silence_sorted)} silence parts")
        
        # Build FFmpeg filter complex for concatenation
        filter_parts = []
        for i, seg in enumerate(keep_segments):
            filter_parts.append(f"[0:v]trim=start={seg['start']}:end={seg['end']},setpts=PTS-STARTPTS[v{i}];")
            filter_parts.append(f"[0:a]atrim=start={seg['start']}:end={seg['end']},asetpts=PTS-STARTPTS[a{i}];")
        
        # Concat all segments
        video_inputs = ''.join([f'[v{i}]' for i in range(len(keep_segments))])
        audio_inputs = ''.join([f'[a{i}]' for i in range(len(keep_segments))])
        filter_parts.append(f"{video_inputs}concat=n={len(keep_segments)}:v=1:a=0[outv];")
        filter_parts.append(f"{audio_inputs}concat=n={len(keep_segments)}:v=0:a=1[outa]")
        
        filter_complex = ''.join(filter_parts)
        
        # Run FFmpeg
        cmd = [
            'ffmpeg', '-y',
            '-i', str(input_path),
            '-filter_complex', filter_complex,
            '-map', '[outv]',
            '-map', '[outa]',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-c:a', 'aac',
            str(output_path)
        ]
        
        print(f"[EXPORT] Running FFmpeg for job {job_id}...")
        
        # We can use subprocess.Popen to track progress later if needed, 
        # but for now let's just update to 90% when started
        export_jobs[job_id]["progress"] = 30
        export_jobs[job_id]["message"] = "جاري تجميع أجزاء الفيديو..."
        
        process = subprocess.run(cmd, capture_output=True, text=True)
        
        if process.returncode != 0:
            print(f"[EXPORT] FFmpeg error: {process.stderr}")
            export_jobs[job_id]["status"] = "failed"
            export_jobs[job_id]["message"] = f"خطأ في FFmpeg: {process.stderr[-200:]}"
            return

        export_jobs[job_id]["status"] = "completed"
        export_jobs[job_id]["progress"] = 100
        export_jobs[job_id]["message"] = "تم تجهيز الفيديو بنجاح!"
        export_jobs[job_id]["output_file"] = output_filename
        export_jobs[job_id]["download_url"] = f"/exports/{output_filename}"
        
        print(f"[EXPORT] Success! Job {job_id} completed.")
        
    except Exception as e:
        print(f"[EXPORT] Error in job {job_id}: {str(e)}")
        export_jobs[job_id]["status"] = "failed"
        export_jobs[job_id]["message"] = str(e)
