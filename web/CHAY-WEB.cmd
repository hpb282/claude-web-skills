@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Ban can cai Node.js 22.12 tro len tu https://nodejs.org
  pause
  exit /b 1
)
if not exist "node_modules\.bin\vite.cmd" (
  echo Dang cai thu vien cho Mam chu. Vui long doi...
  call npm.cmd ci --cache "%LOCALAPPDATA%\mam-chu-npm-cache"
  if errorlevel 1 (
    echo Cai dat chua thanh cong. Hay giu cua so nay de xem loi.
    pause
    exit /b 1
  )
)
echo Dang mo Mam chu tren trinh duyet. Hay giu cua so nay mo khi hoc.
call npm.cmd run dev -- --open
pause
