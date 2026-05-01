@echo off
chcp 65001 >nul
title Al-Manara Environment Test
color 0E

echo.
echo ╔══════════════════════════════════════════════════════════════╗
║         Al-Manara Creative Suite - TEST ENVIRONMENT          ║
║              اختبار بيئة التشغيل                                ║
╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: 1. Check Virtual Environment
if not exist "backend\venv" (
    color 0C
    echo ❌ ERROR: Virtual environment not found!
    echo ❌ خطأ: البيئة الافتراضية غير موجودة!
    pause
    exit /b 1
)

:: 2. Check GPU / Torch
echo 🔍 Checking GPU Support...
call backend\venv\Scripts\activate.bat
python -c "import torch; print('🚀 CUDA Available:', torch.cuda.is_available()); print('✨ GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"

:: 3. Check Models
echo.
echo 🔍 Checking Models...
if exist "models\base" (echo ✅ Base Model: Found) else (echo ⚠️ Base Model: Missing)
if exist "models\medium" (echo ✅ Medium Model: Found) else (echo ⚠️ Medium Model: Missing)

:: 4. Run Whisper Test
echo.
echo 🔍 Running faster-whisper sanity check...
python backend\test_whisper.py --tiny

echo.
echo ══════════════════════════════════════════════════════════════
echo Test Complete. If you see errors above, run download_model.bat
echo ══════════════════════════════════════════════════════════════
pause
