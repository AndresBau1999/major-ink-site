# Makes small previews of every artist photo for faster pages.
# Run from this folder after adding or replacing photos in images/artists:
#   powershell -ExecutionPolicy Bypass -File make-thumbs.ps1
# Writes images/thumbs/<artist>/<n>.jpg (560px wide). Safe to re-run.
Add-Type -AssemblyName System.Drawing
$src = Join-Path $PSScriptRoot 'images\artists'
$dst = Join-Path $PSScriptRoot 'images\thumbs'
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]78)

Get-ChildItem $src -Recurse -Filter *.jpg | ForEach-Object {
  $out = Join-Path $dst $_.FullName.Substring($src.Length + 1)
  New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
  $ms = New-Object System.IO.MemoryStream(, [System.IO.File]::ReadAllBytes($_.FullName))
  $img = [System.Drawing.Image]::FromStream($ms)
  $w = [Math]::Min(560, $img.Width)
  $h = [int]($img.Height * $w / $img.Width)
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, 0, 0, $w, $h)
  $g.Dispose(); $img.Dispose(); $ms.Dispose()
  $bmp.Save($out, $codec, $params)
  $bmp.Dispose()
}
Write-Output "Thumbnails updated in images/thumbs"
