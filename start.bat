@echo off
echo ==================================================
echo   Starting Cash Flow Forecasting Dashboard...
echo ==================================================

echo.
echo Starting Backend Server (Port 5000)...
start cmd /k "cd backend && npm install && node server.js"

echo Starting Frontend Server (Port 5173)...
start cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Done! Both servers are starting up in separate windows.
echo - The frontend dashboard will be available at: http://localhost:5173
echo - The backend API is running on: http://localhost:5000
echo.
pause
