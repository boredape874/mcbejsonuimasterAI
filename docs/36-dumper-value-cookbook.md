# Dumper Value Cookbook

This document maps common values found in JSON UI Dumper or dumped vanilla UI files to practical reuse patterns.

Use this after `docs/33-animation-patterns-and-dumper-values.md` when the question is not only about `anim_type`.

## Value routes

| Value or field | Best source | Practical use |
| --- | --- | --- |
| `factory` | `references/official/bedrock-samples-ui/chat_screen.json` | dynamic chat messages, popup creation, repeated generated controls |
| `collection_name` | `references/official/bedrock-samples-ui/chest_screen.json` | inventory grids, form button lists, scoreboard/player lists |
| `grid_dimensions` | `references/official/bedrock-samples-ui/chest_screen.json` | chest-like grids, slot UIs, fixed row/column layouts |
| `grid_item_template` | `references/official/bedrock-samples-ui/chest_screen.json` | reusable cell template for collection items |
| `renderer` | `references/official/bedrock-samples-ui/hud_screen.json` | built-in client renderers such as hotbar, hearts, hunger, player, item icons |
| `property_bag` | `references/official/bedrock-samples-ui/hud_screen.json` | local scratch values, forced update flags, preserved state |
| `variables` + `requires` | `references/official/bedrock-samples-ui/chest_screen.json` | desktop/pocket branching, conditional defaults |
| `button_mappings` | `references/official/bedrock-samples-ui/chat_screen.json` | input routing, key/controller bindings, custom buttons |
| `focus_identifier` and focus changes | `references/official/bedrock-samples-ui/hud_screen.json`, `inventory_screen.json` | gamepad/keyboard navigation |
| `common.scrolling_panel` | `references/official/bedrock-samples-ui/chat_screen.json`, `ui_common.json` | long lists, chat logs, form panels |
| `scrollbar_box`, `scrollbar_track` | `references/official/bedrock-samples-ui/ui_common.json` | custom scroll handle and track styling |
| `uv` animation | `references/official/bedrock-samples-ui/hud_screen.json` | sprite sheet animation and frame selection |
| `tiled` | `references/official/bedrock-samples-ui/hud_screen.json` | repeating texture strips |
| `layer` | almost every vanilla screen | z-order management |
| `close_on_player_hurt` | `references/official/bedrock-samples-ui/chest_screen.json` | container/screen behavior |
| `text_alignment`, `font_type`, `font_scale_factor` | `references/official/bedrock-samples-ui/hud_screen.json`, `chat_screen.json` | readable HUD text and chat text |

For a broader schema-like catalogue of element types, inherited property groups, renderers, animation fields, input/focus fields, and text/sprite properties, use:

- `docs/48-json-ui-field-catalogue.md`

## Factory pattern

Use when the UI needs elements created by a collection or an engine-provided stream.

Source examples:

- `chat_screen.json`: `messages_stack_panel` uses `factory.name = "messages_factory"`
- `chest_screen.json`: selected item detail factories are inserted into the root controls

Rules:

- A `factory` often needs a matching collection or engine factory name.
- Do not rename factory names unless you know they are custom pack-local factories.
- When adapting, keep `control_name` or `control_ids` aligned with the target namespace.

Search:

```powershell
rg -n '\"factory\"|\"type\": \"factory\"|\"control_name\"|\"control_ids\"' references/official/bedrock-samples-ui references/source-packs references/local-examples -g *.json
```

## Collection grid pattern

Use for slot layouts, buttons, score entries, and repeated rows.

Source examples:

- `chest_screen.json`: `small_chest_grid` and `large_chest_grid`
- `chat_screen.json`: autocomplete grid
- local form examples: `form_buttons`

Core fields:

- `type: "grid"`
- `grid_dimensions`
- `grid_item_template`
- `collection_name`

AI rule:

- If the target collection is engine-provided, do not invent the collection name.
- If the collection is form-driven, inspect the current `server_form.json`.

## Renderer pattern

Use built-in renderers only when the target screen already supports the renderer context.

Source examples from `hud_screen.json`:

- `hotbar_renderer`
- `heart_renderer`
- `hunger_renderer`
- `armor_renderer`
- `bubbles_renderer`
- `common.item_renderer`

Rules:

- `renderer` is not a normal texture path.
- Many renderers are screen/context-specific.
- For custom icons, prefer normal `image` controls and verified texture paths.

## Button mapping pattern

Use for custom buttons, HUD interaction, chat input, or dev-console style overlays.

Fields seen in vanilla:

- `from_button_id`
- `to_button_id`
- `mapping_type`
- `handle_select`
- `handle_deselect`
- `consume_event`
- `button_up_right_of_first_refusal`

AI rule:

- Do not add global mappings casually. They can steal input from other screens.
- For HUD interaction, check `always_accepts_input`, `always_listen_to_input`, and overlay screen behavior.

## Variables and screen branching

Use `variables` with `requires` when one screen must behave differently on desktop/pocket or when optional behavior should be enabled.

Source:

- `chest_screen.json`

Common pattern:

- `requires: "$desktop_screen"`
- `requires: "$pocket_screen"`
- set `$screen_content`
- set `$screen_bg_content`
- set screen-specific variables

## Scrollbar styling

Use `ui_common.json` for vanilla scroll handle names and fade behavior.

Useful controls:

- `common.scrollbar_box_image`
- `common.touch_scrollbar_box_image`
- `common.new_touch_scrollbar_box_image`
- `common.scroll_indent_image`
- `common.scrolling_panel`

Animation:

- `common.anim_scrollbar_box_fadeout`

## Layering pattern

Use `layer` to fix visual order, but keep ranges disciplined.

Practical guidance:

- background: low layers
- normal controls: middle layers
- text/icons above panel backgrounds
- drag/flying item renderers and HUD overlays: high layers

If text disappears behind an image, inspect layer first before changing anchors or sizes.

## Search commands

```powershell
rg -n '\"renderer\"|\"property_bag\"|\"variables\"|\"requires\"' references/official/bedrock-samples-ui -g *.json
rg -n '\"grid_dimensions\"|\"grid_item_template\"|\"collection_name\"' references/official/bedrock-samples-ui references/source-packs references/local-examples -g *.json
rg -n '\"button_mappings\"|\"focus_identifier\"|\"focus_change_' references/official/bedrock-samples-ui references/source-packs -g *.json
```
