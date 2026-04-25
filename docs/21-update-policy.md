# Update Policy

Use this when Bedrock updates or when upstream references change.

## Update order

1. sync Ztech vanilla pack
2. sync selected Mojang `bedrock-samples` UI files
3. review Bedrock Wiki JSON UI changes
4. diff important screen files
5. rerun local validation scripts
6. update docs and examples only after confirming behavior

## Commands

```powershell
.\scripts\sync-ztech-vanilla.ps1
.\scripts\sync-bedrock-samples-ui.ps1
.\scripts\sync-mcbe-json-ui-resource.ps1
.\scripts\validate-json-ui-pack.ps1 -PackPath references\source-packs\1seulbi
```

For selected reference mirrors that intentionally do not contain every file from `_ui_defs.json`, use:

```powershell
.\scripts\validate-json-ui-pack.ps1 -PackPath references\official\bedrock-samples-ui -AllowPartialUiDefs -AllowMissingTextures
```

`validate-json-ui-pack.ps1` reads JSON UI as UTF-8 JSONC, so Mojang-style `//` comments in vanilla UI files are accepted.

## High-risk files to diff

- `hud_screen.json`
- `chat_screen.json`
- `server_form.json`
- `inventory_screen.json`
- `inventory_screen_pocket.json`
- `ui_common.json`
- `_global_variables.json`
- `_ui_defs.json`

## What to label in docs

For every changed claim, label:

- confirmed from source
- inferred from working sample
- not verified

## Do not do this

- do not blindly replace local examples with a new upstream screen
- do not assume schema updates mean runtime behavior changed
- do not assume a working community snippet survived the update
