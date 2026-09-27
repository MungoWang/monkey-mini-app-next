@echo off
setlocal
set "HERE=%~dp0"
set "MINI_APP_PANEL=%HERE%prefix\node_modules\@mini-app\shell\dist"
set "MINI_APP_WINDOW=%HERE%Mohou.exe"
set "MINI_APP_RUNTIME=%HERE%runtime"
if not defined NODE_USE_SYSTEM_CA set "NODE_USE_SYSTEM_CA=1"
if not exist "%MINI_APP_RUNTIME%" mkdir "%MINI_APP_RUNTIME%"
cd /d "%HERE%prefix"
set "SKIP_WINDOW="
:loop
if defined SKIP_WINDOW (
  set "MINI_APP_SKIP_WINDOW=1"
) else (
  set "MINI_APP_SKIP_WINDOW="
)
node --import tsx "node_modules\@mini-app\shell\src\dev.ts"
set "CODE=%ERRORLEVEL%"
if "%CODE%"=="75" (
  set "SKIP_WINDOW=1"
  goto loop
)
exit /b %CODE%
