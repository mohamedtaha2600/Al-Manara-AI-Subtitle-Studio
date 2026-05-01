@echo off
chcp 65001 >nul
title Al-Manara Standalone Transcriber
color 0B

cd /d "%~dp0backend"

if not exist "venv" (
    echo.
    echo   ❌ Error: Python Environment not found! 
    echo   Please run install.bat first.
    echo.
    pause
    exit
)

:: Auto-detect and add NVIDIA DLLs to PATH
set "VENV_SITE=%~dp0backend\venv\Lib\site-packages"
set "CUBLAS_BIN=%VENV_SITE%\nvidia\cublas\bin"
set "CUDNN_BIN=%VENV_SITE%\nvidia\cudnn\bin"

if exist "%CUBLAS_BIN%\cublas64_12.dll" (
    echo   🚀 GPU Libraries Detected! Adding to PATH...
    set "PATH=%CUBLAS_BIN%;%CUDNN_BIN%;%PATH%"
)

echo.
echo   🤖 Activating Python Environment...
call venv\Scripts\activate

echo.
echo   🚀 Launching Tester...
venv\Scripts\python.exe test_whisper.py %1

pause
