@echo off
echo ==============================================
echo       Starting TripSaathi Backend (FastAPI)
echo ==============================================
cd /d "%~dp0backend"

if exist ".venv\Scripts\python.exe" (
    echo Using backend virtual environment (.venv)...
    ".venv\Scripts\python.exe" src/main.py
) else (
    echo Running with system Python...
    python src/main.py
)

pause
