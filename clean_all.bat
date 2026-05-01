@echo off
chcp 65001 >nul
title Al-Manara Project Cleaner
color 0C

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║         Al-Manara Creative Suite - PROJECT CLEANER           ║
echo ║              منظف ملفات المشروع                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

set /p confirm="⚠️ This will delete all uploads, exports, and temporary files. Continue? (y/n): "
if /i not "%confirm%"=="y" exit

echo.
echo 🧹 Cleaning Uploads...
if exist "shared\uploads" (
    powershell -Command "Remove-Item 'shared\uploads\*' -Recurse -Force -ErrorAction SilentlyContinue"
    echo   ✅ Uploads cleared
)

echo 🧹 Cleaning Exports...
if exist "shared\exports" (
    powershell -Command "Remove-Item 'shared\exports\*' -Recurse -Force -ErrorAction SilentlyContinue"
    echo   ✅ Exports cleared
)

echo 🧹 Cleaning Temp Files...
if exist "temp" (
    powershell -Command "Remove-Item 'temp\*' -Recurse -Force -ErrorAction SilentlyContinue"
    echo   ✅ Temp cleared
)

echo 🧹 Cleaning Python Cache (__pycache__)...
powershell -Command "Get-ChildItem -Path 'backend' -Filter '__pycache__' -Recurse | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue"
echo   ✅ Python cache cleared

echo 🧹 Cleaning Frontend Build Cache (.next)...
if exist "frontend\.next" (
    rmdir /s /q "frontend\.next"
    echo   ✅ Frontend cache cleared
)

echo.
echo ══════════════════════════════════════════════════════════════
echo   ✨ Cleanup Complete! All core .bat files were preserved.
echo ══════════════════════════════════════════════════════════════
echo.
pause
