@echo off
echo Preparing Hugging Face Upload...

set DEST=hf_upload

if exist %DEST% rmdir /s /q %DEST%
mkdir %DEST%
mkdir %DEST%\app

copy Dockerfile %DEST%\ >nul
copy download_model.py %DEST%\ >nul
copy backend\requirements.txt %DEST%\ >nul
xcopy backend\app %DEST%\app /E /I /Y >nul

echo Done! Folder 'hf_upload' is ready.
pause
