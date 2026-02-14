@echo off
echo.
echo ╔═══════════════════════════════════════════╗
echo ║   🧠 NEXUS - Starting All Services      ║
echo ╚═══════════════════════════════════════════╝
echo.

REM Start backend in new window
echo [1/2] Starting Backend API...
start "NEXUS Backend" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo [2/2] Starting Frontend...
start "NEXUS Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo ✓ All services started!
echo.
echo 🚀 Frontend: http://localhost:3000
echo 📚 Backend:  http://localhost:5000
echo.
echo Press any key to stop all services...
pause >nul

REM Kill processes
taskkill /FI "WindowTitle eq NEXUS Backend*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq NEXUS Frontend*" /T /F >nul 2>&1

echo.
echo ✓ All services stopped.
pause
