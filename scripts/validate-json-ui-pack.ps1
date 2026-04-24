param(
  [Parameter(Mandatory = $true)]
  [string]$PackPath,

  [switch]$AllowPartialUiDefs,

  [switch]$AllowMissingTextures,

  [int]$MaxWarnings = 50
)

$ErrorActionPreference = "Stop"

$pack = Resolve-Path -LiteralPath $PackPath
$uiRoot = Join-Path $pack "ui"
$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

if (-not (Test-Path $uiRoot) -and (Test-Path (Join-Path $pack "_ui_defs.json"))) {
  $uiRoot = $pack.Path
  $pack = Split-Path $uiRoot -Parent
}

function Remove-JsonComments([string]$Text) {
  $result = New-Object System.Text.StringBuilder
  $inString = $false
  $escaped = $false
  $i = 0

  while ($i -lt $Text.Length) {
    $ch = $Text[$i]
    $next = if ($i + 1 -lt $Text.Length) { $Text[$i + 1] } else { [char]0 }

    if ($inString) {
      [void]$result.Append($ch)
      if ($escaped) {
        $escaped = $false
      } elseif ($ch -eq '\') {
        $escaped = $true
      } elseif ($ch -eq '"') {
        $inString = $false
      }
      $i++
      continue
    }

    if ($ch -eq '"') {
      $inString = $true
      [void]$result.Append($ch)
      $i++
      continue
    }

    if ($ch -eq '/' -and $next -eq '/') {
      while ($i -lt $Text.Length -and $Text[$i] -notin "`r", "`n") {
        $i++
      }
      continue
    }

    if ($ch -eq '/' -and $next -eq '*') {
      $i += 2
      while ($i + 1 -lt $Text.Length -and -not ($Text[$i] -eq '*' -and $Text[$i + 1] -eq '/')) {
        $i++
      }
      $i += 2
      continue
    }

    [void]$result.Append($ch)
    $i++
  }

  return $result.ToString()
}

function Read-JsonFile([string]$Path) {
  try {
    return Remove-JsonComments (Get-Content -Raw -Encoding UTF8 -LiteralPath $Path) | ConvertFrom-Json
  } catch {
    $script:errors.Add("Invalid JSON: $Path :: $($_.Exception.Message)")
    return $null
  }
}

if (-not (Test-Path $uiRoot)) {
  $errors.Add("Missing ui directory: $uiRoot")
} else {
  Get-ChildItem -LiteralPath $uiRoot -Recurse -File -Include *.json | ForEach-Object {
    [void](Read-JsonFile $_.FullName)
  }
}

$defsPath = Join-Path $uiRoot "_ui_defs.json"
if (Test-Path $defsPath) {
  $defs = Read-JsonFile $defsPath
  if ($defs -and $defs.ui_defs) {
    foreach ($entry in $defs.ui_defs) {
      $candidate = Join-Path $pack $entry
      if (-not (Test-Path $candidate)) {
        if ($AllowPartialUiDefs) {
          $warnings.Add("_ui_defs entry not present in this partial mirror: $entry")
        } else {
          $errors.Add("_ui_defs entry does not exist: $entry")
        }
      }
    }
  } else {
    $warnings.Add("_ui_defs.json exists but has no ui_defs array")
  }
} else {
  $warnings.Add("No ui/_ui_defs.json found")
}

$textureRefs = New-Object System.Collections.Generic.HashSet[string]
if (Test-Path $uiRoot) {
  Get-ChildItem -LiteralPath $uiRoot -Recurse -File -Include *.json | ForEach-Object {
    $text = Get-Content -Raw -Encoding UTF8 -LiteralPath $_.FullName
    [regex]::Matches($text, '"(textures/[^"]+)"') | ForEach-Object {
      [void]$textureRefs.Add($_.Groups[1].Value)
    }
  }
}

foreach ($texture in $textureRefs) {
  $pathNoExt = Join-Path $pack $texture
  $exists = (Test-Path $pathNoExt) -or (Test-Path "$pathNoExt.png") -or (Test-Path "$pathNoExt.tga") -or (Test-Path "$pathNoExt.jpg") -or (Test-Path "$pathNoExt.jpeg") -or (Test-Path "$pathNoExt.json")
  if (-not $exists -and -not $AllowMissingTextures) {
    $warnings.Add("Texture reference not found in pack: $texture")
  }
}

if ($errors.Count -gt 0) {
  Write-Host "Errors:"
  $errors | ForEach-Object { Write-Host " - $_" }
}

if ($warnings.Count -gt 0) {
  Write-Host "Warnings:"
  $warnings | Select-Object -First $MaxWarnings | ForEach-Object { Write-Host " - $_" }
  if ($warnings.Count -gt $MaxWarnings) {
    Write-Host " - ... $($warnings.Count - $MaxWarnings) more warning(s)"
  }
}

if ($errors.Count -gt 0) {
  exit 1
}

Write-Host "JSON UI validation completed with $($warnings.Count) warning(s)."
