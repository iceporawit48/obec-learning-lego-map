@echo off
chcp 65001 >nul
title OBEC Learning Community - Map Server
echo ====================================================
echo  กลุ่มวิจัยและพัฒนาองค์กรแห่งการเรียนรู้ (สพฐ.)
echo  Interactive Cyber HUD Map System
echo ====================================================
echo.
echo กำลังเริ่มต้น Web Server ที่ http://localhost:8080 ...
echo.

:: เช็คว่ามี Python หรือไม่
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    start http://localhost:8080/index.html
    python -m http.server 8080
) else (
    echo [แจ้งเตือน] ไม่พบ Python ในเครื่อง
    echo กำลังเปิดไฟล์ index.html ในเบราว์เซอร์โดยตรง...
    start index.html
    pause
)
