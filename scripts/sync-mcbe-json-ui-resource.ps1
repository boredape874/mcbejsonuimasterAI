param(
  [string]$UpstreamPath = "references/upstreams/mcbe-json-ui-resource"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $UpstreamPath)) {
  git clone --depth 1 https://github.com/boredape874/mcbe-json-ui-resource.git $UpstreamPath
} else {
  git -C $UpstreamPath pull --ff-only
}

$commit = git -C $UpstreamPath rev-parse --short HEAD
Write-Host "Synced mcbe-json-ui-resource at $commit into $UpstreamPath"
