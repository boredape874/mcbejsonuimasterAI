# Bedrock Resource Pack Basics

Use this when the AI needs the minimum resource-pack context before editing JSON UI.

## Core folders

| Path | Role in JSON UI work |
| --- | --- |
| `manifest.json` | Identifies the resource pack and dependency stack. A broken UUID/version can stop the whole pack from loading. |
| `ui/` | JSON UI files. `_ui_defs.json` controls which files are loaded. |
| `textures/ui/` | Most vanilla-style UI textures and icons. Verify paths before using them. |
| `textures/items/` | Item icons used when UI references item imagery directly or through atlases. |
| `textures/blocks/` | Block icons used for block-driven UI. |
| `textures/item_texture.json` | Item atlas metadata. Path existence alone is not always the whole story. |
| `textures/terrain_texture.json` | Block atlas metadata. |
| `font/` | Glyph pages and font metadata. Often used for icons or compact HUD symbols. |
| `texts/` | Language files and localization keys. Use when labels should localize instead of hardcoding text. |

## Load model

1. Minecraft loads the resource pack from `manifest.json`.
2. UI files listed in `ui/_ui_defs.json` become available.
3. Screen files such as `hud_screen.json` and `server_form.json` are merged with vanilla screens.
4. `modifications` insert, replace, or remove controls at runtime load time.
5. Controls resolve textures, variables, bindings, factories, and collections.

## Pack stack rule

When multiple resource packs modify the same UI screen, higher-priority packs can override or conflict with lower-priority packs. Do not assume a JSON file works alone. Check:

- pack priority
- duplicate screen files
- duplicate namespaces
- duplicated `modifications`
- dependencies on utility files from another pack

## Minimal edit checklist

Before editing:

- find the target screen file
- check `_ui_defs.json`
- check namespace
- check whether the pack uses full screen replacement or `modifications`
- trace textures and shared templates

After editing:

- validate JSON/JSONC
- verify `_ui_defs.json` includes new files
- verify texture paths
- test in Minecraft with the same pack stack

