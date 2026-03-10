@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Starting Django server...
echo Open in browser: http://127.0.0.1:8000/admin/
echo Press Ctrl+C to stop.
echo.
python manage.py runserver 0.0.0.0:8000
pause
