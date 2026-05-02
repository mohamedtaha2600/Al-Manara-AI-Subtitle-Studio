import os
import sys
from pathlib import Path
import shutil

# Determine Base Directory
if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys.executable).parent
else:
    # Use environment variable or current working directory as fallback
    # This is safer for Docker/Hugging Face where file structure might vary
    BASE_DIR = Path(os.getcwd())

# Ensure we are in the right place (if app folder is sibling, we use CWD)
# In Docker, we are usually in /app which contains the 'app' folder

# Define Paths
# Stores uploaded source files
UPLOADS_DIR = BASE_DIR / "shared" / "uploads"
UPLOAD_DIR = UPLOADS_DIR # Alias for compatibility

# Stores temporary processing files (audio extraction, chunks)
# User requested this to be "inside the program" and cleaned up
TEMP_DIR = BASE_DIR / "temp"

# Default Export Directory (can be overridden by user settings in future)
EXPORTS_DIR = BASE_DIR / "shared" / "exports"
EXPORT_DIR = EXPORTS_DIR # Alias for compatibility

# Ensure directories exist
def setup_directories():
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)
    os.makedirs(EXPORT_DIR, exist_ok=True)
    print(f"📂 Directories ready:\n  Uploads: {UPLOAD_DIR}\n  Temp: {TEMP_DIR}\n  Exports: {EXPORT_DIR}")

# Cleanup Temp Directory
def cleanup_temp():
    if TEMP_DIR.exists():
        try:
            # Delete contents but keep directory
            for item in TEMP_DIR.iterdir():
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()
            print(f"🧹 Temp directory cleaned: {TEMP_DIR}")
        except Exception as e:
            print(f"⚠️ Error cleaning temp: {e}")
