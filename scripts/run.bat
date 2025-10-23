@echo off
cd /d "%~dp0.."

python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found. Install Python 3.10+ and add it to PATH.
    pause
    exit /b 1
)

if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo Error: Failed to create virtual environment.
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo Error: Failed to activate virtual environment.
    pause
    exit /b 1
)

echo Updating pip...
python -m pip install --upgrade pip
if errorlevel 1 (
    echo Warning: Failed to update pip, continuing with current version.
)

echo Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install dependencies.
    pause
    exit /b 1
)

echo Starting application...
python -m src.main

echo.
echo Application finished. Press any key to exit...
pause >nul
