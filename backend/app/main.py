"""
Al-Manara Creative Suite - Backend Application
استوديو المنارة الإبداعي - التطبيق الخلفي

Main FastAPI application entry point with CORS, WebSocket support,
and API routing configuration.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import setup_directories, UPLOAD_DIR, TEMP_DIR, EXPORT_DIR
from services.storage_service import cleanup_by_age, cleanup_by_size

from controllers.transcription import router as transcription_router
from controllers.file_handler import router as file_router
from controllers.video_editor import router as video_router
from controllers.silence_remover import router as silence_router
from controllers.export import router as export_router
from services.websocket_manager import ConnectionManager

# WebSocket connection manager for real-time updates
manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events - startup and shutdown."""
    setup_directories()
    
    # Startup Cleanup: Remove temp and export files older than 24 hours
    print("🧹 Running startup storage cleanup...")
    try:
        cleanup_by_age(TEMP_DIR, max_hours=24)
        cleanup_by_age(EXPORT_DIR, max_hours=24)
        # Also ensure uploads don't exceed 5GB on startup
        cleanup_by_size(UPLOAD_DIR, max_mb=5120)
    except Exception as e:
        print(f"⚠️ Startup cleanup failed: {e}")
        
    yield
    # Shutdown
    print("👋 Shutting down Al-Manara Backend...")
    # Global cleanup of temp on exit as well
    cleanup_by_age(TEMP_DIR, max_hours=0) 


# Create FastAPI application
app = FastAPI(
    title="Al-Manara Creative Suite API",
    description="AI-Powered Auto-Captioning & Translation System",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for HF/Vercel compatibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(file_router, prefix="/api", tags=["Files"])
app.include_router(transcription_router, prefix="/api", tags=["Transcription"])
app.include_router(video_router, prefix="/api", tags=["Video"])
app.include_router(silence_router, prefix="/api", tags=["Silence"])
app.include_router(export_router, prefix="/api", tags=["Export"])


@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "status": "online",
        "message": "Al-Manara Creative Suite API",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "upload": "/api/upload",
            "transcribe": "/api/transcribe",
            "export": "/api/export"
        }
    }


@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "model": "ready"}


@app.get("/api/system_check")
async def system_check():
    """Perform a detailed system requirements check."""
    import shutil
    import psutil
    import platform
    
    # 1. GPU Check
    gpu_status = {"available": False, "name": "Not Found"}
    try:
        import torch
        if torch.cuda.is_available():
            gpu_status = {
                "available": True,
                "name": torch.cuda.get_device_name(0),
                "vram": f"{torch.cuda.get_device_properties(0).total_memory / (1024**3):.1f} GB"
            }
    except Exception:
        pass

    # 2. Disk Check
    total, used, free = shutil.disk_usage("/")
    disk_status = {
        "total": f"{total / (1024**3):.1f} GB",
        "free": f"{free / (1024**3):.1f} GB",
        "percent": f"{(used/total)*100:.1f}%"
    }

    # 3. Memory Check
    mem = psutil.virtual_memory()
    mem_status = {
        "total": f"{mem.total / (1024**3):.1f} GB",
        "available": f"{mem.available / (1024**3):.1f} GB",
        "percent": f"{mem.percent}%"
    }

    # 4. Dependency Check
    dependencies = {
        "faster_whisper": False,
        "nltk": False,
        "torch": False,
        "onnxruntime": False
    }
    try:
        import faster_whisper
        dependencies["faster_whisper"] = True
    except ImportError: pass
    
    try:
        import nltk
        dependencies["nltk"] = True
    except ImportError: pass
    
    try:
        import torch
        dependencies["torch"] = True
    except ImportError: pass

    try:
        import onnxruntime
        dependencies["onnxruntime"] = True
    except ImportError: pass

    return {
        "success": True,
        "os": f"{platform.system()} {platform.release()}",
        "python": platform.python_version(),
        "gpu": gpu_status,
        "disk": disk_status,
        "memory": mem_status,
        "dependencies": dependencies,
        "status": "ready"
    }


@app.websocket("/ws/progress")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time progress updates.
    
    Clients connect here to receive live transcription progress,
    status updates, and log messages.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and listen for client messages
            data = await websocket.receive_text()
            # Echo back for debugging
            await manager.send_personal_message(f"Received: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Export manager for use in other modules
def get_ws_manager() -> ConnectionManager:
    """Get the WebSocket connection manager instance."""
    return manager
