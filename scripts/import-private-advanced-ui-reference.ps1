param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [string]$DestinationPath = "references/private/advanced-ui-reference"
)

$ErrorActionPreference = "Stop"

if ($DestinationPath -ne "references/private/advanced-ui-reference") {
  throw "Use scripts/import-private-ui-reference.ps1 for custom destinations."
}

& (Join-Path $PSScriptRoot "import-private-ui-reference.ps1") `
  -SourcePath $SourcePath `
  -ReferenceName "advanced-ui-reference"
