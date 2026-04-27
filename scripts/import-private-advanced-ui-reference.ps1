param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [string]$DestinationPath = "references/private/advanced-ui-reference"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SourcePath -PathType Container)) {
  throw "SourcePath does not exist or is not a directory: $SourcePath"
}

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$privateRoot = [System.IO.Path]::GetFullPath((Join-Path $repoRoot "references/private"))

if ([System.IO.Path]::IsPathRooted($DestinationPath)) {
  $destinationFull = [System.IO.Path]::GetFullPath($DestinationPath)
} else {
  $destinationFull = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $DestinationPath))
}

$privatePrefix = $privateRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
if (-not $destinationFull.StartsWith($privatePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "DestinationPath must be inside repository references/private: $destinationFull"
}

$sourceRoot = (Resolve-Path -LiteralPath $SourcePath).Path
$sourceRootHasUi = Test-Path -LiteralPath (Join-Path $sourceRoot "ui/_ui_defs.json")

if ($sourceRootHasUi) {
  $uiPacks = @((Get-Item -LiteralPath $sourceRoot))
} else {
  $uiPacks = @(Get-ChildItem -LiteralPath $sourceRoot -Directory | Where-Object {
    Test-Path -LiteralPath (Join-Path $_.FullName "ui/_ui_defs.json")
  } | Sort-Object Name)
}

if ($uiPacks.Count -eq 0) {
  throw "No UI pack with ui/_ui_defs.json was found under: $sourceRoot"
}

if (Test-Path -LiteralPath $destinationFull) {
  Remove-Item -LiteralPath $destinationFull -Recurse -Force
}

New-Item -ItemType Directory -Path $destinationFull -Force | Out-Null

$index = 1
foreach ($pack in $uiPacks) {
  $targetName = if ($index -eq 1) { "ui-pack" } else { "ui-pack-$('{0:D2}' -f $index)" }
  $targetPath = Join-Path $destinationFull $targetName
  Copy-Item -LiteralPath $pack.FullName -Destination $targetPath -Recurse -Force
  $index++
}

$files = Get-ChildItem -LiteralPath $destinationFull -Recurse -File
$json = ($files | Where-Object Extension -eq ".json").Count
$png = ($files | Where-Object Extension -eq ".png").Count
$sizeMb = [math]::Round(($files | Measure-Object Length -Sum).Sum / 1MB, 2)

Write-Host "Imported private advanced UI reference:"
Write-Host "  destination: $destinationFull"
Write-Host "  ui packs:    $($uiPacks.Count)"
Write-Host "  files:       $($files.Count)"
Write-Host "  json:        $json"
Write-Host "  png:         $png"
Write-Host "  size MB:     $sizeMb"
