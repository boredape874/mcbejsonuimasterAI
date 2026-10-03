[CmdletBinding()]
param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$studioRepo = Split-Path -Parent $PSScriptRoot
$studioRuntime = Join-Path $studioRepo 'workspace\studio-runtime'
$connectionPath = Join-Path $studioRuntime 'connection.json'
function Get-StudioConnection {
    try {
        $connection = Get-Content -Raw -LiteralPath $connectionPath | ConvertFrom-Json
        $studioUri = [Uri]$connection.url
        if ($studioUri.Host -ne '127.0.0.1' -or $studioUri.Scheme -ne 'http') { return $null }
        $status = Invoke-RestMethod -Uri ($connection.url + '/api/status') -Method Post -Headers @{Authorization=('Bearer ' + $connection.token)} -TimeoutSec 2
        if ($status.sessionId -eq $connection.sessionId) { return $connection }
    } catch { }
    return $null
}
$studioConnection = Get-StudioConnection
if ($null -eq $studioConnection) {
    New-Item -ItemType Directory -Force -Path $studioRuntime | Out-Null
    $studioNode = (Get-Command node -ErrorAction Stop).Source
    $studioEntry = Join-Path $studioRepo 'tools\studio.mjs'
    Start-Process -FilePath $studioNode -ArgumentList @('"' + $studioEntry + '"') -WorkingDirectory $studioRepo -WindowStyle Hidden -RedirectStandardOutput (Join-Path $studioRuntime 'host.log') -RedirectStandardError (Join-Path $studioRuntime 'host-error.log') | Out-Null
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        Start-Sleep -Milliseconds 200
        $studioConnection = Get-StudioConnection
        if ($null -ne $studioConnection) { break }
    }
    if ($null -eq $studioConnection) { throw 'Studio가 시작되지 않았습니다. workspace/studio-runtime/host-error.log를 확인하세요.' }
}
if (-not $NoBrowser) { Start-Process $studioConnection.url }
Write-Output ('JSON UI Studio: ' + $studioConnection.url)
