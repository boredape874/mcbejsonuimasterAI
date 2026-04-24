# Task: Add HUD Overlay

## Goal

Add a new HUD overlay to an existing pack without breaking current HUD behavior.

## Recommended skills

- `mcbe-json-ui-foundations`
- `mcbe-json-ui-hud-and-chat`
- `mcbe-json-ui-master`

## Inspect first

- `_ui_defs.json`
- `hud_screen.json`
- shared template files such as `ui_common.json`

## Expected workflow

1. confirm the overlay file is loaded or add it to `_ui_defs.json`
2. find the correct `root_panel` insertion point
3. insert with the smallest viable `modifications` patch
4. confirm texture dependencies

## Expected result

- exact files to patch
- exact namespace and control names
- exact insertion point
- any new texture path requirements
