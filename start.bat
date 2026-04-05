@echo off
echo.
echo  ========================================
echo   LET ME DRIVE - Starting Server...
echo  ========================================
echo.

:: Check if node_modules exists
IF NOT EXIST "node_modules\" (
  echo  [1/2] Installing dependencies...
  npm install
  echo.
)

echo  [2/2] Starting Let Me Drive server...
echo.
echo  Open your browser at: http://localhost:5000
echo.

npm start
pause
