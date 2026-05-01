"""
FFmpeg Utilities
أدوات FFmpeg

Helper functions for FFmpeg operations including audio extraction,
video processing, and format conversions.
"""

import subprocess
import os
import json
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


def check_ffmpeg_installed() -> bool:
    """
    Check if FFmpeg is installed and accessible.
    
    Returns:
        bool: True if FFmpeg is available
    """
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True
        )
        return result.returncode == 0
    except FileNotFoundError:
        return False


def get_media_info(file_path: str) -> Dict[str, Any]:
    """
    Get media file information using FFprobe.
    
    Args:
        file_path: Path to media file
    
    Returns:
        dict: Media information including duration, codecs, resolution
    """
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        file_path
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            return json.loads(result.stdout)
    except Exception as e:
        logger.error(f"FFprobe error: {e}")
    
    return {}


def get_duration(file_path: str) -> float:
    """
    Get duration of media file in seconds.
    
    Args:
        file_path: Path to media file
    
    Returns:
        float: Duration in seconds
    """
    info = get_media_info(file_path)
    try:
        return float(info.get("format", {}).get("duration", 0))
    except (ValueError, TypeError):
        return 0.0


def extract_audio(
    input_path: str,
    output_path: str,
    sample_rate: int = 16000,
    mono: bool = True
) -> bool:
    """
    Extract audio from video file.
    
    Args:
        input_path: Path to input video
        output_path: Path for output audio
        sample_rate: Audio sample rate (default 16000 for Whisper)
        mono: Convert to mono (default True for Whisper)
    
    Returns:
        bool: True if successful
    """
    channels = "1" if mono else "2"
    
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vn",  # No video
        "-acodec", "pcm_s16le",  # WAV format
        "-ar", str(sample_rate),
        "-ac", channels,
        output_path
    ]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )
        return result.returncode == 0
    except Exception as e:
        logger.error(f"Audio extraction error: {e}")
        return False


def extract_audio_chunk(
    input_path: str,
    output_path: str,
    start_time: float,
    duration: float,
    sample_rate: int = 16000
) -> bool:
    """
    Extract a chunk of audio from a file.
    
    Args:
        input_path: Path to input file
        output_path: Path for output audio chunk
        start_time: Start time in seconds
        duration: Chunk duration in seconds
        sample_rate: Audio sample rate
    
    Returns:
        bool: True if successful
    """
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-ss", str(start_time),
        "-t", str(duration),
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", str(sample_rate),
        "-ac", "1",
        output_path
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0
    except Exception as e:
        logger.error(f"Chunk extraction error: {e}")
        return False


def get_video_resolution(file_path: str) -> tuple:
    """
    Get video resolution.
    
    Args:
        file_path: Path to video file
    
    Returns:
        tuple: (width, height) or (0, 0) if not found
    """
    info = get_media_info(file_path)
    for stream in info.get("streams", []):
        if stream.get("codec_type") == "video":
            return (
                stream.get("width", 0),
                stream.get("height", 0)
            )
    return (0, 0)


def burn_subtitles(
    video_path: str,
    subtitle_path: str,
    output_path: str,
    style: Optional[str] = None
) -> bool:
    """
    Burn subtitles into video.
    
    Args:
        video_path: Path to input video
        subtitle_path: Path to subtitle file (SRT or ASS)
        output_path: Path for output video
        style: Optional ASS style string
    
    Returns:
        bool: True if successful
    """
    # Escape path for FFmpeg filter
    sub_escaped = subtitle_path.replace("\\", "/").replace(":", "\\:")
    
    # Build filter
    if style:
        vf = f"subtitles='{sub_escaped}':force_style='{style}'"
    else:
        vf = f"subtitles='{sub_escaped}'"
    
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vf", vf,
        "-c:a", "copy",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        output_path
    ]
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=7200  # 2 hour timeout
        )
        return result.returncode == 0
    except Exception as e:
        logger.error(f"Subtitle burning error: {e}")
        return False


def convert_to_mp4(input_path: str, output_path: str) -> bool:
    """
    Convert video to MP4 format.
    
    Args:
        input_path: Path to input video
        output_path: Path for output MP4
    
    Returns:
        bool: True if successful
    """
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-c:v", "libx264",
        "-c:a", "aac",
        "-preset", "medium",
        output_path
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result.returncode == 0
    except Exception as e:
        logger.error(f"Conversion error: {e}")
        return False
