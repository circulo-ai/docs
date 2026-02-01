param(
  [switch]$WhatIf
)

Set-StrictMode -Version Latest

$root = Get-Location
$targets = @(
  ".next",
  ".turbo",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".vercel",
  ".cache",
  ".swc"
)

foreach ($name in $targets) {
  Get-ChildItem -Path $root -Force -Directory -Recurse -Filter $name -ErrorAction SilentlyContinue |
    ForEach-Object {
      if ($WhatIf) {
        Write-Host "[dry-run] remove dir $($_.FullName)"
      } else {
        Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
      }
    }
}

Get-ChildItem -Path $root -Force -File -Recurse -Filter "pnpm-lock.yaml" -ErrorAction SilentlyContinue |
  ForEach-Object {
    if ($WhatIf) {
      Write-Host "[dry-run] remove file $($_.FullName)"
    } else {
      Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue
    }
  }

Get-ChildItem -Path $root -Force -File -Recurse -Filter ".eslintcache" -ErrorAction SilentlyContinue |
  ForEach-Object {
    if ($WhatIf) {
      Write-Host "[dry-run] remove file $($_.FullName)"
    } else {
      Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue
    }
  }

Get-ChildItem -Path $root -Force -File -Recurse -Filter "*.tsbuildinfo" -ErrorAction SilentlyContinue |
  ForEach-Object {
    if ($WhatIf) {
      Write-Host "[dry-run] remove file $($_.FullName)"
    } else {
      Remove-Item -LiteralPath $_.FullName -Force -ErrorAction SilentlyContinue
    }
  }
