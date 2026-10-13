Add-Type -AssemblyName System.Drawing

$imagesDir = "d:\menu\images"
$backupDir = Join-Path $imagesDir "raw_backup"
$origPath = Join-Path $imagesDir "c_pieces.jpg"
$backupPath = Join-Path $backupDir "c_pieces.jpg"

if (-not (Test-Path $origPath)) {
    Write-Error "File not found: $origPath"
    exit 1
}

# Update backup with the new raw version
Copy-Item -Path $origPath -Destination $backupPath -Force
Write-Host "Updated raw backup: $backupPath"

$rawSizeKB = [math]::Round((Get-Item $origPath).Length / 1KB, 1)

$srcImg = [System.Drawing.Image]::FromFile($origPath)
$srcW = $srcImg.Width
$srcH = $srcImg.Height

Write-Host "Original dimensions: ${srcW}x${srcH} ($rawSizeKB KB)"

$targetWidth = 1200
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

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]84)

$tempFile = $origPath + ".tmp.jpg"
$destBmp.Save($tempFile, $jpegCodec, $encoderParams)
$destBmp.Dispose()

Move-Item -Path $tempFile -Destination $origPath -Force

$newFile = Get-Item $origPath
$newSizeKB = [math]::Round($newFile.Length / 1KB, 1)
$savings = [math]::Round((1 - ($newSizeKB / $rawSizeKB)) * 100, 1)

Write-Host "`nOptimized c_pieces.jpg:" -ForegroundColor Green
Write-Host "Dimensions: ${newW}x${newH}"
Write-Host "Size: $rawSizeKB KB -> $newSizeKB KB (Reduced by $savings%)"
