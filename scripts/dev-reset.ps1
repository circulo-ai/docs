param(
  [int[]]$Ports = @(3000,3001,3002),
  [switch]$SkipDev
)

Set-StrictMode -Version Latest

$devProcessNames = @('node.exe', 'cmd.exe', 'pnpm.exe', 'pnpm.cmd')

# Kill stale dev process trees from this repo, including wrapper ancestors
# (turbo/pnpm/cmd/node that may not carry repo path in their own commandline).
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$allProcesses = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue

$processById = @{}
foreach ($process in $allProcesses) {
  $processById[[int]$process.ProcessId] = $process
}

$repoProcessIds = New-Object "System.Collections.Generic.HashSet[int]"
foreach ($process in $allProcesses) {
  if (
    $process.Name -in $devProcessNames -and
    $process.CommandLine -like "*$repoRoot*"
  ) {
    $null = $repoProcessIds.Add([int]$process.ProcessId)
  }
}

$killProcessIds = New-Object "System.Collections.Generic.HashSet[int]"
foreach ($repoProcessId in $repoProcessIds) {
  $null = $killProcessIds.Add($repoProcessId)
  $currentId = $repoProcessId

  while ($processById.ContainsKey($currentId)) {
    $parentId = [int]$processById[$currentId].ParentProcessId
    if ($parentId -le 0 -or -not $processById.ContainsKey($parentId)) {
      break
    }

    $parent = $processById[$parentId]
    $parentName = "$($parent.Name)".ToLowerInvariant()
    $parentCmd = "$($parent.CommandLine)"

    $isDevWrapper =
      ($parentName -in $devProcessNames) -and (
        $parentCmd -match 'pnpm\.cjs' -or
        $parentCmd -match '\bturbo\b' -or
        $parentCmd -match 'next\\dist\\bin\\next' -or
        $parentCmd -match 'cross-env' -or
        $parentCmd -match '\brun dev\b'
      )

    if (-not $isDevWrapper) {
      break
    }

    $null = $killProcessIds.Add($parentId)
    $currentId = $parentId
  }
}

if ($killProcessIds.Count -gt 0) {
  Write-Host "Killing repo dev wrapper tree processes: $($killProcessIds.Count)"
  foreach ($processId in ($killProcessIds | Sort-Object -Descending)) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
} else {
  Write-Host "No repo-scoped dev wrapper processes found."
}

$repoProcRemaining = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
  Where-Object {
    $_.Name -in $devProcessNames -and
    $_.CommandLine -like "*$repoRoot*"
  }

if ($repoProcRemaining) {
  Write-Host "Warning: some repo dev processes are still alive:"
  $repoProcRemaining |
    Select-Object ProcessId, Name, CommandLine |
    Format-Table -AutoSize |
    Out-Host
}

$listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $Ports -contains $_.LocalPort }

if ($listeners) {
  $processIds = $listeners | Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($processId in $processIds) {
    $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($null -ne $proc) {
      Write-Host "Stopping PID $processId ($($proc.ProcessName))"
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }
} else {
  Write-Host "No listeners found on ports: $($Ports -join ', ')"
}

Start-Sleep -Milliseconds 300

$remaining = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $Ports -contains $_.LocalPort }

if ($remaining) {
  $busy = $remaining |
    Select-Object `
      @{ Name = 'Port'; Expression = { $_.LocalPort } }, `
      @{ Name = 'PID'; Expression = { $_.OwningProcess } } |
    Sort-Object Port

  Write-Host "Ports still busy:"
  $busy | Format-Table -AutoSize | Out-Host
}

Write-Host "Stopping Turborepo daemon..."
& pnpm turbo daemon stop

if (-not $SkipDev) {
  Write-Host "Starting dev..."
  & pnpm dev
}
