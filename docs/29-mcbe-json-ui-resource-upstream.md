# MCBE JSON UI Resource Upstream

Use this when the AI needs broader JSON UI examples from:

- <https://github.com/boredape874/mcbe-json-ui-resource>

The repository is mirrored locally into:

- `references/upstreams/mcbe-json-ui-resource/`

This upstream mirror is intentionally not committed because it contains thousands of files. Use it as a searchable source, then open only the exact matching files.

When adapting code from this upstream, use:

- `docs/30-file-and-code-fragment-usage.md`
- `docs/31-fragment-routing-table.md`
- `docs/49-json-ui-tutorial-index.md`

## Sync

```powershell
.\scripts\sync-mcbe-json-ui-resource.ps1
```

## Current useful top-level groups

| Group | Use for |
| --- | --- |
| `UI SAMPLE/MCBE_RainbowPieUI2` | Large modular UI pack, screen controls, inventory/container modules, common controls. |
| `UI SAMPLE/VDX-DesktopUI` | Desktop-like full UI overhaul, broad vanilla screen replacements, custom UI textures. |
| `UI SAMPLE/BedrockUi+ Beta` | Broad UI replacement patterns and screen coverage. |
| `UI SAMPLE/Déesse UI` | Full UI pack examples for vanilla screen coverage. |
| `Json ui tutorial/*` | Small focused tutorials such as preserved title text, search bar, text input, server form, custom buttons, custom grids, custom textures. |

For the tutorial folder, prefer the dedicated index:

- `docs/49-json-ui-tutorial-index.md`

## Search first

Do not open the whole upstream. Search by screen or concept.

```powershell
$up = "references/upstreams/mcbe-json-ui-resource"
rg --files $up -g "*.json" | rg "hud_screen|server_form|scoreboards|pocket_containers|ui_common|_ui_defs"
```

```powershell
rg -n "preserve|#hud_title_text_string|players_collection|binding_collection_name|form_buttons|search|text_box|button_mappings" $up -g "*.json"
```

## Recommended routes

### Preserved title or title-driven HUD

Start with:

- `Json ui tutorial/Preserve Title Texts/Preserve Title Texts.json`
- local mirrors under `references/local-examples/rpg-hud/`

Use this when the task is about title/actionbar payload preservation or server-driven HUD values.

### Server forms

Start with:

- `Json ui tutorial/server_form/`
- `UI SAMPLE/*/ui/server_form.json`
- `references/local-examples/npc-dialogue/ui/server_form.json`

Use this when the task is custom `server_form.json`, title/body/button routing, or form list layout.

### Search/text input

Start with:

- `Json ui tutorial/Search Bar JSON-UI/`
- `Json ui tutorial/Text Input Box/`

Use this when the task involves filtering, typed UI, or text input controls.

### Buttons, toggles, sliders, progress, and factories

Start with:

- `docs/49-json-ui-tutorial-index.md`
- `Json ui tutorial/Custom Text Button and Toggle/`
- `Json ui tutorial/Custom_slider.json/`
- `Json ui tutorial/custom progress bar/`
- `Json ui tutorial/Custom Element Factories/`

Use this when the task involves reusable controls, animated button states, progress bars, factories, draggable elements, or cyclers.

### Full screen replacement comparison

Start with:

- `UI SAMPLE/MCBE_RainbowPieUI2/ui/_ui_defs.json`
- `UI SAMPLE/VDX-DesktopUI/ui/_ui_defs.json`
- `UI SAMPLE/BedrockUi+ Beta/ui/_ui_defs.json`

Use this only when comparing a whole pack structure. For normal tasks, inspect the target screen only.

## Caution

- Treat this upstream as an example archive, not runtime truth.
- Check each pack's own license/readme before copying code or assets into public outputs.
- Prefer summarizing patterns unless the file is clearly safe to reuse.
- Split examples into `_ui_defs`, screen insertion, bindings, factories, textures, and server payload before applying them.
- For vanilla path truth, still use `ZtechNetwork/MCBVanillaResourcePack`.
