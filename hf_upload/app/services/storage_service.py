import os
import time
import shutil
from pathlib import Path
from typing import List, Union

def get_dir_size_mb(directory: Union[str, Path]) -> float:
    """Calculate total size of a directory in MB."""
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(directory):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            # skip if it is symbolic link
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)
    return total_size / (1024 * 1024)

def cleanup_by_age(directory: Union[str, Path], max_hours: float = 24):
    """Delete files older than max_hours in a directory."""
    now = time.time()
    cutoff = now - (max_hours * 3600)
    
    deleted_count = 0
    directory = Path(directory)
    if not directory.exists():
        return 0
        
    for item in directory.iterdir():
        if item.is_file():
            if item.stat().st_mtime < cutoff:
                try:
                    item.unlink()
                    deleted_count += 1
                except Exception as e:
                    print(f"⚠️ Error deleting {item}: {e}")
        elif item.is_dir():
            # Recursively check subdirectories if they are older
            if item.stat().st_mtime < cutoff:
                try:
                    shutil.rmtree(item)
                    deleted_count += 1
                except Exception as e:
                    print(f"⚠️ Error deleting directory {item}: {e}")
                    
    return deleted_count

def cleanup_by_size(directory: Union[str, Path], max_mb: float = 2048):
    """
    Ensure directory size is below max_mb by deleting oldest files.
    Default limit is 2GB.
    """
    directory = Path(directory)
    if not directory.exists():
        return 0
        
    current_size = get_dir_size_mb(directory)
    if current_size <= max_mb:
        return 0
        
    # Get all files with their mtime
    files = []
    for item in directory.iterdir():
        if item.is_file():
            files.append((item, item.stat().st_mtime))
            
    # Sort by mtime (oldest first)
    files.sort(key=lambda x: x[1])
    
    deleted_count = 0
    for item, mtime in files:
        if current_size <= max_mb:
            break
        
        file_size_mb = os.path.getsize(item) / (1024 * 1024)
        try:
            item.unlink()
            current_size -= file_size_mb
            deleted_count += 1
        except Exception as e:
            print(f"⚠️ Error deleting {item}: {e}")
            
    return deleted_count

def cleanup_project_files(file_id: str, directories: List[Union[str, Path]]):
    """Delete all files starting with a specific file_id in multiple directories."""
    deleted_count = 0
    for directory in directories:
        directory = Path(directory)
        if not directory.exists():
            continue
            
        for item in directory.iterdir():
            if item.name.startswith(file_id):
                try:
                    if item.is_file():
                        item.unlink()
                    else:
                        shutil.rmtree(item)
                    deleted_count += 1
                except Exception as e:
                    print(f"⚠️ Error deleting project item {item}: {e}")
                    
    return deleted_count
