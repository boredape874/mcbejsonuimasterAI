param(
  [string]$UpstreamPath = "references/upstreams/bedrock-samples",
  [string]$OutputPath = "references/official/bedrock-samples-ui",
  [string]$Ref = "main",
  [switch]$Check
)

# Creates or updates the ignored sparse mirror of Mojang/bedrock-samples, checks
# out $Ref (a branch such as main/preview or a stable tag such as v1.26.50.4),
# then delegates the file copy and the lock file to the cross-platform Node tool
# so that the selected file list and the pinned revision live in one place:
#   tools/sync-bedrock-samples-ui.mjs -> references/official/bedrock-samples-ui.lock.json
# Use -Check to verify the committed files against the lock without writing.

$ErrorActionPreference = "Stop"

if ($Check) {
  node tools/sync-bedrock-samples-ui.mjs --check --mirror $UpstreamPath
  exit $LASTEXITCODE
}

if (-not (Test-Path $UpstreamPath)) {
  git clone --depth 1 --filter=blob:none --sparse https://github.com/Mojang/bedrock-samples.git $UpstreamPath
  if ($LASTEXITCODE -ne 0) { throw "git clone failed" }
  git -C $UpstreamPath sparse-checkout set resource_pack/ui
  if ($LASTEXITCODE -ne 0) { throw "git sparse-checkout failed" }
}

# Shallow mirrors only know the branch they were cloned with; fetch the requested
# ref explicitly so stable tags and the preview branch work without a full history.
if ($Ref -match '^v\d+\.\d+') {
  git -C $UpstreamPath fetch --depth 1 origin "refs/tags/${Ref}:refs/tags/${Ref}"
} else {
  git -C $UpstreamPath fetch --depth 1 origin "refs/heads/${Ref}:refs/remotes/origin/${Ref}"
}
if ($LASTEXITCODE -ne 0) { throw "git fetch origin $Ref failed" }
git -C $UpstreamPath checkout --quiet --detach FETCH_HEAD
if ($LASTEXITCODE -ne 0) { throw "git checkout $Ref failed" }

# Record the stable tag that points at the checked-out commit (one ls-remote, no tag flood).
$head = (git -C $UpstreamPath rev-parse HEAD).Trim()
$tagLine = git ls-remote --tags https://github.com/Mojang/bedrock-samples.git | Where-Object { $_ -match "^$head\s+refs/tags/(v[0-9.]+(-preview)?)$" } | Select-Object -First 1
if ($tagLine -and $tagLine -match 'refs/tags/(\S+)$') {
  $tag = $Matches[1]
  git -C $UpstreamPath fetch --depth 1 origin "refs/tags/${tag}:refs/tags/${tag}" 2>$null | Out-Null
}

if ($OutputPath -ne "references/official/bedrock-samples-ui") {
  Write-Warning "OutputPath is fixed to references/official/bedrock-samples-ui by the Node tool; '$OutputPath' is ignored."
}

node tools/sync-bedrock-samples-ui.mjs --mirror $UpstreamPath --ref $Ref
if ($LASTEXITCODE -ne 0) { throw "sync-bedrock-samples-ui.mjs failed with exit code $LASTEXITCODE" }

Write-Host "Synced selected bedrock-samples UI files ($Ref) and refreshed references/official/bedrock-samples-ui.lock.json"
Write-Host "Next: node tools/build-vanilla-index.mjs --force; npm test; then update docs/83-vanilla-ui-1.26.50-diff.md if screens changed"
