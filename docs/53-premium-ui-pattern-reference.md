# Premium UI Pattern Reference

This document summarizes a local high-quality Bedrock JSON UI reference set without preserving source pack identity, server names, proprietary labels, or asset-specific branding.

Use it as a pattern guide, not as a copy source. Rebuild controls with neutral namespaces, verified texture paths, and target-pack naming.

## Source Handling Rules

- Do not copy original pack branding, server names, UUID-like setting filenames, or restricted namespace prefixes into public examples.
- Do not copy textures or models unless the user owns the target assets and explicitly asks for a local restricted pack.
- Extract JSON UI structure only: routing style, collection use, animation shape, panel sizing, screen replacement technique, and progress-bar logic.
- Rename examples by feature, such as `premium_server_form_router`, `premium_loading_screen`, `premium_hud_progress`, or `premium_container_screen`.

## Pattern Index

| Pattern | Use When | What To Extract |
| --- | --- | --- |
| Multi-route server form router | one `server_form.json` must dispatch many visual forms | factory replacement, title-token routing, vanilla fallback |
| Custom action form row with icon/loading state | form buttons need icons and loading placeholders | `form_buttons` collection, `#form_button_texture`, loading fallback |
| Custom world loading screen | loading screen needs background, logo, title, progress text, percentage | `world_loading_progress_screen`, dimension background overrides, `#loading_bar_percentage` bindings |
| HUD XP/progress bar reskin | HUD needs compact custom XP/progress styling | `#exp_progress` to `#clip_ratio`, `clip_direction: left`, bar/nub layering |
| Boss-bar collection rendering | multiple boss bars or server-driven bars need collection rendering | `boss_bars` collection, progress-bar collection controls |
| Pocket/mobile hotbar-safe progress layout | mobile UI must resize around hotbar and locator bar | `use_anchored_offset`, engine size/offset bindings |
| Container-like custom screen | custom station/cooking/inventory screen needs slots and animated states | `container_items` collection, slot factories, `flip_book` status animation |
| Chest-form bridge | server form must behave like chest/menu slots | `form_buttons` mapped into grid slots, texture/text binding, click routing |
| Custom chat/HUD message stack | chat or actionbar needs heavily styled overlays | message factories, stack panels, alpha/offset animation chains |
| Reusable button/toggle templates | many screens need consistent hover/pressed/selected states | variables, state controls, small fade animations |

## Multi-Route Server Form Router

Use this when PMMP or Script API can control the form title and you want one RP to skin many form types.

Minimal architecture:

1. Override `server_form.third_party_server_screen`.
2. Insert a factory with `long_form` and `custom_form`.
3. For `long_form`, place several invisible route panels.
4. Each route panel reads `#title_text`.
5. A view binding checks whether a hidden token or prefix exists.
6. Only the matched custom content is visible.
7. Keep a vanilla-safe fallback for ordinary forms.

Recommended neutral token style:

```text
ui:menu
ui:shop
ui:quest
ui:chest
ui:process
ui:settings
```

Avoid user-facing words as route keys. The visible title can be rendered separately inside the custom UI.

## Server Form Icon Row With Loading Placeholder

This pattern is useful when a form button uses an image, but the engine may report `"loading"` while the texture is not ready.

Core logic:

- Bind `#form_button_texture` from `form_buttons`.
- Bind `#form_button_texture_file_system` to `#texture_file_system`.
- Show the icon only when `#texture` is neither empty nor `"loading"`.
- Show a small loading strip when `#texture = 'loading'`.
- Keep the actual clickable button separate from the icon panel so click routing stays stable.

Use this in high-polish server forms because it avoids blank-looking buttons during slow image loading.

## Screen Loading Bar Patterns

There are three different loading/progress patterns worth separating.

### 1. World Loading Screen Bar

Use on `progress_screen.json`.

Useful controls and bindings:

- `world_loading_progress_screen`
- `overworld_loading_progress_screen`
- `nether_loading_progress_screen`
- `theend_loading_progress_screen`
- `world_convert_modal_progress_screen_content`
- `world_save_modal_progress_screen_content`
- `#loading_bar_percentage`
- `#bar_animation_visible`

Recommended layout:

- full-screen image background
- centered logo/title
- bottom-left or bottom-center loading text
- bottom-width progress bar
- optional percentage label

The local reference computes a percentage label from `#loading_bar_percentage` using view bindings. Treat this as a clever but fragile trick. If exact decimals are not required, prefer a simpler label or no label.

### 2. Indeterminate Loading Strip

Use when the UI only knows that a task is loading, not exact progress.

Recommended implementation:

- image strip using a loading texture
- `uv` driven by a `flip_book` or `uv` animation
- visible only when a binding says the asset is loading
- small height, usually `4px` to `8px`

Useful for:

- form button images
- async icon rows
- server form cards
- shop item thumbnails

### 3. Determinate Clip Progress Bar

Use when the engine gives a progress value, for example XP, boss bars, or custom numeric data.

Core implementation:

```json
{
  "type": "image",
  "texture": "textures/ui/experiencebarfull",
  "clip_direction": "left",
  "clip_pixelperfect": false,
  "bindings": [
    {
      "binding_name": "#exp_progress",
      "binding_name_override": "#clip_ratio",
      "binding_type": "global"
    }
  ]
}
```

For other values, replace `#exp_progress` with the value source and keep `#clip_ratio` in the `0.0` to `1.0` range.

## HUD Progress Bar Layering

Reliable bar composition:

1. Outer panel controls placement.
2. Empty bar image is the base.
3. Full bar image clips from the left.
4. Optional nub/cap is layered over the fill.
5. Text label is above both images.
6. Use separate desktop and pocket/mobile panels when hotbar sizing differs.

For mobile-safe layouts:

- use `use_anchored_offset`
- bind engine-provided offset values into `#anchored_offset_value_y`
- bind size values into `#size_binding_x` and `#size_binding_y`
- do not assume desktop hotbar dimensions apply to pocket UI

## Container / Cooking Screen Pattern

Use this when replacing a custom station screen, brewing-like UI, cooking pot, forge, processor, or machine UI.

Core structure:

- a custom namespace screen file
- slot controls driven by `container_items`
- a background frame image
- status icons or animated state layers
- `flip_book` animations for process state
- selected-item details and lock notification factories kept from common controls when needed

Implementation advice:

- keep slot hitboxes aligned to actual container inventory slots
- render decorative process animation separately from item slots
- make animated process indicators optional so the screen still works if textures fail

## Button And Toggle Template Pattern

Use a shared template file when many screens need the same visual language.

Template should provide:

- base button panel
- default/hover/pressed/locked visual controls
- text label slot
- icon slot
- optional fade animation
- variables for size, texture, text, and pressed button name

Then feature screens should only pass variables and bindings.

## AI Usage Guidance

When a user asks for a polished UI:

1. Pick the closest pattern in this document.
2. Ask for visual direction only if the user gave no screenshot or reference.
3. Use IR/tools for geometry if the layout has fixed panels, grids, symmetry, or equal gaps.
4. Rebuild JSON with neutral namespaces.
5. Use verified vanilla texture paths or target-pack-owned assets.
6. Keep routing tokens stable and hidden from visible user text.
7. Validate JSON and `_ui_defs.json` registration before finishing.
