# Rollback script to restore files from _backup_live if needed
Write-Host "Restoring files from _backup_live..." -ForegroundColor Yellow

if (Test-Path "d:\menu\_backup_live") {
    Copy-Item -Path "d:\menu\_backup_live\index.html" -Destination "d:\menu\index.html" -Force
    Copy-Item -Path "d:\menu\_backup_live\assets\*" -Destination "d:\menu\assets" -Recurse -Force
    Copy-Item -Path "d:\menu\_backup_live\data\*" -Destination "d:\menu\data" -Recurse -Force
    Copy-Item -Path "d:\menu\_backup_live\scripts\*" -Destination "d:\menu\scripts" -Recurse -Force
    Write-Host "✔ Rollback completed successfully! Live state restored." -ForegroundColor Green
} else {
    Write-Host "Error: _backup_live directory not found!" -ForegroundColor Red
}
