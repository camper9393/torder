@echo off
title TOrderPro Server
cd /d "%~dp0"

echo Starting MongoDB...
start cmd /k "mongod"

timeout /t 3

echo Starting TOrderPro...
npm run dev

pause