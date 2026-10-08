Add-Type -AssemblyName System.Drawing

function Optimize-Image {
    param(
        [string]$Path,
        [int]$MaxDim = 450,
        [long]$Quality = 80
    )
    
    if (-not (Test-Path $Path)) { return }
    $orig = [System.Drawing.Image]::FromFile($Path)
    
    $width = $orig.Width
    $height = $orig.Height
    
    if ($width -gt $MaxDim -or $height -gt $MaxDim) {
        if ($width -gt $height) {
            $newWidth = $MaxDim
            $newHeight = [int]($height * ($MaxDim / $width))
        }
        else {
            $newHeight = $MaxDim
            $newWidth = [int]($width * ($MaxDim / $height))
        }
    }
    else {
        $newWidth = $width
        $newHeight = $height
    }
    
    $bmp = New-Object System.Drawing.Bitmap $newWidth, $newHeight
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($orig, 0, 0, $newWidth, $newHeight)
    $graphics.Dispose()
    $orig.Dispose()
    
    $tempPath = $Path + ".tmp"
    
    if ($Path.EndsWith(".png", [System.StringComparison]::OrdinalIgnoreCase)) {
        $bmp.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    else {
        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)
        $bmp.Save($tempPath, $codec, $encoderParams)
    }
    
    $bmp.Dispose()
    Move-Item -Path $tempPath -Destination $Path -Force
    
    $fileInfo = Get-Item $Path
    Write-Host "Optimized: $Path -> $([math]::Round($fileInfo.Length / 1KB, 1)) KB"
}

# Optimize logo
Optimize-Image -Path "d:\menu\images\logo.png" -MaxDim 450
Optimize-Image -Path "d:\menu\assets\brand\logo.png" -MaxDim 450

# Optimize all images
Get-ChildItem -Path "d:\menu\images" -File | Where-Object { $_.Name -ne 'logo.png' } | ForEach-Object {
    Optimize-Image -Path $_.FullName -MaxDim 450 -Quality 82
}
