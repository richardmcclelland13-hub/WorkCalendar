$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dest = Join-Path $PSScriptRoot "app\src\main\assets\www"

New-Item -ItemType Directory -Force -Path $dest | Out-Null
Get-ChildItem -Path $dest -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

$files = @(
  "index.html",
  "styles.css",
  "app.js",
  "tracker.js",
  "tracker-db.js",
  "manifest.json",
  "icon.svg",
  "icon.png",
  "sw.js",
  "assets"
)

foreach ($file in $files) {
  $source = Join-Path $root $file
  $target = Join-Path $dest $file
  if (Test-Path $source -PathType Container) {
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    Copy-Item -Recurse -Force (Join-Path $source "*") $target
  } else {
    Copy-Item -Force $source $target
  }
}

Write-Host "Synced web assets to $dest"
