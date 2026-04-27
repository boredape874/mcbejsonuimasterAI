# JSON UI Tutorial Index

Use this for focused examples from:

- `references/upstreams/mcbe-json-ui-resource/Json ui tutorial/`
- upstream: <https://github.com/boredape874/mcbe-json-ui-resource/tree/main/Json%20ui%20tutorial>

The upstream mirror is ignored by git because it is large. Sync it with:

```powershell
.\scripts\sync-mcbe-json-ui-resource.ps1
```

AI rule:

- Do not load the whole tutorial archive.
- Pick one matching tutorial from this index.
- Open only the listed source file and the target pack file.
- Adapt the pattern into the target namespace instead of copying unrelated pack scaffolding.
- If a tutorial includes BP scripts, use the script only to understand the form/title payload shape.

## Quick Routes

| Need | Open first | What to extract |
| --- | --- | --- |
| Preserve title payload | `Preserve Title Texts/Preserve Title Texts.json` | saved title text, hidden source labels, HUD-driven payload retention |
| Determine string length | `Determine String Length/Determine String Length.json` | binding loop for string length style calculations |
| Split string payload | `JSON UI - Splitting String/JSON UI - Splitting String.json` | separator or slice-based payload parsing |
| Search/filter UI | `Search Bar JSON-UI/Search Bar JSON-UI.json` | text box source value and filtered visibility |
| Text input box | `Text Input Box/Text Input Box.json` | `edit_box` or input-control wiring |
| Custom progress bar | `custom progress bar/custom_progress_bar.json` | `clip_ratio`, foreground/background image bar |
| Heart/hunger-like bar | `custom progress bar/custom_heart_or_hunger_like_progress_bar_icons.json` | repeated icon style bar |
| Animated progress bar v1 | `custom progress bar/Animated Progress Bar/Animated Progress Bar v1/ui/hud_screen.json` | simple HUD animated bar wiring |
| Animated progress bar v2 | `custom progress bar/Animated Progress Bar/Animated Progress Bar v2/ui/animated_bar.json` | reusable animated bar component |
| Image/label cycler | `Image Label Cyclers/Image Label Cyclers.json` | cycler controls and value switching |
| Grayscale image | `Grayscaled Image/Grayscaled Image.json` | `grayscale` image property use |
| Change size/offset by bindings | `Change Size and Offset using Bindings/size_offset.json` | binding-derived `size` and `offset` |
| Prevent touch icon behavior | `Prevent Touch Icon when clicking a button on hud screen prevent_touch_input true.txt` | `prevent_touch_input` usage context |
| Custom slider | `Custom_slider.json/custom_slider.json` | slider control setup |
| Custom button | `Custom Text Button and Toggle/custom_button.json` | text button state controls |
| Custom toggle | `Custom Text Button and Toggle/custom_toggle.json` | toggle states and checked/unchecked controls |
| Animated button states | `Custom Text Button and Toggle/Animated Button States.json` | button animation state pattern |
| Animated toggle template | `Custom Text Button and Toggle/custom Animated toggle/ui_template_toggles.json` | reusable animated toggle template |
| Custom element factories | `Custom Element Factories/custom Element Factories.json` | factory-generated controls |
| Draggable element | `Custom Element Factories/Draggable Element.json` | draggable panel/control behavior |
| NPC screen form | `NPC Screen Form/custom_npc_screen_layout_reference_file.json` | NPC form layout reference |
| Server form unclosed | `server_form/server_form unclosed.json` | server form edge-case reference |
| Modify item lore/hover text | `Modify item lore and hover text (ui_common.json)/modify item lore and hover text.json` | `ui_common` item hover/lore override pattern |
| 3x3 hotbar grid | `inventory_screen/3x3 Hotbar Grid.json` | hotbar grid layout rewrite |
| Custom crafting table UI | `inventory_screen/Custom Crafting Table UI Template/inventory_screen.json` | inventory screen template |
| Simple chunk display | `Simple Chunk Display/simple chunk display.json` | HUD text/data display concept |

## Dingel Tutorial Packs

These are small BP/RP sample packs. Use them when the JSON UI behavior depends on server or script-sent form data.

| Tutorial pack | Key files | Use for |
| --- | --- | --- |
| `Dingel ui sample/1.Basic Rendering` | `RP/ui/server_form.json`, `BP/scripts/main.js` | basic server form replacement and script payload |
| `Dingel ui sample/2.Custom Buttons - stack panel` | `RP/ui/server_form.json`, `BP/scripts/main.js` | stack-panel button layout |
| `Dingel ui sample/3.Custom Grids - Grids sample` | `RP/ui/server_form.json`, `BP/scripts/main.js` | grid-based form buttons |
| `Dingel ui sample/4.Adbancved Layout - Custom Buttons Example` | `RP/ui/server_form.json`, `BP/scripts/main.js` | advanced button layout examples |
| `Dingel ui sample/5.Custom textures - customtextures` | `RP/ui/server_form.json`, `RP/textures/custom_ui/*`, `BP/scripts/main.js` | custom texture-backed form styling |

When using these packs:

- inspect `RP/ui/server_form.json` first
- inspect `BP/scripts/main.js` only for body/title/button data shape
- copy textures only if license and redistribution are acceptable
- keep the target pack's own `_ui_defs.json` and namespace structure

## Settings Tab Template

Use:

- `Dakonblackrose's Settings Tab Template/dakonuitemplate/ui/how_to_play_screen.json`
- `Dakonblackrose's Settings Tab Template/dakonuitemplate/ui/how_to_play_common.json`
- `Dakonblackrose's Settings Tab Template/dakonuitemplate/textures/ui/*`
- `Dakonblackrose's Settings Tab Template/dakonuitemplate/texts/en_US.lang`

Good for:

- how-to-play/settings style tabs
- language file driven labels
- custom settings button texture states

Do not use this as a normal server form pattern. It is closer to a vanilla screen extension.

## Learning Pack

Use:

- `Smell of Curry sample/Learing JSON UI RES/Learing JSON UI RES/ui/_ui_defs.json`
- `Smell of Curry sample/Learing JSON UI RES/Learing JSON UI RES/ui/hud_screen.json`

Good for:

- compact resource-pack structure
- `_ui_defs.json` plus HUD screen registration

## Tutorial File Families

### Bindings And String Logic

```text
Preserve Title Texts/Preserve Title Texts.json
Determine String Length/Determine String Length.json
JSON UI - Splitting String/JSON UI - Splitting String.json
Change Size and Offset using Bindings/size_offset.json
Search Bar JSON-UI/Search Bar JSON-UI.json
Text Input Box/Text Input Box.json
```

Use these when the UI behavior is driven by text payloads, title/actionbar data, search input, or calculated layout values.

### Progress And Bars

```text
custom progress bar/custom_progress_bar.json
custom progress bar/custom_heart_or_hunger_like_progress_bar_icons.json
custom progress bar/Animated Progress Bar/Animated Progress Bar v1/ui/hud_screen.json
custom progress bar/Animated Progress Bar/Animated Progress Bar v2/ui/_ui_defs.json
custom progress bar/Animated Progress Bar/Animated Progress Bar v2/ui/hud_screen.json
custom progress bar/Animated Progress Bar/Animated Progress Bar v2/ui/animated_bar.json
```

Use these before designing a progress bar from scratch.

Related docs:

- `docs/33-animation-patterns-and-dumper-values.md`
- `docs/47-custom-auxid-and-form-progress.md`

### Controls

```text
Custom_slider.json/custom_slider.json
Custom Text Button and Toggle/custom_button.json
Custom Text Button and Toggle/custom_toggle.json
Custom Text Button and Toggle/custom Toggle (with any state texture you want).json
Custom Text Button and Toggle/Animated Button States.json
Custom Text Button and Toggle/custom Animated toggle/ui_template_toggles.json
Custom Text Button and Toggle/custom Animated toggle/debug_screen.json
Custom Text Button and Toggle/custom Animated toggle/glow.json
```

Use these for buttons, toggles, sliders, and animated control states.

### Factories, Cyclers, And Dynamic Controls

```text
Custom Element Factories/custom Element Factories.json
Custom Element Factories/Draggable Element.json
Image Label Cyclers/Image Label Cyclers.json
```

Use these when a UI needs generated controls, draggable controls, or rotating labels/images.

### Inventory And Server Form Screens

```text
server_form/server_form unclosed.json
NPC Screen Form/custom_npc_screen_layout_reference_file.json
inventory_screen/3x3 Hotbar Grid.json
inventory_screen/Custom Crafting Table UI Template/inventory_screen.json
```

Use these for screen-specific layouts. Do not assume a pattern from `inventory_screen.json` works in `server_form.json` without adapting collections and screen-specific bindings.

## Search Commands

Find tutorial files:

```powershell
rg --files "references/upstreams/mcbe-json-ui-resource/Json ui tutorial"
```

Find binding-heavy tutorials:

```powershell
rg -n '"bindings"|"source_property_name"|"target_property_name"|"#hud_title_text_string"|"#form_text"' "references/upstreams/mcbe-json-ui-resource/Json ui tutorial" -g *.json
```

Find controls:

```powershell
rg -n '"type": "button"|"type": "toggle"|"type": "slider"|"type": "edit_box"|"type": "factory"' "references/upstreams/mcbe-json-ui-resource/Json ui tutorial" -g *.json
```

Find progress bars:

```powershell
rg -n '"clip_ratio"|"clip_direction"|"anim_type": "size"|"animated_bar"' "references/upstreams/mcbe-json-ui-resource/Json ui tutorial" -g *.json
```

