@echo off
chcp 65001 >nul
color 0A
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         Al-Manara Creative Suite - INSTALLER                 ║
echo ║              تثبيت استوديو المنارة الإبداعي                   ║
echo ║                                                              ║
echo ║   شغّل هذا الملف مرة واحدة فقط - Run this ONCE only         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo ══════════════════════════════════════════════════════════════
echo   [1/4] Creating Python Virtual Environment
echo         إنشاء البيئة الافتراضية
echo ══════════════════════════════════════════════════════════════
echo.

cd backend

:: Delete old venv if exists (to avoid conflicts)
if exist "venv" (
    echo   Removing old virtual environment...
    rmdir /s /q venv
)

python -m venv venv
echo   ✓ Virtual environment created

echo.
echo ══════════════════════════════════════════════════════════════
echo   [2/4] Installing Python Packages (using faster-whisper)
echo         تثبيت مكتبات Python
echo ══════════════════════════════════════════════════════════════
echo.

call venv\Scripts\activate.bat
python -m pip install --upgrade pip setuptools wheel --quiet

echo   Installing requirements from requirements.txt...
pip install -r requirements.txt

echo.
echo   ✓ Python packages installed

cd ..

echo.
echo ══════════════════════════════════════════════════════════════
echo   [3/4] Installing Node.js Packages
echo         تثبيت مكتبات Node.js
echo ══════════════════════════════════════════════════════════════
echo.

cd frontend
call npm install
echo.
echo   ✓ Node.js packages installed

cd ..

echo.
echo ══════════════════════════════════════════════════════════════
echo   [4/4] Creating Required Folders
echo         إنشاء المجلدات المطلوبة
echo ══════════════════════════════════════════════════════════════
echo.

mkdir shared\uploads 2>nul
mkdir shared\exports 2>nul
echo   ✓ Folders created

echo.
echo ══════════════════════════════════════════════════════════════
echo   [5/5] AI Model Setup
echo         إعداد نموذج الذكاء الاصطناعي
echo ══════════════════════════════════════════════════════════════
echo.

if exist "models\medium" (
    echo   ✅ Recommended model (medium) already exists.
    echo   ✅ النموذج الموصى به موجود بالفعل.
    goto FINISH
)

set /p download_now="Do you want to download the recommended AI model (medium, 1.5GB) now? (y/n): "
if /i "%download_now%"=="y" (
    echo   Downloading model...
    call backend\venv\Scripts\activate.bat
    python download_model.py medium
) else (
    echo   Skip download. You can download it later using download_model.bat
    echo   تخطي التحميل. يمكنك تحميله لاحقاً باستخدام download_model.bat
)

:FINISH
echo.
echo.
color 0B
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║   ✅ INSTALLATION COMPLETE! - تم التثبيت بنجاح!              ║
echo ║                                                              ║
echo ║   Now run: start_smart.bat                                   ║
echo ║   الآن شغّل: start_smart.bat                                 ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
