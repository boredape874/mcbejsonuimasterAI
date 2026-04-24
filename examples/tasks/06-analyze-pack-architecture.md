# Task: Analyze Pack Architecture

## Goal

Map a Bedrock JSON UI pack so another developer or AI can modify it safely.

## Recommended skills

- `mcbe-json-ui-master`
- `mcbe-json-ui-addon-integration`
- `mcbe-json-ui-research`

## Inspect first

- `_ui_defs.json`
- all `ui/*.json`
- `textures/ui/*`
- any related fonts, items, blocks, or Script API code

## Expected workflow

1. identify entry points
2. identify shared template files
3. identify HUD, chat, form, and container systems
4. identify data channels such as title, actionbar, chat, or factory collections
5. identify asset dependencies

## Expected result

- file-level architecture map
- data-channel map
- dependency map
- recommended safest patch points
