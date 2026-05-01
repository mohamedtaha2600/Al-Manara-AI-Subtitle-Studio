# Al-Manara Creative Suite - Backend

This is the backend service for Al-Manara Creative Suite, powered by:
- **FastAPI** for REST API
- **OpenAI Whisper** for transcription
- **FFmpeg** for video/audio processing

## Quick Start

```bash
# Activate virtual environment
venv\Scripts\activate

# Run server
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

- `POST /api/upload` - Upload video/audio file
- `POST /api/transcribe` - Start transcription
- `GET /api/status/{job_id}` - Get job status
- `POST /api/export` - Export subtitles
- `WS /ws/progress` - Real-time progress updates
