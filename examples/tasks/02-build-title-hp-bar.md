# Task: Build Title-Driven HP Bar

## Goal

Implement an HP bar driven by PMMP or BP title text instead of direct gameplay bindings.

## Recommended skills

- `mcbe-json-ui-logic`
- `mcbe-json-ui-hud-and-chat`
- `mcbe-json-ui-patterns`

## Inspect first

- `hud_screen.json`
- any existing title or actionbar parsing logic
- local utility mirrors:
  - `references/local-utils/json-ui-utils/progress_bar_utils.json`
  - `references/local-utils/json-ui-utils/title_progress_utils.json`

## Expected workflow

1. choose a proven bar pattern
2. define the title prefix format
3. inject the bar into HUD
4. explain the PMMP title payload needed

## Expected result

- exact JSON patch
- title prefix examples
- notes on multiplier or max-value tuning
