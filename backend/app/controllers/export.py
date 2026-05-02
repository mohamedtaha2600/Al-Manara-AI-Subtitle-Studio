from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import os
import xml.etree.ElementTree as ET
from datetime import datetime
from app.config import EXPORTS_DIR, UPLOADS_DIR
import subprocess

router = APIRouter(prefix="/export", tags=["export"])

# Global storage for burn-in jobs
burn_in_jobs = {}

class ExportRequest(BaseModel):
    segments: List[dict]
    video_id: str
    format: str # 'srt', 'vtt', 'xml', 'fcpxml', 'burn-in'
    style: Optional[dict] = None

@router.post("/generate")
async def generate_export(request: ExportRequest, background_tasks: BackgroundTasks):
    if request.format == 'xml':
        return await export_premiere_xml(request)
    elif request.format == 'burn-in':
        import uuid
        job_id = str(uuid.uuid4())
        burn_in_jobs[job_id] = {
            "status": "processing",
            "progress": 0,
            "message": "بدء عملية حرق الترجمة...",
            "download_url": None
        }
        background_tasks.add_task(run_burn_in_task, job_id, request)
        return {"job_id": job_id}
    else:
        raise HTTPException(status_code=400, detail=f"Format {request.format} not implemented yet")

@router.get("/status/{job_id}")
async def get_burn_in_status(job_id: str):
    if job_id not in burn_in_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return burn_in_jobs[job_id]

async def run_burn_in_task(job_id: str, request: ExportRequest):
    """
    Background task for burning subtitles.
    """
    try:
        burn_in_jobs[job_id]["progress"] = 20
        burn_in_jobs[job_id]["message"] = "جاري تحضير ملف الترجمة..."
        
        # 1. Generate temp SRT
        srt_content = ""
        for i, seg in enumerate(request.segments):
            start = format_time_srt(seg['start'])
            end = format_time_srt(seg['end'])
            srt_content += f"{i+1}\n{start} --> {end}\n{seg['text']}\n\n"
            
        temp_srt = os.path.join(EXPORTS_DIR, f"temp_{request.video_id}_{job_id}.srt")
        with open(temp_srt, "w", encoding="utf-8") as f:
            f.write(srt_content)
            
        burn_in_jobs[job_id]["progress"] = 40
        burn_in_jobs[job_id]["message"] = "جاري دمج الترجمة مع الفيديو (قد يستغرق ذلك وقتاً)..."
        
        # 2. Find the actual input video file (it might have an extension)
        input_video = None
        for filename in os.listdir(UPLOADS_DIR):
            if filename.startswith(request.video_id):
                input_video = os.path.join(UPLOADS_DIR, filename)
                break
        
        if not input_video:
            raise FileNotFoundError(f"Video file not found for ID: {request.video_id}")
            
        output_video_name = f"burnin_{request.video_id}_{job_id}.mp4"
        output_video = os.path.join(EXPORTS_DIR, output_video_name)
        
        # Cross-platform path escaping for FFmpeg subtitles filter
        # On Linux (HuggingFace), absolute paths work best with filename=''
        # On Windows, we need to escape the colon (e.g. C\:...)
        srt_path_esc = temp_srt.replace("\\", "/")
        if os.name == 'nt':
            srt_path_esc = srt_path_esc.replace(":", "\\:")
            
        cmd = [
            "ffmpeg", "-y", "-i", input_video,
            "-vf", f"subtitles=filename='{srt_path_esc}'",
            "-c:v", "libx264", "-preset", "fast",
            "-crf", "23", # Good balance of quality/size
            "-c:a", "copy",
            output_video
        ]
        
        print(f"[BURN-IN] Running command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"[BURN-IN] FFmpeg Error: {result.stderr}")
            raise Exception(f"FFmpeg failed with exit code {result.returncode}: {result.stderr}")
        
        burn_in_jobs[job_id]["status"] = "completed"
        burn_in_jobs[job_id]["progress"] = 100
        burn_in_jobs[job_id]["message"] = "تم دمج الترجمة بنجاح!"
        burn_in_jobs[job_id]["download_url"] = f"/exports/{output_video_name}"
        
    except Exception as e:
        print(f"[BURN-IN] Error: {str(e)}")
        burn_in_jobs[job_id]["status"] = "failed"
        burn_in_jobs[job_id]["message"] = f"فشل الحرق: {str(e)}"

async def export_premiere_xml(request: ExportRequest):
    """
    Generate a Premiere-compatible Final Cut Pro XML file.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"export_{timestamp}.xml"
    file_path = os.path.join(EXPORTS_DIR, filename)
    
    # Simplified FCP XML structure
    xmeml = ET.Element('xmeml', version="4")
    sequence = ET.SubElement(xmeml, 'sequence', id="Sequence 1")
    ET.SubElement(sequence, 'name').text = f"Al-Manara Export {timestamp}"
    ET.SubElement(sequence, 'duration').text = "3600" # Placeholder
    
    media = ET.SubElement(sequence, 'media')
    video = ET.SubElement(media, 'video')
    track = ET.SubElement(video, 'track')
    
    # Add video clip
    clipitem = ET.SubElement(track, 'clipitem', id="clipitem-1")
    ET.SubElement(clipitem, 'name').text = request.video_id
    ET.SubElement(clipitem, 'start').text = "0"
    ET.SubElement(clipitem, 'end').text = "3600"
    
    tree = ET.ElementTree(xmeml)
    tree.write(file_path, encoding='UTF-8', xml_declaration=True)
    
    return {"status": "success", "downloadUrl": f"/exports/{filename}", "filename": filename}

def format_time_srt(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"
