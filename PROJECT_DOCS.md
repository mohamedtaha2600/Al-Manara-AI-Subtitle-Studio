# 📖 Al-Manara AI Subtitle Studio - Project Documentation

## 🎯 Project Overview
Professional AI-powered subtitle/transcription application built with:
- **Frontend**: Next.js 14 + TypeScript + Zustand
- **Backend**: FastAPI + Python + faster-whisper
- **AI**: Whisper for transcription, Google/Argos for translation

---

## 📁 Project Structure

```
d:\PROGRAMS\Program HTML 2\AISCRIP\
├── frontend/                    # Next.js Application
│   ├── src/
│   │   ├── app/                # App Router (page.tsx = main)
│   │   ├── components/
│   │   │   ├── editor/         # Main editing components
│   │   │   │   ├── Timeline.tsx        # ⭐ TIMELINE (needs enhancement)
│   │   │   │   ├── VideoPlayer.tsx     # Video player with subtitle overlay
│   │   │   │   ├── SubtitleEditor.tsx  # Subtitle list editor
│   │   │   │   └── StylePanel.tsx      # Subtitle styling controls
│   │   │   ├── ui/             # UI components
│   │   │   │   ├── ExportModal.tsx     # Export SRT/VTT/TXT
│   │   │   │   ├── UploadModal.tsx     # File upload
│   │   │   │   └── SettingsModal.tsx   # Settings
│   │   │   └── console/        # Debug console
│   │   ├── store/              # Zustand State Management
│   │   │   ├── useProjectStore.ts      # Main store (combines slices)
│   │   │   └── slices/
│   │   │       ├── editorSlice.ts      # Segments, tracks, styles
│   │   │       ├── videoSlice.ts       # Video file, playback
│   │   │       ├── transcriptionSlice.ts # Transcription job state
│   │   │       └── types.ts            # TypeScript interfaces
│   │   └── utils/
│   │       └── subtitleUtils.ts        # SRT/VTT generation
│   └── package.json
│
├── backend/                     # FastAPI Backend
│   ├── app/
│   │   ├── main.py             # FastAPI app entry
│   │   ├── controllers/
│   │   │   ├── transcription.py # Transcription + Translation API
│   │   │   └── export.py        # ⭐ Advanced Export (XML, Burn-in)
│   │   └── services/
│   │       └── whisper_service.py # Whisper integration
│   ├── requirements.txt
│   └── venv/                   # Python virtual environment
│
├── shared/                      # Shared assets & config
├── models/                      # AI models (Whisper, VAD, etc.)
├── shared/uploads/              # Uploaded files
├── shared/exports/              # Generated export files
├── start_smart.bat              # ⭐ SMART START (Auto GPU)
├── start_test.bat               # Environment Test
└── download_model.bat           # ⭐ Model & Environment Manager
```

---

## 🔧 Key Technologies

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Zustand** for state management (sliced pattern)
- **CSS Modules** for styling

### Backend
- **FastAPI** for REST API
- **faster-whisper** for transcription (CTranslate2)
- **deep-translator** for Google/MyMemory translation
- **argostranslate** for offline translation (optional)

---

## 📊 Data Flow

```
1. User uploads video → UploadModal → Backend /api/upload
2. User clicks "Transcribe" → SubtitleEditor → Backend /api/transcribe
3. Backend uses Whisper to transcribe → Returns segments[]
4. Backend translates (if target_languages) → Returns tracks[]
5. Frontend stores in Zustand → Updates UI
6. User edits in SubtitleEditor/Timeline
7. User exports → ExportModal → Downloads SRT/VTT
```

---

## 🧩 State Structure (Zustand)

```typescript
// Main Store combines:
interface ProjectState {
  // VideoSlice
  videoFile: VideoFile | null
  currentTime: number
  isPlaying: boolean
  
  // EditorSlice
  segments: SubtitleSegment[]    // Active track's segments
  tracks: SubtitleTrack[]        // All tracks (Original, Arabic, etc.)
  activeTrackId: string | null
  style: SubtitleStyle
  
  // TranscriptionSlice
  isTranscribing: boolean
  progress: number
  jobId: string | null
}

// Key Types
interface SubtitleSegment {
  id: number
  start: number  // seconds
  end: number    // seconds
  text: string
  speaker?: string
  words?: Word[]  // For word-level timestamps
}

interface SubtitleTrack {
  id: string
  name: string
  language: string
  segments: SubtitleSegment[]
  style: SubtitleStyle
}
```

---

## 🎬 Current Timeline Features

- Speaker color coding (Phase 1)
- **Ripple Edit (B)**: Auto-shift segments on delete/resize (Phase 2)
- **Slip Tool (Y)**: Shift content within segment (Phase 2)
- **Magnet Snapping**: Snaps to playhead, gaps, & items
- **Keyboard Shortcuts**: V, B, Y, R, T, S
- **Clean Cut VAD**: Automatic silence tightening
- **Multi-Format Export**: Adobe Premiere (XML) & Burn-in

### ❌ Needs Improvement (CURRENT TASK)
1. **Subtitle Strip** - Show readable text in segments
2. **Double-click Edit** - Popup editor for segment text
3. **Smooth Playhead** - Drag with frame preview
4. **Better Scrubbing** - More precise control

---

## 🚀 Running the Project

```batch
# Start both servers
start.bat

# Or manually:
# Terminal 1 (Backend):
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 (Frontend):
cd frontend
npm run dev
```

**URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api

---

## 📝 Current Task: Timeline Enhancement

### Goals:
1. Make segments show readable text
2. Double-click opens inline text editor
3. Click anywhere = instant seek + pause
4. Drag playhead = frame preview
5. Focus on SUBTITLE editing, not video montage

### Files to Modify:
- `frontend/src/components/editor/Timeline.tsx`
- `frontend/src/components/editor/Timeline.module.css`
- `frontend/src/components/editor/VideoPlayer.tsx` (for preview callback)

---

## 🌐 API Endpoints

```
POST /api/upload              # Upload video file
POST /api/transcribe          # Start transcription job
GET  /api/transcribe/{job_id} # Get job status/results
GET  /api/models              # List Whisper models
GET  /api/status              # Server health check
```

### Transcription Request:
```json
{
  "file_id": "abc123",
  "language": "auto",
  "model_size": "medium",
  "target_languages": ["ar", "en"],
  "include_source": true
}
```

### Transcription Response:
```json
{
  "status": "completed",
  "tracks": [
    {
      "id": "track-source-en",
      "name": "Original (en)",
      "language": "en",
      "segments": [...]
    },
    {
      "id": "track-ar",
      "name": "Translation (ar)",
      "language": "ar",
      "segments": [...]
    }
  ]
}
```

---

## 🔑 Important Notes

1. **RTL Support**: Arabic text needs proper RTL handling
2. **GPU Support**: Auto-detects CUDA for 10-20x faster transcription
3. **Offline Translation**: Argos Translate available (option 8 in download_model.bat)
4. **Timeout**: Frontend polls for 30 minutes for long videos

---

## 📞 Commands for Development

```bash
# Frontend
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Check for errors

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

*Last Updated: January 2026*
