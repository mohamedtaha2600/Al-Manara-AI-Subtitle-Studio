@echo off
chcp 65001 >nul 2>&1
title Al-Manara Model Manager

:MENU
cls
echo =========================================
echo       AL-MANARA MODEL MANAGER
echo =========================================
echo.
echo Available Whisper Models:
echo.
echo   [1] tiny    (~75 MB)   - Fastest, low accuracy
echo   [2] base    (~150 MB)  - Fast, basic accuracy
echo   [3] small   (~500 MB)  - Good balance
echo   [4] medium  (~1.5 GB)  - RECOMMENDED for Arabic
echo   [5] large-v3 (~3 GB)   - Best accuracy, slow
echo.
echo   [6] Check installed models
echo.
echo Additional AI Tools:
echo   [8] Download OFFLINE Translation (Arabic) ~150 MB
echo   [9] Install GPU Support (CUDA) ~2.5 GB
echo   [10] Download Silero VAD (Voice Detection) ~5 MB
echo   [11] Download Punctuation Model (NLTK Punkt) ~15 MB
echo.
echo System:
echo   [0] Setup/Repair Environment (Pip Install)
echo   [7] Exit
echo.
echo =========================================

:: -----------------------------------------------------
:: ENVIRONMENT CONFIGURATION (Avoid C: Drive)
:: -----------------------------------------------------
set "PROJECT_ROOT=%~dp0"
set "CACHE_DIR=%PROJECT_ROOT%cache"

:: 1. PIP Cache (For large GPU wheels)
set "PIP_CACHE_DIR=%CACHE_DIR%\pip"
if not exist "%PIP_CACHE_DIR%" mkdir "%PIP_CACHE_DIR%"

:: 2. HuggingFace Cache (For models)
set "HF_HOME=%CACHE_DIR%\huggingface"
if not exist "%HF_HOME%" mkdir "%HF_HOME%"

:: 3. Torch Cache
set "TORCH_HOME=%CACHE_DIR%\torch"
if not exist "%TORCH_HOME%" mkdir "%TORCH_HOME%"

:: 4. XDG Data (For Argos Translate & others)
set "XDG_DATA_HOME=%CACHE_DIR%\local_share"
if not exist "%XDG_DATA_HOME%" mkdir "%XDG_DATA_HOME%"

:: -----------------------------------------------------

set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto DOWNLOAD_TINY
if "%choice%"=="2" goto DOWNLOAD_BASE
if "%choice%"=="3" goto DOWNLOAD_SMALL
if "%choice%"=="4" goto DOWNLOAD_MEDIUM
if "%choice%"=="5" goto DOWNLOAD_LARGE
if "%choice%"=="6" goto CHECK_MODELS
if "%choice%"=="7" exit
if "%choice%"=="8" goto DOWNLOAD_OFFLINE_TRANSLATION
if "%choice%"=="9" goto INSTALL_GPU
if "%choice%"=="10" goto DOWNLOAD_VAD
if "%choice%"=="11" goto DOWNLOAD_PUNKT
if "%choice%"=="0" goto SETUP_ENV
goto MENU

:CHECK_MODELS
cls
echo =========================================
echo       INSTALLED MODELS
echo =========================================
echo.
echo Checking models folder...
echo.

set "models_dir=%~dp0models"
if not exist "%models_dir%" (
    echo [!] Models folder not found!
    echo [!] No models installed yet.
    goto CHECK_END
)

echo Models directory: %models_dir%
echo.

if exist "%models_dir%\tiny" ( echo [OK] tiny - Installed ) else ( echo [  ] tiny - Not installed )
if exist "%models_dir%\base" ( echo [OK] base - Installed ) else ( echo [  ] base - Not installed )
if exist "%models_dir%\small" ( echo [OK] small - Installed ) else ( echo [  ] small - Not installed )
if exist "%models_dir%\medium" ( echo [OK] medium - Installed ) else ( echo [  ] medium - Not installed )
if exist "%models_dir%\large-v3" ( echo [OK] large-v3 - Installed ) else ( echo [  ] large-v3 - Not installed )

:CHECK_END
echo.
echo =========================================
pause
goto MENU

:DOWNLOAD_TINY
set MODEL_NAME=tiny
set MODEL_SIZE=75 MB
goto DOWNLOAD

:DOWNLOAD_BASE
set MODEL_NAME=base
set MODEL_SIZE=150 MB
goto DOWNLOAD

:DOWNLOAD_SMALL
set MODEL_NAME=small
set MODEL_SIZE=500 MB
goto DOWNLOAD

:DOWNLOAD_MEDIUM
set MODEL_NAME=medium
set MODEL_SIZE=1.5 GB
goto DOWNLOAD

:DOWNLOAD_LARGE
set MODEL_NAME=large-v3
set MODEL_SIZE=3 GB
goto DOWNLOAD

:DOWNLOAD
cls
echo =========================================
echo       DOWNLOADING MODEL: %MODEL_NAME%
echo =========================================
echo.
echo Model: %MODEL_NAME%
echo Size: ~%MODEL_SIZE%
echo.

set "models_dir=%~dp0models\%MODEL_NAME%"
if exist "%models_dir%" (
    echo [!] Model "%MODEL_NAME%" is already installed at:
    echo %models_dir%
    echo.
    set /p overwrite="Do you want to re-download? (y/n): "
    if /i not "%overwrite%"=="y" goto MENU
)

echo.
echo [INFO] Activating Python Environment...
echo.

cd /d "%~dp0"

:: Check if backend/venv exists
if not exist "backend\venv" (
    echo [ERROR] Virtual environment not found in backend\venv
    echo [ERROR] Please run install.bat first!
    pause
    goto MENU
)

:: Activate Virtual Environment
call backend\venv\Scripts\activate.bat

:: Install faster-whisper if missing (just in case)
pip install faster-whisper --quiet

echo.
echo [INFO] Starting download script...
echo This may take several minutes depending on your internet speed.
echo.

python download_model.py %MODEL_NAME%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Download failed!
    echo Please check your internet connection.
) else (
    echo.
    echo [SUCCESS] Model "%MODEL_NAME%" is ready!
    echo.
)

echo.
pause
goto MENU

:DOWNLOAD_OFFLINE_TRANSLATION
cls
echo =========================================
echo   OFFLINE TRANSLATION (Arabic)
echo =========================================
echo.
echo This will download Argos Translate for
echo Arabic translation WITHOUT internet.
echo.
echo Size: ~150 MB
echo.

cd /d "%~dp0"
call backend\venv\Scripts\activate.bat

echo [INFO] Installing Argos Translate...
pip install argostranslate --quiet

echo.
echo [INFO] Downloading Arabic language pack...
python -c "import argostranslate.package; argostranslate.package.update_package_index(); packs = argostranslate.package.get_available_packages(); en_ar = next((p for p in packs if p.from_code == 'en' and p.to_code == 'ar'), None); en_ar.install() if en_ar else print('Pack not found')"

echo.
echo [SUCCESS] Offline translation is ready!
echo You can now translate to Arabic without internet.
echo.
pause
goto MENU

:INSTALL_GPU
cls
echo =========================================
echo   GPU SUPPORT (CUDA)
echo =========================================
echo.
echo This will install PyTorch with CUDA support
echo for NVIDIA GPUs (10-20x faster transcription!)
echo.
echo Requirements:
echo   - NVIDIA GPU (GTX 1060 or better)
echo   - NVIDIA Drivers installed
echo.
echo Size: ~2.5 GB
echo.

set /p confirm="Install GPU support? (y/n): "
if /i not "%confirm%"=="y" goto MENU

cd /d "%~dp0"
call backend\venv\Scripts\activate.bat

echo.
echo [INFO] Installing PyTorch with CUDA 11.8...
echo This may take several minutes...
echo.

pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

echo.
echo [INFO] Verifying GPU detection...
python -c "import torch; print('CUDA Available:', torch.cuda.is_available()); print('GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'None')"

echo.
echo [SUCCESS] GPU support installed!
echo Restart the server to use GPU acceleration.
echo.
pause
goto MENU

:DOWNLOAD_VAD
set MODEL_NAME=silero-vad
set MODEL_SIZE=5 MB
goto DOWNLOAD

:DOWNLOAD_PUNKT
set MODEL_NAME=punkt
set MODEL_SIZE=15 MB
goto DOWNLOAD

:SETUP_ENV
cls
echo =========================================
echo   SETUP / REPAIR ENVIRONMENT
echo =========================================
echo.
echo This will install/update all required 
echo Python libraries from requirements.txt.
echo.
cd /d "%~dp0"
if not exist "backend\venv" (
    echo [INFO] Creating Virtual Environment...
    python -m venv backend\venv
)
call backend\venv\Scripts\activate.bat
echo [INFO] Installing requirements...
pip install -r backend\requirements.txt
pip install faster-whisper --upgrade
echo.
echo [SUCCESS] Environment is ready!
echo.
pause
goto MENU
