# Script PowerShell pour démarrer le serveur de développement
Write-Host "🚀 Démarrage du serveur de développement..." -ForegroundColor Green
Write-Host "📍 Port: 9003" -ForegroundColor Yellow
Write-Host "🌐 Accès local: http://localhost:9003" -ForegroundColor Cyan
Write-Host "🔗 Admin: http://localhost:9003/admin/login" -ForegroundColor Magenta
Write-Host ""

npm run dev
