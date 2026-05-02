"""
Al-Manara Model Downloader
Downloads Whisper models with VISIBLE progress bar using huggingface_hub
"""

import sys
import os
from pathlib import Path

def get_model_repo(model_name: str):
    """Get HF repo ID for the model."""
    repos = {
        "tiny": "Systran/faster-whisper-tiny",
        "base": "Systran/faster-whisper-base",
        "small": "Systran/faster-whisper-small",
        "medium": "Systran/faster-whisper-medium",
        "large-v3": "Systran/faster-whisper-large-v3",
        "silero-vad": "snakers4/silero-vad",
        "punkt": "nltk_data/punkt"
    }
    return repos.get(model_name)

def download_model(model_name: str):
    """Download a Whisper model with progress bar."""
    
    # Get models directory
    script_dir = Path(__file__).parent
    models_dir = script_dir / "models"
    model_dir = models_dir / model_name
    
    repo_id = get_model_repo(model_name)
    if not repo_id:
        print(f"[ERROR] Unknown model: {model_name}")
        return False

    print(f"[INFO] Downloading: {model_name}")
    print(f"[INFO] Source: {repo_id}")
    print(f"[INFO] Destination: {model_dir}")
    print()
    
    try:
        if model_name == "silero-vad":
            print("[INFO] Downloading Silero VAD via torch.hub...")
            import torch
            torch.hub.download_url_to_file('https://raw.githubusercontent.com/snakers4/silero-vad/master/files/silero_vad.onnx', 
                                          str(models_dir / "silero_vad.onnx"))
            print("[SUCCESS] Silero VAD downloaded!")
            return True
            
        if model_name == "punkt":
            print("[INFO] Downloading NLTK Punkt...")
            import nltk
            nltk.download('punkt', download_dir=str(script_dir / "cache" / "nltk_data"))
            # Also download punkt_tab for newer NLTK
            nltk.download('punkt_tab', download_dir=str(script_dir / "cache" / "nltk_data"))
            print("[SUCCESS] NLTK Punkt downloaded!")
            return True

        from huggingface_hub import snapshot_download
        
        # Determine strict local directory for this specific model
        # We download directly into models/<model_name>
        snapshot_download(
            repo_id=repo_id,
            local_dir=str(model_dir),
            local_dir_use_symlinks=False,
            resume_download=True,
            max_workers=4  # Fast parallel download
            # tqdm is enabled by default in snapshot_download
        )
        
        print()
        print(f"[SUCCESS] Model '{model_name}' downloaded successfully!")
        print(f"[INFO] Ready at: {model_dir}")
        
        return True
        
    except ImportError:
        print("[ERROR] huggingface_hub not installed!")
        print("[INFO] Trying to install requirements...")
        return False
        
    except Exception as e:
        print(f"\n[ERROR] Download failed: {e}")
        return False

import nltk
try:
    print("📥 Downloading NLTK punkt...")
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    print("✅ NLTK data ready.")
except Exception as e:
    print(f"⚠️ NLTK download failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python download_model.py <model_name>")
        print("Models: tiny, base, small, medium, large-v3")
        sys.exit(1)
    
    model_name = sys.argv[1]
    
    success = download_model(model_name)
    sys.exit(0 if success else 1)
