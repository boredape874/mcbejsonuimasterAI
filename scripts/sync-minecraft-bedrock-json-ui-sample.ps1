param(
    [string]$Destination = "references/upstreams/minecraft-bedrock-json-ui-sample",
    [string]$Repository = "https://github.com/boredape874/minecraft-bedrock-json-ui-sample"
)

$ErrorActionPreference = "Stop"

if (Test-Path -LiteralPath (Join-Path $Destination ".git")) {
    git -C $Destination pull --ff-only
} else {
    $parent = Split-Path -Parent $Destination
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent | Out-Null
    }
    git clone $Repository $Destination
}

git -C $Destination rev-parse --short HEAD
