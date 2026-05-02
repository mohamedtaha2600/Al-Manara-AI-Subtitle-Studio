from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import asyncio
from datetime import datetime

from services.whisper_service import WhisperService
from services.websocket_manager import ConnectionManager
from deep_translator import GoogleTranslator, MyMemoryTranslator
from app.config import UPLOAD_DIR

router = APIRouter()

# Store for transcription jobs
transcription_jobs = {}
whisper_service = WhisperService()


# Arabic diacritics (tashkeel) Unicode range
ARABIC_DIACRITICS = '\u064B\u064C\u064D\u064E\u064F\u0650\u0651\u0652\u0653\u0654\u0655\u0656\u0657\u0658\u065F\u0670'
# Common punctuation marks
PUNCTUATION = '.,;:!?،؛؟…\"""()[]–-'

def post_process_text(text: str, include_diacritics: bool, include_punctuation: bool) -> str:
    """Strip diacritics and/or punctuation from text based on user preferences."""
    result = text
    
    if not include_diacritics:
        # Remove Arabic diacritics
        result = ''.join(c for c in result if c not in ARABIC_DIACRITICS)
    
    if not include_punctuation:
        # Remove punctuation marks
        result = ''.join(c for c in result if c not in PUNCTUATION)
    
    return result.strip()


class TranscriptionRequest(BaseModel):
    """Request model for starting transcription."""
    file_id: str
    language: Optional[str] = "auto"  # auto, ar, en
    model_size: Optional[str] = "medium"  # tiny, base, small, medium, large
    enable_diarization: Optional[bool] = False
    translate_to: Optional[str] = None  # Legacy field
    target_languages: Optional[List[str]] = None  # New: ["ar", "en", "fr"]
    include_source: bool = True
    performance_mode: str = "accuracy" # "speed" or "accuracy"
    # Advanced options
    min_silence_ms: int = 250  # Minimum silence duration in ms
    include_diacritics: bool = True  # Include Arabic diacritics (tashkeel)
    include_punctuation: bool = True  # Include punctuation marks
    use_gpu: bool = True  # Enable/Disable GPU
    offline_mode: bool = False  # Restrict to offline translation
    max_words_per_segment: int = 5  # New: Max words per subtitle segment
    # VAD & Prompting
    vad_enabled: Optional[bool] = False
    vad_threshold: Optional[float] = 0.5
    vad_segments: Optional[List[dict]] = None # New: [{"start": 0, "end": 2}, ...]
    initial_prompt: Optional[str] = None


class TranscriptionJob(BaseModel):
    """Model for transcription job status."""
    job_id: str
    file_id: str
    status: str  # pending, processing, completed, failed
    progress: float
    message: str
    segments: Optional[List[dict]] = None
    tracks: Optional[List[dict]] = None # New: Multi-track support
    created_at: str
    completed_at: Optional[str] = None


class SubtitleSegment(BaseModel):
    """Model for a single subtitle segment."""
    id: int
    start: float
    end: float
    text: str
    speaker: Optional[str] = None
    confidence: Optional[float] = None


@router.post("/transcribe")
async def start_transcription(
    request: TranscriptionRequest
):
    """
    Start a transcription job for the uploaded file.
    
    Args:
        request: Transcription configuration
    
    Returns:
        dict: Job ID and initial status
    """
    # Generate job ID
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    
    # Find the uploaded file
    # Find the uploaded file
    upload_dir = UPLOAD_DIR
    
    file_path = None
    for filename in os.listdir(upload_dir):
        if filename.startswith(request.file_id):
            file_path = os.path.join(upload_dir, filename)
            break
    
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Handle legacy translate_to
    targets = request.target_languages or []
    if request.translate_to and request.translate_to not in targets:
        targets.append(request.translate_to)

    # Create job entry
    job = {
        "job_id": job_id,
        "file_id": request.file_id,
        "file_path": file_path,
        "status": "pending",
        "progress": 0.0,
        "message": "جاري بدء النسخ... - Starting transcription...",
        "segments": [],
        "tracks": [],
        "language": request.language,
        "model_size": request.model_size,
        "enable_diarization": request.enable_diarization,
        "target_languages": targets,
        "include_source": request.include_source,
        "created_at": datetime.now().isoformat(),
        "completed_at": None
    }
    
    transcription_jobs[job_id] = job
    
    # Start transcription as async task (proper way)
    asyncio.create_task(
        process_transcription(
            job_id,
            file_path,
            request.language,
            request.model_size,
            request.enable_diarization,
            targets,
            request.include_source,
            request.performance_mode,
            request.min_silence_ms,
            request.include_diacritics,
            request.include_punctuation,
            use_gpu=request.use_gpu,
            offline_mode=request.offline_mode,
            max_words_per_segment=request.max_words_per_segment,
            vad_enabled=request.vad_enabled,
            vad_threshold=request.vad_threshold,
            vad_segments=request.vad_segments,
            initial_prompt=request.initial_prompt
        )
    )
    
    return {
        "success": True,
        "job_id": job_id,
        "status": "pending",
        "message": "Transcription job started"
    }


async def process_transcription(
    job_id: str,
    file_path: str,
    language: str,
    model_size: str,
    enable_diarization: bool,
    target_languages: List[str],
    include_source: bool = True,
    performance_mode: str = "accuracy",
    min_silence_ms: int = 250,
    include_diacritics: bool = True,
    include_punctuation: bool = True,
    use_gpu: bool = True,
    offline_mode: bool = False,
    max_words_per_segment: int = 5,
    vad_enabled: bool = False,
    vad_threshold: float = 0.5,
    vad_segments: Optional[List[dict]] = None,
    initial_prompt: Optional[str] = None
):
    """
    Background task to process transcription.
    """
    job = transcription_jobs.get(job_id)
    if not job:
        return
    
    try:
        # Update status
        job["status"] = "processing"
        job["message"] = "جاري استخراج الصوت... - Extracting audio..."
        job["progress"] = 5.0
        
        tracks = []
        
        # 1. Primary Transcription (Source)
        # --------------------------------
        job["message"] = f"جاري نسخ اللغة الأصلية ({language})..."
        result = await whisper_service.transcribe(
            file_path=file_path,
            language=language if language != "auto" else None,
            model_size=model_size,
            job_id=job_id,
            task="transcribe",
            performance_mode=performance_mode,
            min_silence_ms=min_silence_ms,
            progress_callback=lambda p, m: update_job_progress(job_id, p * 0.8, m), # Scale progress (80% for transcription)
            use_gpu=use_gpu,
            max_words_per_segment=max_words_per_segment,
            vad_enabled=vad_enabled,
            vad_threshold=vad_threshold,
            vad_segments=vad_segments,
            initial_prompt=initial_prompt
        )
        
        detected_lang = result.get("language", language)
        source_segments = result.get("segments", [])
        
        # Post-process segments if needed
        for seg in source_segments:
            seg["text"] = post_process_text(seg["text"], include_diacritics, include_punctuation)
            
            # If punctuation is requested but Whisper output is "naked" (no dots/commas), try local restoration
            if include_punctuation and not any(p in seg["text"] for p in PUNCTUATION):
                seg["text"] = whisper_service.restore_punctuation(seg["text"])
        
        # Add Source Track
        if include_source or not target_languages:
            tracks.append({
                "id": f"track-source-{detected_lang}",
                "name": f"Original ({detected_lang})",
                "language": detected_lang,
                "segments": source_segments,
                "type": "source"
            })
        
        # 2. Translations (Text-based with FALLBACK)
        # --------------------------------
        if target_languages:
            texts = [seg['text'] for seg in source_segments]
            total_targets = len(target_languages)
            print(f"[DEBUG] Starting translation for {len(texts)} segments to targets: {target_languages}")
            
            for idx, target_lang in enumerate(target_languages):
                # skip if target language is same as source language (already captured by source track)
                if target_lang == detected_lang:
                    print(f"[DEBUG] Skipping translation for {target_lang} as it is the same as source")
                    continue
                
                job["message"] = f"جاري الترجمة إلى {target_lang}..."
                current_base_progress = 80 + (20 * (idx / total_targets))
                update_job_progress(job_id, current_base_progress, job["message"])
                
                translated_texts = []

                # OPTIMIZATION: If target same as source, just clone the text (don't call API)
                # This allows users to have a dedicated "Editing" track even if same language
                if target_lang == detected_lang:
                    print(f"[DEBUG] Target {target_lang} same as source - Cloning segments")
                    translated_texts = texts[:] # Clone list
                else:
                    # OPTIMIZATION: Check for Argos ONCE
                    can_use_argos = False
                    try:
                        import argostranslate.translate
                        import argostranslate.package
                        # Quick check if translation is possible (dummy call or package check)
                        # For now, just assume active if import works
                        can_use_argos = True
                    except ImportError:
                        print(f"[DEBUG] Argos Translate not installed. Skipping local check.")
                    except Exception as e:
                        print(f"[DEBUG] Argos Init Error: {e}")

                    # Helper function - Synchronous (Run in Executor)
                    def translate_single(text: str) -> str:
                        # Normalize language codes for Google (e.g. 'ar' instead of 'arabic')
                        src = detected_lang if detected_lang and len(detected_lang) <= 3 else 'auto'
                        tgt = target_lang if target_lang and len(target_lang) <= 3 else 'en'

                        # 1. Try Google (Online) - Higher quality
                        if not offline_mode:
                            try:
                                result = GoogleTranslator(source=src, target=tgt).translate(text)
                                if result and result.strip() and result.strip() != text.strip():
                                    return result
                            except Exception as e:
                                print(f"[DEBUG] Google Translate failed for segment: {e}")

                        # 2. Try Argos (Offline) - If available
                        if can_use_argos:
                            try:
                                translated = argostranslate.translate.translate(text, src, tgt)
                                if translated and translated.strip() != text.strip():
                                    return translated
                            except Exception:
                                pass

                        # 3. Try MyMemory as fallback
                        if not offline_mode:
                            try:
                                return MyMemoryTranslator(source=src, target=tgt).translate(text)
                            except Exception:
                                pass
                        
                        return text

                    # Helper function
                    async def translate_single_async(text: str, semaphore: asyncio.Semaphore) -> str:
                        async with semaphore:
                            return await asyncio.get_event_loop().run_in_executor(None, translate_single, text)

                    try:
                        print(f"[DEBUG] Translating to {target_lang} using Priority: Argos(Local) -> Google -> MyMemory...")
                        
                        # Use Semaphore to limit concurrency (avoid rate limits)
                        sem = asyncio.Semaphore(5)
                        tasks = []
                        for i, text in enumerate(texts):
                            tasks.append(translate_single_async(text, sem))
                        
                        # Run concurrently but update progress periodically
                        # We can't easily update progress per-item with gather, so we use as_completed or just chunks
                        # For simplicity, let's gather all but update progress based on chunks logic if needed
                        # Or better: process in chunks
                        
                        CHUNK_SIZE = 10
                        for i in range(0, len(texts), CHUNK_SIZE):
                            chunk_texts = texts[i:i+CHUNK_SIZE]
                            chunk_tasks = [translate_single_async(t, sem) for t in chunk_texts]
                            
                            chunk_results = await asyncio.gather(*chunk_tasks)
                            translated_texts.extend(chunk_results)
                            
                            # Update progress
                            current_count = len(translated_texts)
                            sub_progress = current_base_progress + (20 / total_targets) * (current_count / len(texts))
                            update_job_progress(job_id, sub_progress, f"جاري الترجمة ({target_lang})... {current_count}/{len(texts)}")

                    except Exception as e:
                        print(f"[ERROR] Translation failed for {target_lang}: {e}")
                        # Fallback to original text on catastrophe, so track is still created
                        translated_texts = texts[:]
                
                # Create translated segments
                new_segments = []
                for i, seg in enumerate(source_segments):
                    translated_text = translated_texts[i] if i < len(translated_texts) else seg['text']
                    new_seg = seg.copy()
                    new_seg['text'] = translated_text
                    if 'words' in new_seg:
                        del new_seg['words']
                    new_segments.append(new_seg)
                
                print(f"[DEBUG] Created {len(new_segments)} translated segments for {target_lang}")
                    
                tracks.append({
                    "id": f"track-{target_lang}",
                    "name": f"Translation ({target_lang})",
                    "language": target_lang,
                    "segments": new_segments,
                    "type": "translation"
                })
        
        # 3. Finalize Job (SUCCESS PATH)
        # --------------------------------
        job["status"] = "completed"
        job["progress"] = 100.0
        job["message"] = "تم النسخ والترجمة بنجاح! - Completed!"
        job["segments"] = source_segments # Legacy support
        job["tracks"] = tracks
        job["detected_language"] = detected_lang
        job["completed_at"] = datetime.now().isoformat()
        print(f"[DEBUG] Job {job_id} completed successfully with {len(tracks)} tracks")
                    
    except Exception as e:
        print(f"[ERROR] Process transcription failed: {e}")
        import traceback
        traceback.print_exc()
        job["status"] = "failed"
        job["message"] = f"خطأ في النسخ - Transcription failed: {str(e)}"
        job["progress"] = 0.0


def update_job_progress(job_id: str, progress: float, message: str):
    """Update job progress for real-time feedback."""
    if job_id in transcription_jobs:
        transcription_jobs[job_id]["progress"] = progress
        transcription_jobs[job_id]["message"] = message


@router.get("/transcribe/{job_id}")
async def get_transcription_status(job_id: str):
    """
    Get the status of a transcription job.
    
    Args:
        job_id: The job identifier
    
    Returns:
        dict: Current job status and results if completed
    """
    if job_id not in transcription_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return transcription_jobs[job_id]


@router.get("/transcribe/{job_id}/segments")
async def get_transcription_segments(job_id: str):
    """
    Get only the subtitle segments from a completed job.
    
    Args:
        job_id: The job identifier
    
    Returns:
        dict: List of subtitle segments
    """
    if job_id not in transcription_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = transcription_jobs[job_id]
    
    if job["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail="Transcription not yet completed"
        )
    
    return {
        "job_id": job_id,
        "segments": job["segments"],
        "count": len(job["segments"])
    }


@router.post("/transcribe/{job_id}/segments")
async def update_segments(job_id: str, segments: List[dict]):
    """
    Update subtitle segments (after user editing).
    
    Args:
        job_id: The job identifier
        segments: Updated segment list
    
    Returns:
        dict: Confirmation of update
    """
    if job_id not in transcription_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    transcription_jobs[job_id]["segments"] = segments
    
    return {
        "success": True,
        "message": "Segments updated",
        "count": len(segments)
    }


@router.get("/jobs")
async def list_jobs():
    """
    List all transcription jobs.
    
    Returns:
        dict: List of all jobs with their status
    """
    jobs = []
    for job_id, job in transcription_jobs.items():
        jobs.append({
            "job_id": job_id,
            "file_id": job["file_id"],
            "status": job["status"],
            "progress": job["progress"],
            "created_at": job["created_at"]
        })
    
    return {"jobs": jobs, "count": len(jobs)}


@router.get("/models")
async def get_models():
    """
    Get list of available Whisper models.
    
    Returns:
        dict: Installed models and all available options
    """
    loop = asyncio.get_event_loop()
    installed = await loop.run_in_executor(None, whisper_service.get_installed_models)
    
    return {
        "installed": installed,
        "available": [
            {"id": "tiny", "name": "Tiny (~75MB)", "desc": "Fastest, low accuracy"},
            {"id": "base", "name": "Base (~150MB)", "desc": "Fast, basic accuracy"},
            {"id": "small", "name": "Small (~500MB)", "desc": "Balanced"},
            {"id": "medium", "name": "Medium (~1.5GB)", "desc": "Recommended for Arabic"},
            {"id": "large-v3", "name": "Large (~3GB)", "desc": "Best accuracy, slow"}
        ]
    }
