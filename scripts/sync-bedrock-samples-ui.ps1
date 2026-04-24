param(
  [string]$UpstreamPath = "references/upstreams/bedrock-samples",
  [string]$OutputPath = "references/official/bedrock-samples-ui"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $UpstreamPath)) {
  git clone --depth 1 --filter=blob:none --sparse https://github.com/Mojang/bedrock-samples.git $UpstreamPath
  git -C $UpstreamPath sparse-checkout set resource_pack/ui
} else {
  git -C $UpstreamPath pull --ff-only
}

New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null

$files = @(
  "_ui_defs.json",
  "_global_variables.json",
  "hud_screen.json",
  "chat_screen.json",
  "server_form.json",
  "inventory_screen.json",
  "inventory_screen_pocket.json",
  "ui_common.json",
  "chest_screen.json",
  "furnace_screen.json",
  "trade_2_screen.json",
  "command_block_screen.json"
)

foreach ($file in $files) {
  $src = Join-Path $UpstreamPath "resource_pack/ui/$file"
  if (Test-Path $src) {
    Copy-Item -LiteralPath $src -Destination (Join-Path $OutputPath $file) -Force
  }
}

Write-Host "Synced selected bedrock-samples UI files into $OutputPath"
