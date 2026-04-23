@echo off
setlocal

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm not found. Install Node.js from https://nodejs.org and try again.
    exit /b 1
)

cd /d "%~dp0app"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Could not change to app directory.
    exit /b 1
)

echo Building portable exe...
npm run dist
if %ERRORLEVEL% neq 0 (
    echo.
    echo BUILD FAILED. Check the output above for errors.
    exit /b 1
)

echo.
echo Build complete. Output: %~dp0app\dist\
