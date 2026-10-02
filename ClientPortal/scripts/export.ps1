<#
.SYNOPSIS
  Packages this project as a zip in .\dist to copy to another machine.

.DESCRIPTION
  Never includes .env, user lists, recordings, saved sign-ins or past results.

  Default: source only (small). The target machine needs Node.js and internet access to run
  "npm ci" and "npx playwright install chromium".

  -Offline: also bundles node_modules and the Chromium browser, so the target machine only needs
  Node.js. The target must be Windows x64 like this one.

.EXAMPLE
  .\scripts\export.ps1
  .\scripts\export.ps1 -Offline
#>
param([switch]$Offline)
$ErrorActionPreference = 'Stop'

$root = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $root 'dist'
$stage = Join-Path $dist 'ClientPortal'
if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory -Force $stage | Out-Null

robocopy $root $stage /E /NFL /NDL /NJH /NJS /NP `
  /XD node_modules dist test-results playwright-report results recordings .auth ms-playwright `
  /XF .env users.txt users.csv | Out-Null
# robocopy exit codes below 8 mean success.
if ($LASTEXITCODE -ge 8) { throw "Copy failed (robocopy exit code $LASTEXITCODE)" }

if ($Offline) {
  Push-Location $stage
  try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
    $env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $stage 'ms-playwright'
    npx playwright install chromium
    if ($LASTEXITCODE -ne 0) { throw 'Browser download failed' }
  } finally {
    Pop-Location
    Remove-Item Env:PLAYWRIGHT_BROWSERS_PATH -ErrorAction SilentlyContinue
  }
}

$kind = if ($Offline) { 'offline' } else { 'source' }
$zip = Join-Path $dist "ClientPortal-$kind-$(Get-Date -Format 'yyyyMMdd-HHmm').zip"
# Windows' own tar writes zips; Git for Windows puts a GNU tar earlier on PATH that cannot.
& "$env:SystemRoot\System32\tar.exe" -a -c -f $zip -C $dist ClientPortal
if ($LASTEXITCODE -ne 0) { throw 'Creating the zip failed' }
Remove-Item -Recurse -Force $stage

Write-Host "Created $zip ($([math]::Round((Get-Item $zip).Length / 1MB, 1)) MB)"
