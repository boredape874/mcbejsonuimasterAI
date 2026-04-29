# Advanced JSON UI Recipes

This document groups high-value recipes that are common in real Bedrock server/resource-pack work.

## Animated tab strip

Use when a custom screen has multiple tabs or categories.

Sources:

- `references/verified-samples/bedrock-samples-ui/inventory_screen.json`
- `references/reference-mirrors/minecraft-bedrock-json-ui-sample/json ui 개발/ui/sample UI suiteUI/ui_extras/settings_sections/general_section_controls.json`

Core ideas:

- one base tab control
- `toggle_group_forced_index`
- `toggle_state_binding_name`
- `focus_identifier`
- `anim_type: "offset"` for entrance
- `variables` to add animations only when `$animate` is true

## Searchable form list

Use when a PMMP form has many buttons and needs filtering.

Sources:

- `references/reference-mirrors/minecraft-bedrock-json-ui-sample/dynamic form library/dynamic form libraryV2-1.0.3.3/dynamic form libraryV2-1.0.3.3/dynamic form library2/package_custom/common_custom.jsonc`
- `docs/34-binding-patterns-value-index.md`

Core ideas:

- read `#form_button_text` from `form_buttons`
- read search text from a text box control
- compare text with subtraction expression
- route result into `#visible`

## Dynamic HUD message list

Use when the server sends multiple HUD messages or chat-like overlays.

Sources:

- `references/verified-samples/bedrock-samples-ui/chat_screen.json`
- `references/sample-packs/modern-cloud-ui-reference/ui/hud_screen.json`
- `references/local-utils/json-ui-utils/topbar_chat_notification_utils.json`

Core ideas:

- use a `stack_panel`
- use `factory` when an engine collection exists
- otherwise use PMMP title/actionbar/chat markers and controlled fixed slots
- use fade/offset animation for entry and exit

## Item icon row

Use when a UI needs item icons from game collections, not static texture paths.

Sources:

- `references/verified-samples/bedrock-samples-ui/chat_screen.json` autocomplete item renderer
- `references/verified-samples/bedrock-samples-ui/hud_screen.json` hotbar item renderer

Core ideas:

- use `common.item_renderer`
- bind item ID/AUX data from a collection
- keep manual sizing because item renderers do not behave like normal images

For custom resource-pack icons, use verified `textures/ui/*`, `textures/items/*`, or atlas entries instead.

## Polished long list

Use for shops, quests, settings, and server form pages.

Sources:

- `references/verified-samples/bedrock-samples-ui/chat_screen.json`
- `references/verified-samples/bedrock-samples-ui/ui_common.json`
- `references/sample-packs/rpg-server-ui-reference/ui/shop.json`
- `references/sample-packs/rpg-server-ui-reference/ui/quest.json`

Core ideas:

- wrap content in `common.scrolling_panel`
- define a separate scrolling content control
- tune `$scroll_size`, `$scrolling_pane_size`, `$scrolling_pane_offset`
- keep scrollbar visuals in common controls

## Interactive HUD overlay

Use when a HUD element must accept clicks or keyboard input.

Sources:

- `references/community-patterns/interactable-hud-menu.md`
- `references/verified-samples/bedrock-samples-ui/chat_screen.json`
- `references/verified-samples/bedrock-samples-ui/hud_screen.json`

Core ideas:

- HUD alone is not always enough; an overlay screen may be used to focus input
- use `button_mappings`
- use `always_accepts_input` and `always_listen_to_input` carefully
- do not use global mappings that break chat/inventory unless the target screen is isolated

## Clipped carousel

Use when horizontal scroll is unreliable or too hard to focus across devices.

Sources:

- `docs/35-scroll-and-carousel-patterns.md`
- `references/reference-mirrors/minecraft-bedrock-json-ui-sample/json ui 개발/ui/sample UI suiteUI/ui_extras/start_screen_controls.json`

Core ideas:

- parent `panel` with fixed size
- `clips_children: true`
- wide child `stack_panel` with `orientation: "horizontal"`
- animate child `offset`
- buttons trigger page events

## Debug route for advanced recipes

For stronger production-style recipes, use `docs/53-premium-ui-pattern-reference.md`. It covers multi-route server form dispatch, loading placeholders, custom world loading screens, HUD progress bars, pocket-safe progress layout, container/cooking station UI, and reusable button/toggle templates.

If a copied recipe fails:

1. Check `_ui_defs.json` registration.
2. Check namespace references.
3. Check collection names.
4. Check whether the target screen has the same engine-provided bindings.
5. Check layers and clipping.
6. Temporarily replace custom textures with verified vanilla `textures/ui/White` or another confirmed texture.
