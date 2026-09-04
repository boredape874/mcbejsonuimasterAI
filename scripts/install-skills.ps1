[CmdletBinding()]
param(
    [switch]$Apply,
    [switch]$Prune,
    [string[]]$ReviewedSkill = @(),
    [string]$TargetBase = (Join-Path $env:USERPROFILE '.codex\skills')
)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceBase = Join-Path $repoRoot 'skills'
$topology = Get-Content -Raw -LiteralPath (Join-Path $repoRoot 'data\skill-topology.json') | ConvertFrom-Json
$sourceSkills = @($topology.sourceSkills | Sort-Object)
$actualSkills = @(Get-ChildItem -LiteralPath $sourceBase -Directory | Where-Object Name -Like 'mcbe-json-ui-*' | Select-Object -ExpandProperty Name | Sort-Object)
if (($sourceSkills -join "`n") -ne ($actualSkills -join "`n")) { throw 'Source Skill set does not match data/skill-topology.json.' }
$resolvedSource = [IO.Path]::GetFullPath($sourceBase)
$resolvedTarget = [IO.Path]::GetFullPath($TargetBase)
if ($resolvedSource -eq $resolvedTarget -or [IO.Path]::GetPathRoot($resolvedTarget) -eq $resolvedTarget) { throw 'TargetBase must be a distinct, non-root directory.' }

function Get-TreeHash([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    $records = foreach ($file in Get-ChildItem -LiteralPath $Path -File -Recurse | Sort-Object FullName) {
        $relative = $file.FullName.Substring($Path.TrimEnd('\').Length).TrimStart('\').Replace('\', '/')
        $fileSha = [Security.Cryptography.SHA256]::Create()
        try { $fileHash = ([BitConverter]::ToString($fileSha.ComputeHash([IO.File]::ReadAllBytes($file.FullName)))).Replace('-', '').ToLowerInvariant() } finally { $fileSha.Dispose() }
        "$relative`t$fileHash"
    }
    $bytes = [Text.Encoding]::UTF8.GetBytes(($records -join "`n"))
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant() } finally { $sha.Dispose() }
}

$plan = foreach ($name in $sourceSkills) {
    $sourceHash = Get-TreeHash (Join-Path $sourceBase $name)
    $targetHash = Get-TreeHash (Join-Path $resolvedTarget $name)
    $action = if ($null -eq $targetHash) { 'install' } elseif ($sourceHash -eq $targetHash) { 'same' } elseif ($ReviewedSkill -contains $name) { 'update-reviewed' } else { 'drift-unreviewed' }
    [pscustomobject]@{ skill = $name; action = $action; sourceHash = $sourceHash; installedHash = $targetHash }
}
$installedOnly = if (Test-Path -LiteralPath $resolvedTarget) { @(Get-ChildItem -LiteralPath $resolvedTarget -Directory | Where-Object Name -Like 'mcbe-json-ui-*' | Where-Object { $sourceSkills -notcontains $_.Name } | Select-Object -ExpandProperty Name | Sort-Object) } else { @() }
$plan | ForEach-Object { Write-Output ("{0,-18} {1}" -f $_.action, $_.skill) }
foreach ($name in $installedOnly) { Write-Output ("{0,-18} {1}" -f 'installed-only', $name) }
if (-not $Apply) { Write-Output 'DRY-RUN: no files changed. Use -Apply; list every reviewed drift in -ReviewedSkill.'; return }
$unreviewed = @($plan | Where-Object action -eq 'drift-unreviewed')
if ($unreviewed.Count) { throw "Apply blocked: review drift first: $($unreviewed.skill -join ', ')" }
if ($Prune) {
    $unreviewedPrune = @($installedOnly | Where-Object { $ReviewedSkill -notcontains $_ })
    if ($unreviewedPrune.Count) { throw "Prune blocked: explicitly review installed-only Skills: $($unreviewedPrune -join ', ')" }
    $callerFiles = @(Get-ChildItem -LiteralPath $repoRoot -File -Recurse | Where-Object {
        $_.FullName -notmatch '[\\/](?:\.git|node_modules)[\\/]' -and
        $_.FullName -notin @((Join-Path $repoRoot 'data\skill-topology.json'), (Join-Path $repoRoot 'scripts\install-skills.ps1')) -and
        $_.Extension -in @('.md', '.json', '.ps1')
    })
    foreach ($name in $installedOnly) {
        $callers = @($callerFiles | Where-Object { Select-String -LiteralPath $_.FullName -SimpleMatch $name -Quiet })
        if ($callers.Count) { throw "Prune blocked: caller graph still references $name ($($callers.Count) file(s))." }
    }
}

$targetParent = Split-Path -Parent $resolvedTarget
New-Item -ItemType Directory -Force -Path $targetParent | Out-Null
$stageRoot = Join-Path $targetParent ('.skill-stage-' + [guid]::NewGuid().ToString('N'))
$backupRoot = Join-Path $targetParent ('.skill-backup-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stageRoot | Out-Null
New-Item -ItemType Directory -Path $backupRoot | Out-Null
$promoted = [Collections.Generic.List[string]]::new()
$pruned = [Collections.Generic.List[string]]::new()
try {
    foreach ($entry in $plan | Where-Object { $_.action -in @('install', 'update-reviewed') }) {
        $stage = Join-Path $stageRoot $entry.skill
        Copy-Item -Recurse -LiteralPath (Join-Path $sourceBase $entry.skill) -Destination $stage
        if ((Get-TreeHash $stage) -ne $entry.sourceHash) { throw "Staging hash mismatch: $($entry.skill)" }
        $frontmatter = Get-Content -Raw -LiteralPath (Join-Path $stage 'SKILL.md')
        if ($frontmatter -notmatch "(?m)^name:\s+$([regex]::Escape($entry.skill))\s*$") { throw "Invalid staged Skill name: $($entry.skill)" }
    }
    New-Item -ItemType Directory -Force -Path $resolvedTarget | Out-Null
    foreach ($entry in $plan | Where-Object { $_.action -in @('install', 'update-reviewed') }) {
        $target = Join-Path $resolvedTarget $entry.skill
        if (Test-Path -LiteralPath $target) { Move-Item -LiteralPath $target -Destination (Join-Path $backupRoot $entry.skill) }
        Move-Item -LiteralPath (Join-Path $stageRoot $entry.skill) -Destination $target
        $promoted.Add($entry.skill)
    }
    if ($Prune) { foreach ($name in $installedOnly) { Move-Item -LiteralPath (Join-Path $resolvedTarget $name) -Destination (Join-Path $backupRoot $name); $pruned.Add($name) } }
    Write-Output "Applied $($promoted.Count) Skill(s)."
}
catch {
    foreach ($name in @($pruned) | Select-Object -Reverse) {
        $backup = Join-Path $backupRoot $name
        $target = Join-Path $resolvedTarget $name
        if ((Test-Path -LiteralPath $backup) -and -not (Test-Path -LiteralPath $target)) { Move-Item -LiteralPath $backup -Destination $target }
    }
    foreach ($name in @($promoted) | Select-Object -Reverse) {
        $target = Join-Path $resolvedTarget $name
        if (Test-Path -LiteralPath $target) { Remove-Item -Recurse -Force -LiteralPath $target }
        $backup = Join-Path $backupRoot $name
        if (Test-Path -LiteralPath $backup) { Move-Item -LiteralPath $backup -Destination $target }
    }
    throw
}
finally {
    if (Test-Path -LiteralPath $stageRoot) { Remove-Item -Recurse -Force -LiteralPath $stageRoot }
    if (Test-Path -LiteralPath $backupRoot) { Remove-Item -Recurse -Force -LiteralPath $backupRoot }
}
