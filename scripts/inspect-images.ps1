Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem -Path "d:\menu\images\c_*.jpg"
$results = foreach ($f in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($f.FullName)
        [PSCustomObject]@{
            Name   = $f.Name
            Width  = $img.Width
            Height = $img.Height
            Ratio  = [math]::Round($img.Width / $img.Height, 2)
            SizeKB = [math]::Round($f.Length / 1KB, 1)
        }
        $img.Dispose()
    } catch {
        Write-Warning "Could not read $($f.Name): $_"
    }
}

$results | Format-Table -AutoSize
