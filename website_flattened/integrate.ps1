# Read all three files
$indexContent = Get-Content 'C:\Users\vico\index.html' -Raw -Encoding UTF8
$cssContent = Get-Content 'C:\Users\vico\styles.css' -Raw -Encoding UTF8
$jsContent = Get-Content 'C:\Users\vico\script.js' -Raw -Encoding UTF8

# Replace the CSS link with embedded CSS
$newContent = $indexContent -replace '<link rel="stylesheet" href="styles.css">', ("<style>`n" + $cssContent + "`n</style>")

# Replace the JS script tag with embedded JS
$newContent = $newContent -replace '<script src="script.js"></script>', ("<script>`n" + $jsContent + "`n</script>")

# Write the complete file
[System.IO.File]::WriteAllText('C:\Users\vico\CTA_Complete_Report.html', $newContent, [System.Text.Encoding]::UTF8)

Write-Host "Integration complete!"