@echo off
cd /d %~dp0
echo Starting MySQL service...
net start MySQL80 >nul 2>&1
echo Starting PantryBoard...
start "" http://localhost:8000/PantryBoard.html
npm start