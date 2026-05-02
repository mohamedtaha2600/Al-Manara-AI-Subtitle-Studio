"""
File Handler Controller
التحكم في الملفات

Handles file upload, storage, and management operations.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from typing import Optional
from datetime import datetime
import os
import uuid
import aiofiles
from app.services.storage_service import cleanup_by_size, cleanup_project_files
from app.config import UPLOAD_DIR, TEMP_DIR, EXPORT_DIR

router = APIRouter()

# Configuration
ALLOWED_EXTENSIONS = {".mp4", ".mkv", ".avi", ".mov", ".webm", ".mp3", ".wav", ".m4a", ".flac"}
MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB


def ensure_upload_dir():
    """Ensure upload directory exists."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)


def validate_file_extension(filename: str) -> bool:
    """Check if file extension is allowed."""
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def generate_file_id() -> str:
    """Generate unique file ID."""
    return f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a video or audio file for processing.
    
    Args:
        file: The uploaded file (video or audio)
    
    Returns:
        dict: File ID and metadata
    
    Raises:
        HTTPException: If file type is not supported or upload fails
    """
    try:
        ensure_upload_dir()
        print(f"📤 Upload request: {file.filename}")
        print(f"📁 Upload dir: {UPLOAD_DIR}")
        
        # Validate file extension
        if not validate_file_extension(file.filename):
            raise HTTPException(
                status_code=400,
                detail=f"File type not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )
        
        # Generate unique file ID
        file_id = generate_file_id()
        ext = os.path.splitext(file.filename)[1].lower()
        saved_filename = f"{file_id}{ext}"
        file_path = os.path.join(UPLOAD_DIR, saved_filename)
        
        # Save file in chunks (better for large files)
        file_size = 0
        async with aiofiles.open(file_path, 'wb') as out_file:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                await out_file.write(chunk)
                file_size += len(chunk)
        
        print(f"✅ File saved: {file_path} ({file_size / (1024*1024):.2f} MB)")
        
        # Automatic cleanup: Ensure upload dir stays under 2GB
        try:
            cleaned = cleanup_by_size(UPLOAD_DIR, max_mb=2048)
            if cleaned > 0:
                print(f"🧹 Storage cleanup: Removed {cleaned} old files to free space.")
        except Exception as e:
            print(f"⚠️ Cleanup error during upload: {e}")
        
        return {
            "success": True,
            "file_id": file_id,
            "original_name": file.filename,
            "saved_name": saved_filename,
            "file_path": file_path,
            "file_size": file_size,
            "file_size_mb": round(file_size / (1024 * 1024), 2),
            "message": "تم رفع الملف بنجاح - File uploaded successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/files")
async def list_files():
    """
    List all uploaded files.
    
    Returns:
        dict: List of files with metadata
    """
    ensure_upload_dir()
    
    files = []
    for filename in os.listdir(UPLOAD_DIR):
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.isfile(file_path):
            stat = os.stat(file_path)
            files.append({
                "filename": filename,
                "size_mb": round(stat.st_size / (1024 * 1024), 2),
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat()
            })
    
    return {"files": files, "count": len(files)}


@router.get("/files/{file_id}")
async def get_file(file_id: str):
    """
    Get file information by ID.
    
    Args:
        file_id: The unique file identifier
    
    Returns:
        FileResponse: The requested file
    """
    ensure_upload_dir()
    
    # Find file with matching ID
    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(file_id):
            file_path = os.path.join(UPLOAD_DIR, filename)
            return FileResponse(
                path=file_path,
                filename=filename,
                media_type="application/octet-stream"
            )
    
    raise HTTPException(status_code=404, detail="File not found")


@router.delete("/files/{file_id}")
async def delete_file(file_id: str):
    """
    Delete a file by ID.
    
    Args:
        file_id: The unique file identifier
    
    Returns:
        dict: Deletion confirmation
    """
    ensure_upload_dir()
    
    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(file_id):
            file_path = os.path.join(UPLOAD_DIR, filename)
            os.remove(file_path)
            return {"success": True, "message": f"File {file_id} deleted"}
    
    raise HTTPException(status_code=404, detail="File not found")

@router.post("/cleanup/project/{file_id}")
async def cleanup_project(file_id: str):
    """
    Manually trigger cleanup for a specific project's files.
    Deletes uploads, temp files, and exports related to this ID.
    """
    try:
        count = cleanup_project_files(file_id, [UPLOAD_DIR, TEMP_DIR, EXPORT_DIR])
        return {
            "success": True, 
            "message": f"Successfully deleted {count} files related to project {file_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
