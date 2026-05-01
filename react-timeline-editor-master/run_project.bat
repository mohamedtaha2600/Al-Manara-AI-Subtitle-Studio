@echo off
setlocal

echo Checking for Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   React Timeline Editor - One-Click Run
echo ==========================================
echo.


:: Create yarn.cmd shim if it doesn't exist
if not exist "%~dp0yarn.cmd" (
    echo Creating yarn.cmd shim...
    echo @echo off> "%~dp0yarn.cmd"
    echo node "%%~dp0.yarn\releases\yarn-4.9.2.cjs" %%*>> "%~dp0yarn.cmd"
)

:: Add current directory to PATH so 'yarn' command works using our yarn.cmd shim
set "PATH=%~dp0;%PATH%"


echo Installing dependencies...
call yarn install
if %errorlevel% neq 0 (
    echo Error during installation.
    pause
    exit /b 1
)

echo.
echo Starting application...
call yarn example run

echo.
if %errorlevel% neq 0 (
    echo Application exited with error.
    pause
) else (
    echo Application stopped.
)
