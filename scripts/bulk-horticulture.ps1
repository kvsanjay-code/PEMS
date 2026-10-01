<#
.SYNOPSIS
  Creates many Horticulture inspections in parallel, one REX each.

.DESCRIPTION
  1. Imports REX numbers from a text file into the pool (optional).
  2. Checks there are enough unused Horticulture REX numbers.
  3. Runs a small trial batch and stops if anything fails.
  4. Runs the rest.
  5. Opens the HTML report (REX and inspection ID for every run).

  Every run that reaches Create spends one REX, so use -DryRun first to see what would run.

.EXAMPLE
  .\scripts\bulk-horticulture.ps1 -RexFile rex-numbers.txt -Count 100
.EXAMPLE
  .\scripts\bulk-horticulture.ps1 -Count 100 -DryRun
.EXAMPLE
  .\scripts\bulk-horticulture.ps1 -Count 12 -Workers 3 -TrialCount 3 -Headed
#>
param(
  # Text file with one REX number per line. Omit if the numbers are already in the pool.
  [string]$RexFile,
  # Total number of inspections to create (trial included).
  [int]$Count = 100,
  # Browsers running at the same time.
  [int]$Workers = 6,
  # Inspections in the trial batch. 0 skips the trial.
  [int]$TrialCount = 6,
  # Stop the main batch after this many failures, to limit REX numbers lost to a systemic problem.
  [int]$MaxFailures = 5,
  # Show the browsers. Bulk runs are headless by default.
  [switch]$Headed,
  # Print the commands without running anything.
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

function Invoke-Step([string]$Title, [string]$Command) {
  Write-Host "`n=== $Title ===" -ForegroundColor Cyan
  Write-Host "> $Command" -ForegroundColor DarkGray
  if ($DryRun) { return 0 }
  # Send output to the console, otherwise PowerShell returns it to the caller along with the exit code.
  Invoke-Expression $Command | Out-Host
  return $LASTEXITCODE
}

function Get-UnusedHorticultureCount {
  [int](node -e "const fs=require('fs');const f='test-data/rex-pool.json';const p=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):[];console.log(p.filter(e=>e.type==='Horticulture'&&!e.used).length)")
}

if ($TrialCount -gt $Count) { throw "-TrialCount ($TrialCount) cannot be more than -Count ($Count)." }
$env:HEADLESS = if ($Headed) { '0' } else { '1' }
$parallel = "--workers=$Workers --fully-parallel"

# 1. Load the REX numbers
if ($RexFile) {
  $code = Invoke-Step 'Import REX numbers' "npm run rex:import --silent -- `"$RexFile`" Horticulture"
  if ($code -ne 0) { throw "REX import reported problems (exit code $code). Fix the file and try again." }
}

# 2. Confirm there are enough unused REX numbers
$null = Invoke-Step 'REX pool status' 'npm run rex:status --silent'
$unused = Get-UnusedHorticultureCount
if ($unused -lt $Count) {
  $message = "Only $unused unused Horticulture REX numbers, but -Count is $Count."
  if ($DryRun) { Write-Warning $message } else { throw $message }
}

# 3. Trial batch: stop here if anything fails
if ($TrialCount -gt 0) {
  $code = Invoke-Step "Trial: $TrialCount inspection(s)" "npx playwright test horticulture-inspection --repeat-each=$TrialCount $parallel --max-failures=2"
  if ($code -ne 0) {
    Write-Host "`nTrial failed - main batch not started. Check the report: npm run report" -ForegroundColor Red
    exit $code
  }
}

# 4. The rest
$rest = $Count - $TrialCount
if ($rest -gt 0) {
  $code = Invoke-Step "Main batch: $rest inspection(s)" "npx playwright test horticulture-inspection --repeat-each=$rest $parallel --max-failures=$MaxFailures"
  if ($code -ne 0) { Write-Host "`nSome runs failed - see the report." -ForegroundColor Yellow }
}

# 5. Report: REX and inspection ID for every run
$null = Invoke-Step 'REX pool status after the run' 'npm run rex:status --silent'
$null = Invoke-Step 'Open the HTML report' 'npm run report'
