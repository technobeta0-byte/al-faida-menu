@echo off
chcp 65001 >nul
title منيو الفائدة - تحديث ونشر المنيو
cd /d "%~dp0"

echo ======================================================
echo          منيو الفائدة - تحديث ونشر المنيو
echo ======================================================
echo.
echo [1/2] جاري جلب أحدث البيانات والصور من Google Sheets...
echo.

node scripts/sheet-to-json.mjs
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ حدث خطأ أثناء جلب البيانات من Google Sheets. تأكد من اتصال الإنترنت.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ======================================================
echo [2/2] جاري النشر على GitHub والتحديث على Cloudflare...
echo ======================================================
echo.

node upload.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ حدث خطأ أثناء الرفع إلى GitHub.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ======================================================
echo  ✔ تم تحديث ونشر المنيو بنجاح!
echo  ✔ التعديلات تظهر على الدومين و Cloudflare خلال 30-60 ثانية.
echo ======================================================
echo.
pause
