@echo off
cd /d "%~dp0"
echo ===============================================================
echo   Starting Complete CODE ATLAS Master Test Suite...
echo ===============================================================

set "NODE_CMD=node"
if exist "%APPDATA%\Antigravity\bin\agy-node.cmd" (
  set "NODE_CMD=%APPDATA%\Antigravity\bin\agy-node.cmd"
)

echo Using Node runner: %NODE_CMD%
"%NODE_CMD%" --experimental-strip-types tools\run_complete_suite.ts
pause
