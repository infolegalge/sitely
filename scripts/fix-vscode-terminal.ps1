$settingsPath = "$env:APPDATA\Code\User\settings.json"
$json = Get-Content $settingsPath -Raw | ConvertFrom-Json

# Fix terminal settings for Georgian keyboard layout
$json | Add-Member -NotePropertyName "terminal.integrated.sendKeybindingsToShell" -NotePropertyValue $false -Force
$json | Add-Member -NotePropertyName "terminal.integrated.shellIntegration.enabled" -NotePropertyValue $true -Force
$json | Add-Member -NotePropertyName "terminal.integrated.detectLocale" -NotePropertyValue "off" -Force
$json | Add-Member -NotePropertyName "terminal.integrated.gpuAcceleration" -NotePropertyValue "off" -Force

$json | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
Write-Output "User settings updated successfully."
Write-Output "Please restart VS Code completely (close all windows and reopen)."
