# Ztech Vanilla Authority

For vanilla texture validation in this repository, the canonical upstream source is:

- <https://github.com/ZtechNetwork/MCBVanillaResourcePack>

Use it to confirm:

- `textures/ui/*`
- `textures/item_texture.json`
- `textures/terrain_texture.json`
- `ui/*.json`
- `_global_variables.json`
- `_ui_defs.json`

## Why this replaces the old handwritten icon note

- it is an upstream pack tree, not a derived note
- it contains current file names and paths
- it supports both texture validation and vanilla screen structure lookup

## Recommended lookup order

1. Search `textures/ui/` for direct UI textures
2. Search `textures/item_texture.json` for vanilla item icon mapping
3. Search `textures/terrain_texture.json` for vanilla block icon mapping
4. Search `ui/` for screen structure or control references
