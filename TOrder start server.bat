@echo off
title TOrder Server
cd /d "%~dp0"

echo Starting MongoDB...
start cmd /k "mongod"

timeout /t 3

echo Starting TOrder...
npm run dev

pause