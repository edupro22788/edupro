@echo off
title EDU PRO - النشر على Railway
echo ============================================================
echo   EDU PRO
echo   النشر على Railway - اضغط أي مفتاح للبدء
echo ============================================================
pause >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\MSI\Documents\Default Project\edupro\scripts\deploy-railway.ps1"
pause