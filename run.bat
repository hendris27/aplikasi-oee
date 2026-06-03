@echo off
setlocal enabledelayedexpansion
title OEE Test - Single PC
color 0A

:: 1. Ambil IP asli PC Utama dari Jaringan (Aman dari spasi tersembunyi)
set "IP=127.0.0.1"
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "RAW_IP=%%a"
    set "IP=!RAW_IP: =!"
    goto found_ip
)
:found_ip

:: 2. Jalankan Node.js (Server Gabung: WS port 8000 + API Excel port 3000)
start "OEE Server Gabung" cmd /k "node server.js"

:: 3. Jalankan Laravel Web OEE (Binding ke 0.0.0.0 agar bisa diakses publik lewat IP)
start "Laravel :8080" cmd /k "php artisan serve --host=0.0.0.0 --port=8080"

echo =======================================================
echo               OEE SYSTEM READY (PC UTAMA)
echo =======================================================
echo  [Akses PC Utama]   : http://localhost:8080
echo  [Akses PC Klien]   : http://%IP%:8080
echo.
echo  [WebSocket Port]  : ws://%IP%:8000
echo  [API Excel Port]  : http://%IP%:3000
echo =======================================================
echo  Menunggu server Laravel siap merespon browser...
echo.

:wait_laravel
timeout /t 2 /nobreak >nul
:: Melakukan cek ping ke port Laravel demi memastikan web sudah up
curl -s --max-time 2 http://localhost:8080 >nul 2>&1
if errorlevel 1 goto wait_laravel

:: 4. Otomatis buka browser lokal di PC Utama
start "" "http://localhost:8080"
echo  [SUKSES] Web OEE berhasil dibuka di browser!
echo.
pause