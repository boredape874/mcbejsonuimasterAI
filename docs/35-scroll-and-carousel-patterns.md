# Scroll And Carousel Patterns

This document indexes high-value scroll, horizontal layout, and scroll-like animation patterns.

## Vertical scrolling panel

Use for long forms, quest lists, shop lists, and settings panels.

Sources:

- `references/external/json-ui-examples/scroll_panel_template.json`
- `references/source-packs/custom-crops-reference/ui/shop.json`
- `references/source-packs/custom-crops-reference/ui/quest.json`
- `references/upstreams/minecraft-bedrock-json-ui-sample/json ui 개발/ui/RainbowPieUI/ui_extras/server_form_controls.json`

Important fields:

| Field | Use |
| --- | --- |
| `type: "scroll_view"` | raw scroll view element |
| `common.scrolling_panel` | vanilla reusable scrolling template |
| `scrollbar_track` | named track control |
| `scrollbar_box` | draggable thumb control |
| `scroll_content` | control containing the scrollable content |
| `scroll_view_port` | clipped viewport control |
| `scrollbar_always_visible` | force scrollbar visibility |
| `always_handle_scrolling` | handle wheel/touch scroll more aggressively |
| `jump_to_bottom_on_update` | chat/log style behavior |

## Horizontal layout

Use for rows of buttons, tab bars, quick slots, and horizontal item groups.

Sources:

- `references/source-packs/custom-crops-reference/ui/stat.json`
- `references/source-packs/custom-crops-reference/ui/skill.json`
- `references/source-packs/custom-crops-reference/ui/menu.json`
- `references/upstreams/minecraft-bedrock-json-ui-sample/json ui 개발/ui/RainbowPieUI/ui_extras/settings_sections/general_section_controls.json`

Pattern:

- use `stack_panel`
- set `orientation` to `horizontal`
- give repeated children stable width
- wrap overflow areas with a clipped parent
- if interaction is needed, confirm focus and button mappings

## Horizontal scrolling

Bedrock's common vanilla helper is mostly vertical-scroll oriented. For horizontal scrolling, prefer one of these routes:

1. Raw `scroll_view` with a horizontal `scrollbar_box` and `draggable: "horizontal"` if the target version supports the needed behavior.
2. A clipped viewport plus animated `offset` for carousel-like movement.
3. A tab or page strip where buttons change which panel is visible instead of physically scrolling.

Practical source for raw scroll components:

- `references/external/json-ui-examples/scroll_panel_template.json`

Practical source for offset animation:

- `references/upstreams/minecraft-bedrock-json-ui-sample/json ui 개발/ui/RainbowPieUI/ui_extras/settings_sections/general_section_controls.json`
- `references/upstreams/minecraft-bedrock-json-ui-sample/json ui 개발/ui/RainbowPieUI/ui_extras/start_screen_controls.json`

## Horizontal scroll animation recipe

Use when you want a carousel, rotating banner, or sliding tab page.

1. Create a fixed-size parent panel.
2. Set `clips_children` to `true`.
3. Put a wide child `stack_panel` inside it.
4. Give the child `orientation: "horizontal"`.
5. Animate the child `offset` with `anim_type: "offset"`.
6. Use `play_event` or button `pressed_button_name` to trigger page changes.
7. Use `animation_reset_name` when repeated play/reset is needed.

Do not use viewport-width font scaling or unstable `%c` sizes for the moving child; the child should have predictable dimensions.

## Search commands

```powershell
rg -n 'scroll_view|common.scrolling_panel|scrollbar_box|scrollbar_track|scroll_content|scroll_view_port' references -g *.json -g *.jsonc
rg -n '\"orientation\": \"horizontal\"|\"draggable\": \"horizontal\"|\"clips_children\": true' references -g *.json -g *.jsonc
rg -n '\"anim_type\": \"offset\"|\"play_event\"|\"animation_reset_name\"' references -g *.json -g *.jsonc
```

## AI rules

- For normal long lists, use vertical `common.scrolling_panel`.
- For horizontal carousels, prefer clipped offset animation unless a raw horizontal `scroll_view` has been tested in the target pack.
- Keep scroll content separate from the scrollbar controls.
- Always register any custom utility file in `_ui_defs.json`.
