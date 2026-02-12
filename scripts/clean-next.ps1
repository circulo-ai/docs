param(
  [switch]$WhatIf
)

Set-StrictMode -Version Latest

$root = Get-Location

Get-ChildItem -Path $root -Force -Directory -Recurse -Filter ".next" -ErrorAction SilentlyContinue |
  ForEach-Object {
    if ($WhatIf) {
      Write-Host "[dry-run] remove dir $($_.FullName)"
    } else {
      Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
