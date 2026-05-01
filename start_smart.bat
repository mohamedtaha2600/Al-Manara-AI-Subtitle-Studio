@echo off
chcp 65001 >nul
title Al-Manara Creative Suite
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         Al-Manara Creative Suite - SMART START               ║
echo ║              استوديو المنارة الإبداعي                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: ═══════════════════════════════════════════════════════════════════
:: 1. Check if installed
:: ═══════════════════════════════════════════════════════════════════
if not exist "backend\venv" (
    color 0C
    echo   ❌ ERROR: Not installed!
    echo   ❌ خطأ: لم يتم التثبيت!
    echo.
    echo   Please run: install.bat first
    pause
    exit /b 1
)

:: ═══════════════════════════════════════════════════════════════════
:: 2. Smart GPU Detection (Auto-inject DLL paths if available)
:: ═══════════════════════════════════════════════════════════════════
set "VENV_SITE=%~dp0backend\venv\Lib\site-packages"
set "CUBLAS_BIN=%VENV_SITE%\nvidia\cublas\bin"
set "CUDNN_BIN=%VENV_SITE%\nvidia\cudnn\bin"
set "GPU_MODE=0"
set "PYTHONUNBUFFERED=1"

if exist "%CUBLAS_BIN%\cublas64_12.dll" (
    set "GPU_MODE=1"
    set "PATH=%CUBLAS_BIN%;%CUDNN_BIN%;%PATH%"
    echo   🚀 GPU Mode: NVIDIA libraries detected - GPU acceleration enabled!
    echo   🚀 وضع GPU: تم رصد مكتبات نفيديا - التسريع مفعل!
) else (
    echo   💻 CPU Mode: No GPU libraries found - Using CPU (slower but works)
    echo   💻 وضع CPU: لا توجد مكتبات GPU - استخدام المعالج
)

echo.

:: ═══════════════════════════════════════════════════════════════════
:: 3. CLEANUP GHOST PROCESSES (Safety First)
:: ═══════════════════════════════════════════════════════════════════
echo   🧹 Cleaning ghost processes and locks...
echo   🧹 تنظيف العمليات العالقة...

:: Kill node processes on port 3000 (Frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    if NOT "%%a"=="0" taskkill /F /PID %%a /T 2>nul
)

:: Kill python processes on port 8000 (Backend)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    if NOT "%%a"=="0" taskkill /F /PID %%a /T 2>nul
)

:: Force remove Next.js lock if exists
if exist "frontend\.next\dev\lock" (
    del /f /q "frontend\.next\dev\lock" 2>nul
)

echo   ✅ Cleanup complete!
echo.

:: ═══════════════════════════════════════════════════════════════════
:: 4. Start Backend (High Priority, Minimized)
:: ═══════════════════════════════════════════════════════════════════
echo   [1/2] Starting Backend Server...
echo   [1/2] تشغيل الخادم الخلفي...
start "Al-Manara Backend" /min /high cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && set PATH=%CUBLAS_BIN%;%CUDNN_BIN%;%PATH% && venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

:: Wait for backend to initialize
timeout /t 4 /nobreak >nul

:: ═══════════════════════════════════════════════════════════════════
:: 5. Start Frontend (Minimized)
:: ═══════════════════════════════════════════════════════════════════
echo   [2/2] Starting Frontend...
echo   [2/2] تشغيل الواجهة...
start "Al-Manara Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Wait for frontend to initialize
timeout /t 5 /nobreak >nul

:: ═══════════════════════════════════════════════════════════════════
:: 5. Open Browser & Done
:: ═══════════════════════════════════════════════════════════════════
echo.
echo ══════════════════════════════════════════════════════════════
echo.
if "%GPU_MODE%"=="1" (
    color 0A
    echo   ✅ Application Started with GPU Acceleration!
    echo   ✅ التطبيق يعمل بتسريع كارت الشاشة!
) else (
    color 0E
    echo   ✅ Application Started (CPU Mode)
    echo   ✅ التطبيق يعمل (وضع المعالج)
)
echo.
echo   🌐 Open in browser:  http://localhost:3000
echo.
echo ══════════════════════════════════════════════════════════════
echo.

start http://localhost:3000
exit
