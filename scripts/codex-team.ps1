# One Codex turn in team mode (it may edit code). Usage: & .\scripts\codex-team.ps1 ["extra note for Codex"]
param([string]$Note = '')
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path $PSScriptRoot -Parent)
$prompt = Get-Content scripts\codex-team-prompt.txt -Raw
if ($Note) { $prompt += "`n`nNote from Claude for this turn: $Note" }
Write-Host "== Codex team turn started $(Get-Date -Format HH:mm:ss) ==" -ForegroundColor Yellow
$prompt | codex exec --skip-git-repo-check -m gpt-6.2-astra -s workspace-write -
Write-Host "== Codex team turn finished $(Get-Date -Format HH:mm:ss) ==" -ForegroundColor Yellow
Set-Content -Path scripts\.codex-done -Value (Get-Date -Format o)
