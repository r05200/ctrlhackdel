@echo off
REM NEXUS Skill Tree - Complete Startup Script
REM Starts both backend and frontend servers

echo.
echo ==================================================
echo.
echo   ╔═══════════════════════════════════════════╗
echo   ║   🧠 NEXUS Skill Tree Starting...        ║
echo   ║   Backend + Frontend Integration         ║
echo   ╚═══════════════════════════════════════════╝
echo.
echo ==================================================
echo.

REM Check if Node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found

REM Start Backend
echo.
echo 🚀 Starting Backend Server (Port 5000)...
echo.
start "NEXUS Backend" cmd /k "cd backend && npm start"

REM Wait for backend to start
timeout /t 3 /nobreak

REM Start Frontend
echo.
echo 🚀 Starting Frontend Dev Server (Port 3000)...
echo.
start "NEXUS Frontend" cmd /k "cd frontend && npm run dev"

REM Wait a moment for frontend to start
timeout /t 3 /nobreak

echo.
echo ==================================================
echo.
echo   ✅ NEXUS Skill Tree is launching!
echo.
echo   🌐 Frontend: http://localhost:3000
echo   ⚙️  Backend:  http://localhost:5000
echo.
echo   Both windows should open automatically.
echo   Close either window to stop that server.
echo.
echo ==================================================
echo.
pause
