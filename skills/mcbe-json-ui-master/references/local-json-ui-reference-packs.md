# Local JSON UI Reference Packs

Use this when local restricted packs under `references/restricted/json-ui-reference-packs/` are available.

restricted local mirrors are pattern evidence only. Do not publish original archive names, source comments, credits, restricted texture paths, or server-specific names.

## Neutral IDs

| ID | Use For | Extract |
| --- | --- | --- |
| `animated-hover-text` | animated item/hover tooltip | `alpha`/`size` animations, `#hover_text` binding, rarity selector shape |
| `vertical-hotbar-left-right` | left/right vertical hotbar | one-column nine-row hotbar grid, numbered labels, global variables |
| `circular-hotbar` | radial hotbar | manual slot offsets, selected-slot state, hotbar collection reuse |
| `fast-commands` | chat command palette | `edit_box`, hidden send button, expandable command categories, button state texture family |
| `minimap-overlay` | interactive HUD/minimap | HUD input flags, slider-bound position/scale, `3d_structure_renderer`, pause toggle bridge |
| `advanced-ui-set-special-ui` | phone/device forms, battle panels, database/storage UIs, title-payload HUD suite | routed `server_form`, region-mapped device shell, protocol HUD router, advanced chest/grid forms |

## Rule

Before opening a restricted file, write down:

- selected neutral ID
- target task
- target pack file
- one pattern to extract
- one thing not to copy

For `advanced-ui-set-special-ui`, also read `advanced-ui-set-special-ui.md` and use only neutral `references/restricted/advanced-ui-set-ui/restricted-suite*` paths.
