@echo off
chcp 65001 >nul
title منيو الفائدة - معاينة محلية
cd /d "%~dp0"

echo ======================================================
echo          منيو الفائدة - تشغيل المعاينة المحلية
echo ======================================================
echo جاري تشغيل السيرفر المحلي وفتح المتصفح...
echo.

start "" "http://localhost:3000"

node -e "const http = require('http'), fs = require('fs'), path = require('path'); const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' }; http.createServer((req, res) => { let p = path.join(process.cwd(), decodeURIComponent(req.url.split('?')[0])); if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); if (!fs.existsSync(p)) { res.writeHead(404); return res.end('Not found'); } res.writeHead(200, { 'Content-Type': mime[path.extname(p)] || 'text/plain', 'Access-Control-Allow-Origin': '*' }); fs.createReadStream(p).pipe(res); }).listen(3000, () => { console.log('✔ المنيو يعمل الآن على الرابط: http://localhost:3000'); console.log('اضغط Ctrl+C لإيقاف السيرفر عند الانتهاء.'); });"

pause
