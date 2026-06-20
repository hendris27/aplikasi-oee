@echo off
setlocal enabledelayedexpansion
title OEE Launcher

:: Ambil IP
set "IP=127.0.0.1"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "RAW_IP=%%a"
    set "IP=!RAW_IP: =!"
    goto found_ip
)
:found_ip

echo ======================================
echo URL : http://%IP%:8080
echo ======================================
echo.

:: Buka terminal baru untuk Node.js
start "OEE Server" cmd /k "node server.js"

:: Jalankan Laravel di terminal saat ini
php artisan serve --host=0.0.0.0 --port=8080