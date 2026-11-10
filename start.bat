@echo off
cd /d "%~dp0"

set "PY="
python --version >nul 2>&1 && set "PY=python"
if not defined PY python3 --version >nul 2>&1 && set "PY=python3"
if not defined PY if exist "D:\KimiData\daimon-share\daimon\runtime\python\.venv\Scripts\python.exe" set "PY=D:\KimiData\daimon-share\daimon\runtime\python\.venv\Scripts\python.exe"
if not defined PY if exist "C:\Python312\python.exe" set "PY=C:\Python312\python.exe"
if not defined PY if exist "C:\Program Files\Python312\python.exe" set "PY=C:\Program Files\Python312\python.exe"

if not defined PY (
    echo ERROR: Python not found.
    echo Please install Python 3 from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

%PY% scripts\launch.py
