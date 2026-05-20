@echo off
echo.
echo ==========================================
echo   STP Training App - Local Server
echo ==========================================
echo.
echo Starting server on port 8080...
echo.
echo On THIS computer, open:  http://localhost:8080
echo.
echo On Dad's PHONE (same WiFi), open:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    echo   http://%%a:8080
)
echo.
echo Then tap "Add to Home Screen" in Chrome menu
echo to install it as an app!
echo.
echo Press Ctrl+C to stop the server.
echo ==========================================
echo.
npx -y serve -l 8080 -s .
