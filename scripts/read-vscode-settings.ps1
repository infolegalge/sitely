$settingsPath = "$env:APPDATA\Code\User\settings.json"

if (-not (Test-Path $settingsPath)) {
    Write-Output "User settings not found at: $settingsPath"
    exit
}

$json = Get-Content $settingsPath -Raw
Write-Output $json
