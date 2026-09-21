# ============================================================
#  EDU PRO — ناشر Railway التلقائي
#  اضغط على السكربت وسيقوم بكل شيء: تسجيل دخول، نشر، ربط
# ============================================================
$ErrorActionPreference = "Stop"
$Root = "C:\Users\MSI\Documents\Default Project\edupro"
$Rw = "npx.cmd --yes @railway/cli"

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "   EDU PRO - النشر على Railway"            -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

Set-Location $Root

# ---- 1) تسجيل الدخول (يفتح المتصفح) ----
Write-Host "[1/5] تسجيل الدخول إلى Railway (سيُفتح المتصفح)..." -ForegroundColor Cyan
& $Rw login
if ($LASTEXITCODE -ne 0) { Write-Host "فشل تسجيل الدخول. حاول مرة أخرى." -ForegroundColor Red; pause; exit 1 }

# ---- 2) الرفع والنشر (إنشاء مشروع تلقائياً) ----
Write-Host "[2/5] رفع المشروع والنشر... (قد يستغرق بضع دقائق)" -ForegroundColor Cyan
& $Rw up -y -d
if ($LASTEXITCODE -ne 0) { Write-Host "فشل الرفع. تحقق من الاتصال ثم أعد التشغيل." -ForegroundColor Red; pause; exit 1 }

# ---- 3) المتغيرات ----
Write-Host "[3/5] ضبط المتغيرات (قاعدة بيانات، أمان، بريد)..." -ForegroundColor Cyan
$Secret = -join ((48..57) + (97..122) + (65..90) | Get-Random -Count 48 | ForEach-Object { [char]$_ })

& $Rw variable set "DATABASE_URL=file:/data/dev.db"
& $Rw variable set "UPLOAD_DIR=/data/uploads"
& $Rw variable set "MAIL_MODE=test"
& $Rw variable set "SESSION_SECRET=$Secret"

# ---- 4) القرص الدائم (يحفظ قاعدة البيانات والملفات) ----
Write-Host "[4/5] إنشاء القرص الدائم عند /data ..." -ForegroundColor Cyan
& $Rw volume add -m /data

# ---- 5) إعادة نشر بعد المتغيرات + إنشاء الرابط ----
Write-Host "[5/5] إعادة النشر بعد التهيئة وإنشاء الرابط..." -ForegroundColor Cyan
& $Rw up -y -d
& $Rw domain
& $Rw domain list

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   تم النشر! الرابط في الأعلى (يتضمن up.railway.app)"
Write-Host "   احفظه وأرسله لأي شخص ليدخل منصتك"   -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
pause