# Local Utils And Patterns

This document catalogs extra reusable material mirrored from a local resource-pack workspace.

Use these files when the task needs a working local pattern rather than a generic explanation.

## `references/local-utils/json-ui-utils`

This folder is a utility library mirror. It is strong when the AI should adapt a pattern quickly.

### Topbar chat notification

Files:

- `topbar_chat_notification_utils.json`
- `topbar_chat_notification_hud_patch.json`
- `topbar_chat_notification_chat_screen_patch.json`
- `topbar_chat_notification_usage.md`

Use for:

- top-center alerts driven from chat
- icon plus message payloads
- hiding flagged lines from normal chat rendering

Input examples:

- `!topbar:Server restart in 5 minutes`
- `!topbar:textures/ui/bang_icon;Server restart in 5 minutes`

## Progress bar utility

Files:

- `progress_bar_utils.json`
- `title_progress_utils.json`
- `animated_bar_extra_example.json`
- `progress_bar_utils_usage.md`

Use for:

- title-driven HP or mana bars
- reusable animated bars
- bar plus text overlay presets
- trail or delayed animation effects

Important pattern:

- the bar reads encoded title text, not direct health state

## String and state helpers

Files:

- `split_string_utils.json`
- `preserve_state_utils.json`
- `prefix_router_utils.json`

Use for:

- delimiter-based parsing
- preserving state between UI updates
- routing different message prefixes to different controls

## Tooltip utility

Files:

- `tooltip_card_utils.json`

Use for:

- card-style tooltip backgrounds
- hover text surfaces
- tooltip shells reused across inventory-like UIs

## Tablist example

Files:

- `tablist_hud_screen.json`

Use for:

- HUD-side player list or tab list patterns
- stack panel list composition
- touch and non-touch gating ideas

## `references/local-utils/integrated-sample`

This is a compact all-in-one sample pack mirror. It is useful when the task spans several UI files together.

Files:

- `ui/_ui_defs.json`
- `ui/ui_common.json`
- `ui/hud_screen.json`
- `ui/chat_screen.json`
- `ui/scoreboards.json`
- `ui/server_form.json`
- `ui/form.json`
- `ui/npc.json`

Use for:

- seeing how one pack wires multiple screens together
- studying shared template usage
- cross-file scoreboard and HUD integration
- NPC screen relationships

## How to use these local utils correctly

1. treat them as working patterns, not universal Bedrock rules
2. copy only the minimum needed structure
3. rebind namespaces and texture paths to the target pack
4. confirm the new file is listed in `_ui_defs.json`
5. confirm the target screen already has a compatible insertion point

## Best use cases

These local mirrors are especially good for:

- PMMP title or chat protocol driven HUDs
- scoreboard overlays
- topbar notifications
- lightweight utility libraries for repeated UI behavior
- "show me a working local pattern first" tasks
