<#!
.SYNOPSIS
  Manage dev servers for People Network (Windows PowerShell 5.1+)

.DESCRIPTION
  Starts/stops frontend (Vite) and backend (Express/ts-node-dev) in separate PowerShell windows.
  Stores PIDs in .run\pids.json for later stop/status.

.PARAMETER Action
  One of: start, stop, status, restart

.EXAMPLE
  ./manage.ps1 start
  ./manage.ps1 status
  ./manage.ps1 stop

.NOTES
  - This script launches new PowerShell windows so logs remain visible.
  - Ensure npm dependencies are installed in both frontend and backend folders.
#>
param(
  [ValidateSet('start','stop','status','restart')]
  [string]$Action = 'start'
)

$ErrorActionPreference = 'Stop'

function Get-Root {
  if ($PSScriptRoot) { return $PSScriptRoot }
  if ($MyInvocation.MyCommand.Path) { return (Split-Path -Parent $MyInvocation.MyCommand.Path) }
  return (Get-Location).Path
}

function Ensure-RunDir {
  param([string]$Path)
  if (-not (Test-Path $Path)) { New-Item -Path $Path -ItemType Directory | Out-Null }
}

function Get-PidFile { param([string]$Root) Join-Path $Root '.run/pids.json' }

function Read-Pids {
  param([string]$PidFile)
  if (Test-Path $PidFile) {
    try {
      $obj = Get-Content $PidFile -Raw | ConvertFrom-Json
      $ht = @{}
      if ($obj.PSObject.Properties['backend']) { $ht.backend = [int]$obj.backend }
      if ($obj.PSObject.Properties['frontend']) { $ht.frontend = [int]$obj.frontend }
      return $ht
    } catch { @{} }
  } else { @{} }
}

function Write-Pids {
  param([string]$PidFile, $Pids)
  $Pids | ConvertTo-Json | Set-Content -Path $PidFile -Encoding UTF8
}

function Is-Alive { param([int]$ProcessId) try { Get-Process -Id $ProcessId -ErrorAction Stop | Out-Null; $true } catch { $false } }

$root = Get-Root
$runDir = Join-Path $root '.run'
$pidFile = Get-PidFile -Root $root

switch ($Action) {
  'start' {
    Ensure-RunDir -Path $runDir
    $pids = Read-Pids -PidFile $pidFile

    if ($pids.backend -and (Is-Alive -ProcessId $pids.backend)) { Write-Host "Backend already running (PID $($pids.backend))" }
    else {
      $backend = Start-Process -FilePath powershell -ArgumentList @('-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-Command', "npm run dev") -WorkingDirectory (Join-Path $root 'backend') -PassThru
      $pids.backend = $backend.Id
      Write-Host "Started backend (PID $($backend.Id))"
    }

    if ($pids.frontend -and (Is-Alive -ProcessId $pids.frontend)) { Write-Host "Frontend already running (PID $($pids.frontend))" }
    else {
      $frontend = Start-Process -FilePath powershell -ArgumentList @('-NoLogo','-NoProfile','-ExecutionPolicy','Bypass','-Command', "npm run dev") -WorkingDirectory (Join-Path $root 'frontend') -PassThru
      $pids.frontend = $frontend.Id
      Write-Host "Started frontend (PID $($frontend.Id))"
    }

    Write-Pids -PidFile $pidFile -Pids $pids
  }

  'status' {
    $pids = Read-Pids -PidFile $pidFile
    if ($pids.backend) {
      if (Is-Alive -ProcessId $pids.backend) { Write-Host "Backend: RUNNING (PID $($pids.backend))" } else { Write-Host "Backend: STOPPED (last PID $($pids.backend))" }
    } else { Write-Host 'Backend: unknown' }
    if ($pids.frontend) {
      if (Is-Alive -ProcessId $pids.frontend) { Write-Host "Frontend: RUNNING (PID $($pids.frontend))" } else { Write-Host "Frontend: STOPPED (last PID $($pids.frontend))" }
    } else { Write-Host 'Frontend: unknown' }
  }

  'stop' {
    $pids = Read-Pids -PidFile $pidFile
    if ($pids.backend) {
      if (Is-Alive -ProcessId $pids.backend) { Write-Host "Stopping backend (PID $($pids.backend))"; Stop-Process -Id $pids.backend -Force -ErrorAction SilentlyContinue }
      else { Write-Host 'Backend already stopped' }
      if ($pids.ContainsKey('backend')) { $pids.Remove('backend') | Out-Null }
    } else { Write-Host 'Backend PID not found' }

    if ($pids.frontend) {
      if (Is-Alive -ProcessId $pids.frontend) { Write-Host "Stopping frontend (PID $($pids.frontend))"; Stop-Process -Id $pids.frontend -Force -ErrorAction SilentlyContinue }
      else { Write-Host 'Frontend already stopped' }
      if ($pids.ContainsKey('frontend')) { $pids.Remove('frontend') | Out-Null }
    } else { Write-Host 'Frontend PID not found' }

    Write-Pids -PidFile $pidFile -Pids $pids
  }

  'restart' {
    $scriptPath = $PSCommandPath
    if (-not $scriptPath) { $scriptPath = $MyInvocation.MyCommand.Path }
    & $scriptPath stop
    Start-Sleep -Seconds 1
    & $scriptPath start
  }
}
