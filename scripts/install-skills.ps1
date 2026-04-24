$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceBase = Join-Path $repoRoot "skills"
$targetBase = Join-Path $HOME ".codex\\skills"

New-Item -ItemType Directory -Force -Path $targetBase | Out-Null

Get-ChildItem $sourceBase -Directory | ForEach-Object {
    $target = Join-Path $targetBase $_.Name

    if (Test-Path $target) {
        Remove-Item -Recurse -Force $target
    }

    Copy-Item -Recurse -Force $_.FullName $target
    Write-Output "Installed $($_.Name)"
}

Write-Output "Done."
