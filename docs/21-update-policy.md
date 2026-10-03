# Update Policy

Use this when Bedrock updates or when upstream references change.

## Update order

1. sync Ztech vanilla pack
2. sync selected Mojang `bedrock-samples` UI files and refresh their lock
3. review Bedrock Wiki JSON UI changes
4. diff important screen files
5. rerun local validation scripts
6. update docs and examples only after confirming behavior

## Pinned sample revision

`references/official/bedrock-samples-ui.lock.json` records the upstream commit, tag, `version.json` entry, `min_engine_version`, previous revision, and sha256 of every committed official sample file (15 files; the list is `SELECTED_FILES` in `tools/sync-bedrock-samples-ui.mjs`). The current pin is `v1.26.50.4` (`46ba6ea985fb`, 2026-09-16); the previous pin was `v1.26.10.4`. What changed between them, and which preview signals to watch, is in `docs/83-vanilla-ui-1.26.50-diff.md`. Update that document whenever the lock moves. Sync mode also regenerates the matching profile in `data/vanilla-screen-profiles.json` (vanilla override list plus `removedScreens` for files the earlier pin registered); pass `--no-profile` to skip that. Older revisions stay in git history and are never deleted; packs written against them normally keep loading, so the diff is about names a pack patches by reference, not about validity of older references.

## Commands

```powershell
.\scripts\sync-ztech-vanilla.ps1
.\scripts\sync-bedrock-samples-ui.ps1 -Ref main      # creates/updates the mirror, copies files, rewrites the lock
.\scripts\sync-mcbe-json-ui-resource.ps1
.\scripts\validate-json-ui-pack.ps1 -PackPath references\source-packs\modern-cloud-ui-reference
```

Cross-platform checks that need no network:

```powershell
node tools/sync-bedrock-samples-ui.mjs --check       # committed files vs lock (and vs mirror when present)
node tools/sync-bedrock-samples-ui.mjs --diff        # name-level change summary between committed files and the mirror
node tools/vanilla-name-check.mjs common.close_button '#title_text'   # does a name exist in the pinned samples / mirror?
node tools/build-vanilla-index.mjs --force
node tests/jsonui-spec-vanilla-coverage.mjs           # data/jsonui-spec.json must accept the pinned files
node tests/official-samples-lock.mjs
node tests/presets-catalog-vanilla.mjs                # preset refs and variables still resolve in the pinned templates
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
- `furnace_screen.json` (carries the recipe book since 1.26.50)

## What to label in docs

For every changed claim, label:

- confirmed from source
- inferred from working sample
- not verified

## Do not do this

- do not blindly replace local examples with a new upstream screen
- do not assume schema updates mean runtime behavior changed
- do not assume a working community snippet survived the update
