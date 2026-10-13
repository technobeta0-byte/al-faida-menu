Add-Type -AssemblyName System.Drawing

$imagesDir = "d:\menu\images"
$backupDir = Join-Path $imagesDir "raw_backup"

if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backup folder: $backupDir"
}

$targetWidth = 1200
$quality = 84

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)

$files = Get-ChildItem -Path $imagesDir -Filter "c_*.jpg"

$summary = foreach ($file in $files) {
    $origPath = $file.FullName
    $backupPath = Join-Path $backupDir $file.Name

    # Backup original if not already backed up
    if (-not (Test-Path $backupPath)) {
        Copy-Item -Path $origPath -Destination $backupPath -Force
    }

    $rawSizeKB = [math]::Round($file.Length / 1KB, 1)

    # Read image from backup to ensure clean source
    $srcImg = [System.Drawing.Image]::FromFile($backupPath)
    $srcW = $srcImg.Width
    $srcH = $srcImg.Height

    # Calculate proportional new dimensions
    if ($srcW -gt $targetWidth) {
        $newW = $targetWidth
        $newH = [int]($srcH * ($targetWidth / $srcW))
    } else {
        $newW = $srcW
        $newH = $srcH
    }

    $destBmp = New-Object System.Drawing.Bitmap $newW, $newH
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $g.DrawImage($srcImg, 0, 0, $newW, $newH)
    $g.Dispose()
    $srcImg.Dispose()

    # Save to temp file first
    $tempFile = $origPath + ".tmp.jpg"
    $destBmp.Save($tempFile, $jpegCodec, $encoderParams)
    $destBmp.Dispose()

    # Overwrite original
    Move-Item -Path $tempFile -Destination $origPath -Force

    $newFile = Get-Item -Path $origPath
    $newSizeKB = [math]::Round($newFile.Length / 1KB, 1)
    $savings = [math]::Round((1 - ($newSizeKB / $rawSizeKB)) * 100, 1)

    [PSCustomObject]@{
        Image       = $file.Name
        Dimensions  = "${newW}x${newH}"
        OriginalKB  = $rawSizeKB
        OptimizedKB = $newSizeKB
        Savings     = "${savings}%"
    }
}

Write-Host "`n=== OPTIMIZATION SUMMARY ===" -ForegroundColor Green
$summary | Format-Table -AutoSize
