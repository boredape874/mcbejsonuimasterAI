$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$targetRoot = Join-Path $repoRoot "references\upstreams\MCBVanillaResourcePack"
$tmpRoot = Join-Path $env:TEMP "mcbvanilla_sync_repo"

if (Test-Path $tmpRoot) {
    Remove-Item -Recurse -Force $tmpRoot
}

git clone --depth 1 --filter=blob:none --sparse https://github.com/ZtechNetwork/MCBVanillaResourcePack.git $tmpRoot | Out-Host
if ($LASTEXITCODE -ne 0) {
    throw "git clone failed"
}

Push-Location $tmpRoot
git sparse-checkout set ui textures | Out-Host
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "git sparse-checkout failed"
}
Pop-Location

New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null

Get-ChildItem $tmpRoot -Force | ForEach-Object {
    if ($_.Name -eq ".git") {
        return
    }
    $dest = Join-Path $targetRoot $_.Name
    if (Test-Path $dest) {
        Remove-Item -Recurse -Force $dest
    }
    Copy-Item -Recurse -Force $_.FullName $dest
}

Write-Output "Synced Ztech vanilla resources to $targetRoot"
