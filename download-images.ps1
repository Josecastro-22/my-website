$imageUrls = @{
    "hero-car.jpg" = "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=1200&q=80"
    "mercedes-sprinter.jpg" = "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1200&q=80"
    "ford-expedition.jpg" = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80"
}

foreach ($image in $imageUrls.GetEnumerator()) {
    $outFile = "public/$($image.Key)"
    Write-Host "Downloading $($image.Key)..."
    Invoke-WebRequest -Uri $image.Value -OutFile $outFile
    Write-Host "Downloaded to $outFile"
} 