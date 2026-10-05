<#
.SYNOPSIS
  Logs in as every user in the user list and checks Service Request History, then lists who failed.

.EXAMPLE
  .\scripts\run-bulk.ps1                                   # all users in test-data\users.txt, one at a time
  .\scripts\run-bulk.ps1 -Limit 10                         # trial run on the first 10 users
  .\scripts\run-bulk.ps1 -UsersFile D:\secure\users.csv -Workers 4
  .\scripts\run-bulk.ps1 -UsersFile .\failed-users.txt     # re-run only the users who failed last time
#>
param(
  # .txt (one login per line) or .csv (header row; uses the username/email/login column, else the first).
  [string]$UsersFile,
  # Users checked at the same time.
  [int]$Workers = 1,
  # Only check the first N users (0 = all).
  [int]$Limit = 0,
  # Seconds to wait on the Services page before signing out.
  [int]$IdleSeconds = 3,
  # Extra attempts for a user who fails, to rule out a passing glitch.
  [int]$Retries = 1,
  # Show the browsers.
  [switch]$Headed
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

# An offline export carries its own browser in .\ms-playwright.
$bundledBrowsers = Join-Path (Get-Location) 'ms-playwright'
if (Test-Path $bundledBrowsers) { $env:PLAYWRIGHT_BROWSERS_PATH = $bundledBrowsers }

if ($UsersFile) { $env:USERS_FILE = (Resolve-Path $UsersFile).Path }
$env:WORKERS = $Workers
$env:BULK_LIMIT = $Limit
$env:BULK_IDLE_MS = $IdleSeconds * 1000
$env:BULK_RETRIES = $Retries
if ($Headed) { $env:HEADED = '1' }

npx playwright test --project=bulk
exit $LASTEXITCODE
