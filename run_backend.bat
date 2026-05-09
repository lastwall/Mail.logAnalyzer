@echo off
echo Starting Mail Log Analyzer Backend...
cd /d "%~dp0"
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
pause
