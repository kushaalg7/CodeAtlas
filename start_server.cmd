@echo off
cd /d "%~dp0"
echo ===============================================================
echo   Starting CODE ATLAS Web Application at http://localhost:3000
echo ===============================================================

set "NODE_CMD=node"
if exist "%APPDATA%\Antigravity\bin\agy-node.cmd" (
  set "NODE_CMD=%APPDATA%\Antigravity\bin\agy-node.cmd"
)

echo Using Node runner: %NODE_CMD%
start http://localhost:3000
"%NODE_CMD%" --experimental-strip-types tools\serve.ts
pause
