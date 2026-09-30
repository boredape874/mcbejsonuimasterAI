param(
    [Parameter(Mandatory=$true)][string]$GameRoot,
    [switch]$Apply
)
$ErrorActionPreference = 'Stop'
$gameDirectory = (Get-Item -LiteralPath $GameRoot).FullName
$bpParent = Join-Path $gameDirectory 'development_behavior_packs'
$rpParent = Join-Path $gameDirectory 'development_resource_packs'
foreach ($parent in @($bpParent,$rpParent)) {
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) { throw "Missing development pack directory: $parent" }
}
$bpTarget = Join-Path $bpParent 'NewUI BP'
$rpTarget = Join-Path $rpParent 'NewUI RP'
$delivery = Join-Path $gameDirectory 'dev\NewUI'
function Assert-NoReparseAncestor([string]$Path) {
    $cursor = [IO.Path]::GetFullPath($Path)
    while ($cursor.Length -ge $gameDirectory.Length) {
        if (Test-Path -LiteralPath $cursor) {
            $entry = Get-Item -LiteralPath $cursor -Force
            if (($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Reparse point preserved; select a physical game directory: $cursor" }
        }
        if ($cursor -eq $gameDirectory) { break }
        $cursor = Split-Path -Path $cursor -Parent
    }
}
foreach ($target in @($bpTarget,$rpTarget,$delivery)) {
    $resolvedTarget = [IO.Path]::GetFullPath($target)
    if (-not $resolvedTarget.StartsWith($gameDirectory + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Target escaped the selected game directory' }
    Assert-NoReparseAncestor $resolvedTarget
    if (Test-Path -LiteralPath $target) { throw "Existing target preserved. Choose a fresh target or review it manually: $target" }
}
$package = Join-Path $delivery 'NewUI.mcaddon'
[pscustomobject]@{BehaviorPack=$bpTarget;ResourcePack=$rpTarget;Package=$package;Apply=[bool]$Apply} | Format-List
if (-not $Apply) { return }
$nodeExecutable = (Get-Command node -ErrorAction Stop).Source
& $nodeExecutable (Join-Path $PSScriptRoot 'verify.mjs')
if ($LASTEXITCODE -ne 0) { throw 'NewUI verification failed; no pack was copied' }
New-Item -ItemType Directory -Path $delivery | Out-Null
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::Open($package,[IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($kind in @('BP','RP')) {
        $sourceDirectory = Join-Path $PSScriptRoot $kind
        foreach ($file in Get-ChildItem -LiteralPath $sourceDirectory -File -Recurse) {
            $relative = $file.FullName.Substring($sourceDirectory.Length + 1).Replace('\','/')
            [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$file.FullName,"NewUI_$kind/$relative",[IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    }
} finally { $archive.Dispose() }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'BP') -Destination $bpTarget -Recurse
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'RP') -Destination $rpTarget -Recurse
$checked=0
foreach ($pair in @(@('BP',$bpTarget),@('RP',$rpTarget))) {
    $sourceDirectory=Join-Path $PSScriptRoot $pair[0]
    foreach ($file in Get-ChildItem -LiteralPath $sourceDirectory -File -Recurse) {
        $relative=$file.FullName.Substring($sourceDirectory.Length+1)
        $copy=Join-Path $pair[1] $relative
        if ((Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash -ne (Get-FileHash -LiteralPath $copy -Algorithm SHA256).Hash) { throw "Installed file hash mismatch: $relative" }
        $checked++
    }
}
$guide = @"
NewUI - 작은 세계 탐험 도감

별도 테스트 월드에서 NewUI BP와 RP를 함께 활성화하고 치트 사용을 켜세요.
/newui:book 으로 책을 받은 뒤 사용하거나 /newui:open 으로 도감을 엽니다.
카테고리 3개 / 생물 12종. 선택은 플레이어별로 저장됩니다.
정적 검사 완료. Bedrock 화면/입력/콘텐츠 로그 검증은 아직 필요합니다.
편집 가능한 원본: $PSScriptRoot
이 설치는 월드를 수정하거나 팩을 자동 활성화하지 않습니다.
"@
[IO.File]::WriteAllText((Join-Path $delivery '사용법.txt'),$guide,[Text.UTF8Encoding]::new($false))
[pscustomobject]@{InstalledFiles=$checked;SHA256Verified=$true;Package=$package;RuntimeVerified=$false} | Format-List
