"""
Video Editor Controller
التحكم في تحرير الفيديو

Handles video processing, subtitle burning, and export operations.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import subprocess
import json

router = APIRouter()

# Export directory
from app.config import EXPORT_DIR, UPLOAD_DIR


class SubtitleStyle(BaseModel):
    """Styling options for subtitles."""
    font_family: str = "Arial"
    font_size: int = 24
    primary_color: str = "#FFFFFF"
    outline_color: str = "#000000"
    outline_width: int = 2
    shadow_color: str = "#000000"
    shadow_offset: int = 1
    position: str = "bottom"  # top, center, bottom
    margin_v: int = 30


class ExportRequest(BaseModel):
    """Request model for export operations."""
    job_id: str
    segments: List[dict]
    format: str = "srt"  # srt, vtt, video
    style: Optional[SubtitleStyle] = None
    video_file_id: Optional[str] = None
    dual_language: Optional[bool] = False
    secondary_segments: Optional[List[dict]] = None


def ensure_export_dir():
    """Ensure export directory exists."""
    os.makedirs(EXPORT_DIR, exist_ok=True)


def format_timestamp_srt(seconds: float) -> str:
    """Convert seconds to SRT timestamp format (HH:MM:SS,mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_timestamp_vtt(seconds: float) -> str:
    """Convert seconds to VTT timestamp format (HH:MM:SS.mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def generate_srt(segments: List[dict]) -> str:
    """
    Generate SRT format subtitle content.
    
    Args:
        segments: List of subtitle segments
    
    Returns:
        str: SRT formatted content
    """
    srt_content = []
    
    for i, segment in enumerate(segments, 1):
        start = format_timestamp_srt(segment["start"])
        end = format_timestamp_srt(segment["end"])
        text = segment["text"].strip()
        
        srt_content.append(f"{i}")
        srt_content.append(f"{start} --> {end}")
        srt_content.append(text)
        srt_content.append("")  # Empty line between segments
    
    return "\n".join(srt_content)


def generate_vtt(segments: List[dict]) -> str:
    """
    Generate WebVTT format subtitle content.
    
    Args:
        segments: List of subtitle segments
    
    Returns:
        str: VTT formatted content
    """
    vtt_content = ["WEBVTT", "Kind: captions", ""]
    
    for i, segment in enumerate(segments, 1):
        start = format_timestamp_vtt(segment["start"])
        end = format_timestamp_vtt(segment["end"])
        text = segment["text"].strip()
        
        # Add speaker styling if available
        if segment.get("speaker"):
            vtt_content.append(f"NOTE Speaker: {segment['speaker']}")
        
        vtt_content.append(f"{i}")
        vtt_content.append(f"{start} --> {end}")
        vtt_content.append(text)
        vtt_content.append("")
    
    return "\n".join(vtt_content)


def generate_ass_style(style: SubtitleStyle) -> str:
    """
    Generate ASS format style for FFmpeg subtitle burning.
    
    Args:
        style: Subtitle styling options
    
    Returns:
        str: ASS style string
    """
    # Convert hex colors to ASS format (BGR with alpha)
    def hex_to_ass(hex_color: str) -> str:
        hex_color = hex_color.lstrip('#')
        r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
        return f"&H00{b:02X}{g:02X}{r:02X}"
    
    primary = hex_to_ass(style.primary_color)
    outline = hex_to_ass(style.outline_color)
    shadow = hex_to_ass(style.shadow_color)
    
    # Alignment based on position
    alignment = {"top": 8, "center": 5, "bottom": 2}.get(style.position, 2)
    
    ass_style = (
        f"FontName={style.font_family},"
        f"FontSize={style.font_size},"
        f"PrimaryColour={primary},"
        f"OutlineColour={outline},"
        f"BackColour={shadow},"
        f"Outline={style.outline_width},"
        f"Shadow={style.shadow_offset},"
        f"Alignment={alignment},"
        f"MarginV={style.margin_v}"
    )
    
    return ass_style


@router.post("/export")
async def export_subtitles(request: ExportRequest):
    """
    Export subtitles in the requested format.
    
    Args:
        request: Export configuration
    
    Returns:
        dict: Export result with file path
    """
    ensure_export_dir()
    
    if request.format == "srt":
        content = generate_srt(request.segments)
        filename = f"{request.job_id}.srt"
        
    elif request.format == "vtt":
        content = generate_vtt(request.segments)
        filename = f"{request.job_id}.vtt"
        
    elif request.format == "video":
        # Burn subtitles into video
        return await burn_subtitles_to_video(request)
    
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")
    
    # Write subtitle file
    file_path = os.path.join(EXPORT_DIR, filename)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    
    return {
        "success": True,
        "format": request.format,
        "filename": filename,
        "file_path": file_path,
        "download_url": f"/api/export/download/{filename}",
        "message": "تم التصدير بنجاح! - Export completed!"
    }


async def burn_subtitles_to_video(request: ExportRequest) -> dict:
    """
    Burn subtitles into video using FFmpeg.
    
    Args:
        request: Export request with video file and styling
    
    Returns:
        dict: Result with output file path
    """
    if not request.video_file_id:
        raise HTTPException(status_code=400, detail="video_file_id required for video export")
    
    # Find input video
    upload_dir = UPLOAD_DIR
    
    input_video = None
    for filename in os.listdir(upload_dir):
        if filename.startswith(request.video_file_id):
            input_video = os.path.join(upload_dir, filename)
            break
    
    if not input_video:
        raise HTTPException(status_code=404, detail="Video file not found")
    
    # Generate temporary SRT file
    srt_content = generate_srt(request.segments)
    srt_path = os.path.join(EXPORT_DIR, f"{request.job_id}_temp.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(srt_content)
    
    # Output video path
    output_video = os.path.join(EXPORT_DIR, f"{request.job_id}_subtitled.mp4")
    
    # Build FFmpeg command
    style = request.style or SubtitleStyle()
    ass_style = generate_ass_style(style)
    
    # Escape paths for FFmpeg filter
    srt_escaped = srt_path.replace("\\", "/").replace(":", "\\:")
    
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-i", input_video,
        "-vf", f"subtitles='{srt_escaped}':force_style='{ass_style}'",
        "-c:a", "copy",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",  # High quality
        output_video
    ]
    
    try:
        result = subprocess.run(
            ffmpeg_cmd,
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout for long videos
        )
        
        if result.returncode != 0:
            raise Exception(result.stderr)
        
        # Clean up temp SRT
        os.remove(srt_path)
        
        return {
            "success": True,
            "format": "video",
            "filename": f"{request.job_id}_subtitled.mp4",
            "file_path": output_video,
            "download_url": f"/api/export/download/{request.job_id}_subtitled.mp4",
            "message": "تم حرق الترجمة في الفيديو! - Subtitles burned into video!"
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Video processing timed out")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"FFmpeg error: {str(e)}")


@router.get("/export/download/{filename}")
async def download_export(filename: str):
    """
    Download an exported file.
    
    Args:
        filename: Name of the export file
    
    Returns:
        FileResponse: The requested file
    """
    file_path = os.path.join(EXPORT_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Export file not found")
    
    # Determine media type
    ext = os.path.splitext(filename)[1].lower()
    media_types = {
        ".srt": "application/x-subrip",
        ".vtt": "text/vtt",
        ".mp4": "video/mp4",
        ".mkv": "video/x-matroska"
    }
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=media_types.get(ext, "application/octet-stream")
    )


@router.get("/export/list")
async def list_exports():
    """
    List all exported files.
    
    Returns:
        dict: List of export files
    """
    ensure_export_dir()
    
    exports = []
    for filename in os.listdir(EXPORT_DIR):
        file_path = os.path.join(EXPORT_DIR, filename)
        if os.path.isfile(file_path):
            stat = os.stat(file_path)
            exports.append({
                "filename": filename,
                "size_mb": round(stat.st_size / (1024 * 1024), 2),
                "download_url": f"/api/export/download/{filename}"
            })
    
    return {"exports": exports, "count": len(exports)}
