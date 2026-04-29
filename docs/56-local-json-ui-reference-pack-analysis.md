# Local JSON UI Reference Pack Analysis

This document summarizes the restricted local JSON UI references mirrored under `references/restricted/json-ui-reference-packs/`.

The restricted mirror is intentionally ignored by git. Public docs must use the neutral reference IDs below and must not expose original pack names, branding, server names, archive names, or copied source comments.

## How To Use

1. Pick the user's target from `docs/55-reference-task-taxonomy.md` or `docs/57-hierarchical-task-router.md`.
2. Open only the matching restricted reference folder if it exists locally.
3. Extract the pattern shape, not the branding:
   - control tree
   - bindings
   - variables
   - collection names
   - sizing strategy
   - input mappings
   - texture metadata shape
4. Rename namespaces, controls, variables, and texture paths for the target project.
5. Re-check labels with `docs/54-visual-fit-and-reference-discipline.md`.

## Reference Packs

| Neutral ID | Best For | Open First | Extract | Watch Out |
| --- | --- | --- | --- | --- |
| `animated-hover-text` | inventory/item hover tooltip, rarity-colored tooltip frame, animated hover text | `references/restricted/json-ui-reference-packs/animated-hover-text/ui/ui_common.json` | `alpha` and `size` animations, hover text binding, rarity selector, cursor-following hover panel | The sample uses misspelled internal control names and pack-specific rarity textures. Rename and normalize before reuse. |
| `circular-hotbar` | radial hotbar, non-linear slot positioning, experimental hotbar composition | `references/restricted/json-ui-reference-packs/circular-hotbar/ui/hud_screen.json` | manual slot offsets around a circle, hotbar collection binding, selected slot highlight | It overrides vanilla hotbar structure. Compare with vanilla `hud_screen.json` before patching. |
| `vertical-hotbar-left-right` | left/right vertical hotbar, numbered slot labels, subpack-driven typography | `references/restricted/json-ui-reference-packs/vertical-hotbar-left-right/VerticalHotbarLeft/ui/hud_screen.json` or `VerticalHotbarRight/ui/hud_screen.json` | `grid_dimensions: [1, 9]`, custom hotbar stack, slot number labels, global variables for label style | It replaces hotbar renderer paths. Keep vanilla fallback plans and test hunger/XP/hotbar interactions. |
| `fast-commands` | chat command palette, command buttons, text formatting panel, custom chat input routing | `references/restricted/json-ui-reference-packs/fast-commands/ui/chat_screen.json` | `edit_box` with `#message_text_box`, command button templates, expandable categories, hidden send button, texture state families | The source is minified and contains restricted credit text. Do not copy strings or texture names directly into public examples. |
| `minimap-overlay` | interactable HUD overlay, adjustable HUD position/scale, 3D renderer panel, pause/HUD toggle bridge | `references/restricted/json-ui-reference-packs/minimap-overlay/ui/hud_screen.json` | sliders, toggles, `3d_structure_renderer`, `use_anchored_offset`, HUD input flags, addon-side entity/model/render dependencies | Requires BP/RP asset integration beyond JSON UI. `always_accepts_input` and `should_steal_mouse` can break gameplay input if copied blindly. |

## advanced-ui-set restricted Reference Set

The separate `advanced-ui-set` mirror is indexed by:

- `docs/60-advanced-ui-set-special-ui-reference.md`
- `docs/61-advanced-ui-set-file-pattern-routes.md`
- `docs/62-special-form-device-ui-patterns.md`
- `data/advanced-ui-set-file-index.json`

Use it for:

- device/phone style special forms
- multi-route `server_form.json` dispatch
- battle command panels
- creature or item database/detail screens
- PC/storage grids
- title-payload HUD suites
- advanced chest-form routing

Its raw files live under `references/restricted/advanced-ui-set-ui/` with neutral paths. Keep the same restricted-source rule: extract layout and behavior, not original names, comments, credits, or restricted textures.

## Pattern Notes

### Animated Hover Text

Use this when a UI needs tooltip polish instead of a static label. The useful pattern is:

- small animation definitions in `ui_common.json`
- a hover button that does not consume unrelated hover events
- a tooltip control bound to `#hover_text`
- a visibility check against empty hover text
- optional color-code detection to select a texture variant

Do not reuse restricted rarity texture paths. For a public pack, either use vanilla-safe textures or create new neutral textures.

### Circular Hotbar

Use this only when the user explicitly wants a stylized hotbar. The pattern works by keeping hotbar collection data but moving each slot into fixed offsets.

Good extraction targets:

- a separate custom hotbar panel inserted into `root_panel`
- one slot template for each hotbar item
- a fixed offset list for positions
- a selected slot state based on collection index

Avoid mixing this with RPG HUD work unless the user asked to change the hotbar. For RPG HUD, preserve the vanilla hotbar first.

### Vertical Hotbar

Use this when the user wants left-side or right-side hotbar. The pattern is more production-friendly than a radial hotbar because it uses a `grid` with one column and nine rows.

Good extraction targets:

- `custom_hotbar` anchored to `left_middle` or `right_middle`
- `hotbar_grid` with `grid_dimensions: [1, 9]`
- slot label variables in `_global_variables.json`
- optional subpack variants for font and label visibility

Check hotbar renderer, XP renderer, hunger, and mobile safe zone after implementation.

### Fast Command Palette

Use this when the user wants a command sidebar, quick command buttons, or chat formatting tools.

Good extraction targets:

- `command@common.button` style template
- `edit_box` named `#message_text_box`
- hidden `send` button mapped to `button.send`
- expandable category panel
- state texture family: default, hover, pressed
- text formatting command grid

Do not copy command lists or credits. Treat them as examples of button composition and input mapping only.

### Minimap Overlay

Use this for advanced interactive HUDs, not for simple static HUD overlays.

Good extraction targets:

- HUD screen input flags
- top-right setting toggles
- sliders that bind numeric values into layout properties
- `3d_structure_renderer` panel
- pause-screen toggle bridge
- addon files needed by renderers

Mark implementation as addon-integrated when using this pattern. It is not a pure JSON UI drop-in.

## Search Commands

```powershell
rg -n "hover_text|anim_type|rarity" references/restricted/json-ui-reference-packs/animated-hover-text -g "*.json"
rg -n "grid_dimensions|custom_hotbar|hotbar_renderer" references/restricted/json-ui-reference-packs/vertical-hotbar-left-right -g "*.json"
rg -n "circular_hotbar|collection_index|root_panel" references/restricted/json-ui-reference-packs/circular-hotbar -g "*.json"
rg -n "#message_text_box|button.send|category|command@common" references/restricted/json-ui-reference-packs/fast-commands -g "*.json"
rg -n "3d_structure_renderer|slider|always_accepts_input|use_anchored_offset" references/restricted/json-ui-reference-packs/minimap-overlay -g "*.json"
```

## Public Documentation Rule

When documenting or shipping derived work:

- use neutral names
- remove source comments and credits unless license attribution requires them
- replace restricted texture paths
- describe the pattern, not the original pack identity
- keep raw mirrors under `references/restricted/`
