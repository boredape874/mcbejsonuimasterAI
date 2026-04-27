param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [Parameter(Mandatory = $true)]
  [ValidatePattern("^[A-Za-z0-9._-]+$")]
  [string]$ReferenceName,

  [string]$DestinationRoot = "references/private"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SourcePath -PathType Container)) {
  throw "SourcePath does not exist or is not a directory: $SourcePath"
}

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$privateRoot = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $DestinationRoot))
$destinationFull = [System.IO.Path]::GetFullPath((Join-Path $privateRoot $ReferenceName))

$privatePrefix = $privateRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar, [System.IO.Path]::AltDirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
if (-not $destinationFull.StartsWith($privatePrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Destination must stay inside repository private references: $destinationFull"
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

function Copy-If-Exists {
  param(
    [Parameter(Mandatory = $true)][string]$Source,
    [Parameter(Mandatory = $true)][string]$Destination
  )

  if (Test-Path -LiteralPath $Source -PathType Leaf) {
    $parent = Split-Path -Parent $Destination
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    Copy-Item -LiteralPath $Source -Destination $Destination -Force
    return $true
  }

  return $false
}

$totalTextureFiles = 0
$index = 1
foreach ($pack in $uiPacks) {
  $targetName = if ($index -eq 1) { "ui-pack" } else { "ui-pack-$('{0:D2}' -f $index)" }
  $targetPath = Join-Path $destinationFull $targetName
  New-Item -ItemType Directory -Path $targetPath -Force | Out-Null

  Copy-Item -LiteralPath (Join-Path $pack.FullName "ui") -Destination (Join-Path $targetPath "ui") -Recurse -Force

  $textureRefs = New-Object System.Collections.Generic.HashSet[string]
  Get-ChildItem -LiteralPath (Join-Path $targetPath "ui") -Recurse -File -Filter "*.json" | ForEach-Object {
    $matches = Select-String -LiteralPath $_.FullName -Pattern "textures/[A-Za-z0-9_\-+./]+" -AllMatches
    foreach ($match in $matches.Matches) {
      [void]$textureRefs.Add($match.Value.TrimEnd(".", ",", ";", ":", ")", "]", "}"))
    }
  }

  foreach ($textureRef in $textureRefs) {
    $normalRef = $textureRef -replace "/", [System.IO.Path]::DirectorySeparatorChar
    $candidates = @()
    $extension = [System.IO.Path]::GetExtension($normalRef)
    if ($extension) {
      $candidates += $normalRef
    } else {
      $candidates += "$normalRef.png"
      $candidates += "$normalRef.json"
      $candidates += "$normalRef.tga"
      $candidates += "$normalRef.jpg"
      $candidates += "$normalRef.jpeg"
    }

    foreach ($candidate in $candidates) {
      $sourceFile = Join-Path $pack.FullName $candidate
      $destFile = Join-Path $targetPath $candidate
      if (Copy-If-Exists -Source $sourceFile -Destination $destFile) {
        $totalTextureFiles++
      }
    }
  }

  $index++
}

$files = Get-ChildItem -LiteralPath $destinationFull -Recurse -File
$json = ($files | Where-Object Extension -eq ".json").Count
$png = ($files | Where-Object Extension -eq ".png").Count
$sizeMb = [math]::Round(($files | Measure-Object Length -Sum).Sum / 1MB, 2)

Write-Host "Imported private UI reference:"
Write-Host "  reference:      $ReferenceName"
Write-Host "  destination:    $destinationFull"
Write-Host "  ui packs:       $($uiPacks.Count)"
Write-Host "  files:          $($files.Count)"
Write-Host "  json:           $json"
Write-Host "  png:            $png"
Write-Host "  copied texture files: $totalTextureFiles"
Write-Host "  size MB:        $sizeMb"
