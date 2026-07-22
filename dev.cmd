@echo off
REM Start backend locally. CWD must be backend/ so pydantic reads backend/.env
REM (root .env is compose vars only). Do NOT add --reload (see CLAUDE.md).
cd /d "%~dp0backend"
".venv\Scripts\python.exe" -m uvicorn app.main:app --port 8000 --reload
