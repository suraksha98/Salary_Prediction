@echo off
title Indian Job Market Salary Predictor & Analytics - IPEC Solutions
echo =====================================================================
echo    Indian Job Market Salary Predictor & Analytics Dashboard
echo    Developer: Suraksha, AIML Developer, IPEC Solutions PVT LTD
echo =====================================================================
echo.
echo Starting web server on http://localhost:5050 ...
echo Browser opening in 2 seconds...
timeout /t 2 /nobreak >nul
start "" http://localhost:5050
"D:\Users\Asus Laptop\anaconda3\envs\lux_env\python.exe" app.py
pause
