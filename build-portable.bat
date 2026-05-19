@echo off
setlocal enabledelayedexpansion

echo Checking prerequisites for build...
echo.

where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm not found.
    echo Please install Node.js from https://nodejs.org
    echo Make sure to install version 14 or newer.
    exit /b 1
)

echo [OK] npm found

for /f "tokens=*" %%i in ('npm --version 2^>nul') do set NPM_VERSION=%%i
echo [OK] npm version: %NPM_VERSION%

cd /d "%~dp0app"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Could not change to app directory.
    exit /b 1
)

if not exist "node_modules" (
    echo.
    echo ERROR: node_modules directory not found in app directory.
    echo Please run: npm install
    echo Then try building again.
    exit /b 1
)

echo [OK] node_modules found

if not exist "package.json" (
    echo ERROR: package.json not found in app directory.
    exit /b 1
)

echo [OK] package.json found

echo.
echo All prerequisites met. Building portable exe...
echo.

npm run dist
if %ERRORLEVEL% neq 0 (
    echo.
    echo BUILD FAILED. Check the output above for errors.
    exit /b 1
)

echo.
echo Build complete. Output: %~dp0app\dist\