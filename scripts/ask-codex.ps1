# Runs one Codex turn in the CHAT.md discussion. Usage: & .\scripts\ask-codex.ps1
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path $PSScriptRoot -Parent)
$imgs = Get-ChildItem docs\plan\screens\*.jpg | ForEach-Object { $_.FullName }
$imgArgs = @(); foreach ($i in $imgs) { $imgArgs += '-i'; $imgArgs += $i }
Write-Host "== Codex turn started $(Get-Date -Format HH:mm:ss) ==" -ForegroundColor Yellow
Get-Content scripts\codex-prompt.txt -Raw | codex exec --skip-git-repo-check -s workspace-write @imgArgs -
Write-Host "== Codex turn finished $(Get-Date -Format HH:mm:ss) ==" -ForegroundColor Yellow
Set-Content -Path scripts\.codex-done -Value (Get-Date -Format o)
