"""
Speaker Diarization Service
============================
Uses pyannote/speaker-diarization-3.1 to identify and label speakers
in audio files. Integrates with Whisper transcription pipeline.

Requires: HF_TOKEN environment variable set with access to pyannote models.
"""

import os
import time
from typing import List, Optional, Dict

# Lazy-load pyannote to avoid import errors if not installed
_pipeline = None
_pipeline_loaded = False

def _get_pipeline():
    """Lazy-load the diarization pipeline (cached after first load)."""
    global _pipeline, _pipeline_loaded
    if _pipeline_loaded:
        return _pipeline
    
    _pipeline_loaded = True  # Mark as attempted even if failed
    
    try:
        from pyannote.audio import Pipeline
        import torch
        
        token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
        if not token:
            print("[DIARIZATION] ⚠️ HF_TOKEN not set — diarization disabled")
            return None
        
        print("[DIARIZATION] 🔄 Loading pyannote/speaker-diarization-3.1...")
        start = time.time()
        
        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=token
        )
        
        # Use GPU if available
        if torch.cuda.is_available():
            pipeline = pipeline.to(torch.device("cuda"))
            print("[DIARIZATION] ✅ Using GPU for diarization")
        else:
            print("[DIARIZATION] ℹ️ Using CPU for diarization")
        
        _pipeline = pipeline
        elapsed = time.time() - start
        print(f"[DIARIZATION] ✅ Pipeline loaded in {elapsed:.1f}s")
        return _pipeline
        
    except ImportError:
        print("[DIARIZATION] ❌ pyannote.audio not installed — run setup_diarization.bat")
        return None
    except Exception as e:
        print(f"[DIARIZATION] ❌ Failed to load pipeline: {e}")
        return None


def is_available() -> bool:
    """Check if diarization is available without loading the model."""
    try:
        import pyannote.audio  # noqa: F401
        token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN")
        return bool(token)
    except ImportError:
        return False


def diarize(audio_path: str, num_speakers: Optional[int] = None) -> List[Dict]:
    """
    Run speaker diarization on an audio file.
    
    Args:
        audio_path: Path to audio file (wav/mp3/etc)
        num_speakers: Optional hint for number of speakers
        
    Returns:
        List of diarization segments: [{start, end, speaker}, ...]
    """
    pipeline = _get_pipeline()
    if pipeline is None:
        return []
    
    try:
        print(f"[DIARIZATION] 🎙️ Analyzing speakers in: {audio_path}")
        start = time.time()
        
        # Build params
        params = {}
        if num_speakers:
            params["num_speakers"] = num_speakers
        
        # Run diarization
        diarization = pipeline(audio_path, **params)
        
        # Convert to list of dicts
        segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                "start": round(turn.start, 3),
                "end": round(turn.end, 3),
                "speaker": speaker  # e.g. "SPEAKER_00", "SPEAKER_01"
            })
        
        elapsed = time.time() - start
        speakers_found = len(set(s["speaker"] for s in segments))
        print(f"[DIARIZATION] ✅ Found {speakers_found} speaker(s) in {elapsed:.1f}s")
        return segments
        
    except Exception as e:
        print(f"[DIARIZATION] ❌ Diarization failed: {e}")
        return []


def assign_speakers_to_segments(
    whisper_segments: List[dict],
    diarization_segments: List[Dict]
) -> List[dict]:
    """
    Assign speaker labels to Whisper transcription segments
    based on time overlap with diarization output.
    
    Args:
        whisper_segments: List of Whisper segments with start/end/text
        diarization_segments: Output from diarize()
        
    Returns:
        Whisper segments with 'speaker' field added
    """
    if not diarization_segments:
        return whisper_segments
    
    # Build speaker mapping: rename SPEAKER_00 -> Speaker 1, etc.
    all_speakers = sorted(set(s["speaker"] for s in diarization_segments))
    speaker_labels = {sp: f"Speaker {i+1}" for i, sp in enumerate(all_speakers)}
    
    result = []
    for seg in whisper_segments:
        seg_start = seg.get("start", 0)
        seg_end = seg.get("end", 0)
        seg_mid = (seg_start + seg_end) / 2
        
        # Find the diarization segment with maximum overlap
        best_speaker = None
        best_overlap = 0
        
        for d in diarization_segments:
            # Calculate overlap
            overlap_start = max(seg_start, d["start"])
            overlap_end = min(seg_end, d["end"])
            overlap = max(0, overlap_end - overlap_start)
            
            if overlap > best_overlap:
                best_overlap = overlap
                best_speaker = d["speaker"]
        
        # Fallback: find speaker at segment midpoint
        if best_speaker is None:
            for d in diarization_segments:
                if d["start"] <= seg_mid <= d["end"]:
                    best_speaker = d["speaker"]
                    break
        
        new_seg = seg.copy()
        new_seg["speaker"] = speaker_labels.get(best_speaker, best_speaker) if best_speaker else None
        result.append(new_seg)
    
    return result
