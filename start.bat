@echo off
setlocal
cd /d "%~dp0"

echo Starting Kemite website...
echo Frontend: http://127.0.0.1:8080
echo Admin:    http://127.0.0.1:8080/admin.html
echo API:      http://127.0.0.1:3001
echo.

start "Kemite API" cmd /k "cd /d %~dp0 && node server/src/index.js"
start "Kemite Website" cmd /k "cd /d %~dp0 && python -m http.server 8080 --bind 127.0.0.1"

echo Started. You can close this window.
pause
