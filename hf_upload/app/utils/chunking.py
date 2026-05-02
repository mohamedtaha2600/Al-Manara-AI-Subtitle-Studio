"""
Audio Chunking Utilities
أدوات تقسيم الصوت

Handles splitting long audio files into manageable chunks
for stable transcription of videos over 1 hour.
"""

import os
import math
from typing import List, Tuple, Optional
from .ffmpeg_utils import extract_audio_chunk, get_duration
import logging

logger = logging.getLogger(__name__)

# Default chunk size: 10 minutes (in seconds)
DEFAULT_CHUNK_DURATION = 600

# Overlap between chunks to avoid cutting words (in seconds)
CHUNK_OVERLAP = 2


def calculate_chunks(
    total_duration: float,
    chunk_duration: float = DEFAULT_CHUNK_DURATION,
    overlap: float = CHUNK_OVERLAP
) -> List[Tuple[float, float]]:
    """
    Calculate chunk boundaries for a given duration.
    
    Args:
        total_duration: Total audio duration in seconds
        chunk_duration: Duration of each chunk
        overlap: Overlap between chunks
    
    Returns:
        List of (start_time, duration) tuples
    """
    chunks = []
    current_start = 0.0
    
    while current_start < total_duration:
        # Calculate end of this chunk
        chunk_end = min(current_start + chunk_duration, total_duration)
        duration = chunk_end - current_start
        
        chunks.append((current_start, duration))
        
        # Move to next chunk with overlap
        current_start = chunk_end - overlap
        
        # Avoid tiny final chunks
        if total_duration - current_start < overlap * 2:
            break
    
    return chunks


def split_audio_to_chunks(
    input_path: str,
    output_dir: str,
    chunk_duration: float = DEFAULT_CHUNK_DURATION
) -> List[dict]:
    """
    Split audio file into chunks.
    
    Args:
        input_path: Path to input audio/video file
        output_dir: Directory to save chunks
        chunk_duration: Duration of each chunk in seconds
    
    Returns:
        List of chunk info dicts with path and timing info
    """
    # Get total duration
    total_duration = get_duration(input_path)
    
    if total_duration == 0:
        raise ValueError("Could not determine file duration")
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Calculate chunk boundaries
    chunk_boundaries = calculate_chunks(total_duration, chunk_duration)
    
    logger.info(f"Splitting {total_duration:.1f}s audio into {len(chunk_boundaries)} chunks")
    
    chunks = []
    for i, (start_time, duration) in enumerate(chunk_boundaries):
        chunk_filename = f"chunk_{i:04d}.wav"
        chunk_path = os.path.join(output_dir, chunk_filename)
        
        success = extract_audio_chunk(
            input_path,
            chunk_path,
            start_time,
            duration
        )
        
        if success:
            chunks.append({
                "index": i,
                "path": chunk_path,
                "start_time": start_time,
                "duration": duration,
                "original_start": start_time
            })
            logger.info(f"Created chunk {i}: {start_time:.1f}s - {start_time + duration:.1f}s")
        else:
            logger.error(f"Failed to create chunk {i}")
    
    return chunks


def merge_transcription_segments(
    chunks: List[dict],
    chunk_results: List[dict],
    overlap: float = CHUNK_OVERLAP
) -> List[dict]:
    """
    Merge transcription results from multiple chunks.
    
    Handles overlapping regions to avoid duplicate text.
    
    Args:
        chunks: List of chunk info dicts
        chunk_results: List of transcription results per chunk
        overlap: Overlap duration used during chunking
    
    Returns:
        List of merged segments with corrected timestamps
    """
    merged_segments = []
    segment_id = 0
    
    for chunk_idx, (chunk_info, result) in enumerate(zip(chunks, chunk_results)):
        chunk_start = chunk_info["original_start"]
        is_last_chunk = chunk_idx == len(chunks) - 1
        
        for seg in result.get("segments", []):
            # Adjust timestamps to original timeline
            adjusted_start = seg["start"] + chunk_start
            adjusted_end = seg["end"] + chunk_start
            
            # Skip segments in overlap region (except for last chunk)
            if not is_last_chunk:
                chunk_end = chunk_start + chunk_info["duration"]
                if adjusted_start > chunk_end - overlap:
                    continue
            
            # Check for duplicate with previous segment
            if merged_segments:
                last_seg = merged_segments[-1]
                # Skip if too close to previous segment
                if abs(adjusted_start - last_seg["end"]) < 0.1:
                    if seg["text"].strip() == last_seg["text"].strip():
                        continue
            
            merged_segments.append({
                "id": segment_id,
                "start": round(adjusted_start, 3),
                "end": round(adjusted_end, 3),
                "text": seg["text"].strip(),
                "confidence": seg.get("confidence", 0),
                "speaker": seg.get("speaker")
            })
            segment_id += 1
    
    return merged_segments


def cleanup_chunks(chunks: List[dict]):
    """
    Remove temporary chunk files.
    
    Args:
        chunks: List of chunk info dicts
    """
    for chunk in chunks:
        try:
            if os.path.exists(chunk["path"]):
                os.remove(chunk["path"])
        except Exception as e:
            logger.warning(f"Failed to remove chunk file: {e}")


def should_use_chunking(file_path: str, threshold_minutes: float = 30) -> bool:
    """
    Determine if chunking should be used for a file.
    
    Args:
        file_path: Path to media file
        threshold_minutes: Duration threshold for chunking
    
    Returns:
        bool: True if file is long enough to require chunking
    """
    duration = get_duration(file_path)
    return duration > (threshold_minutes * 60)
