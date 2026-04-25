# Task: Adapt A Server Form Design

Use this when the goal is not only to make a form work, but to choose a good Bedrock-style visual direction and implement it safely.

## Goal

Turn a PMMP-driven form into a polished Bedrock JSON UI design using an existing reference family from `docs/39-design-recommendation-catalog.md`.

## Recommended skills

- `mcbe-json-ui-master`
- `mcbe-json-ui-server-forms`
- `mcbe-json-ui-vanilla-assets`

## Inspect first

1. `docs/39-design-recommendation-catalog.md`
2. target pack `ui/_ui_defs.json`
3. target pack `ui/server_form.json`
4. one selected design reference file from the catalog
5. target pack textures if the design needs custom icons

## Required decisions

- design family
- whether the user has already chosen a visual reference, or whether the AI must present 2-3 options first
- title prefix or routing condition
- whether to keep vanilla server form fallback
- modal width/height strategy
- list/button/slot row sizes
- scroll behavior for long text
- verified texture paths

## Expected result

The AI should return:

- files changed
- chosen design family and reason
- exact dimensions used for root, body, header, buttons, icons, and scroll regions
- PMMP title prefix or payload convention
- validation command result
- remaining limitations such as unsupported input fields or long text clipping

## Prompt

```text
Use mcbe-json-ui-master and mcbe-json-ui-server-forms.
Apply a server_form design to this pack:

Target pack:
- <path>

Feature:
- <feature description>

Preferred style:
- <style from docs/39-design-recommendation-catalog.md, or "choose one">

PMMP route:
- <title prefix or form title convention>

Data:
- <button names, descriptions, icons, prices, stats, progress values>

Requirements:
- if style is not explicit, present 2-3 recommended design references before editing
- keep vanilla fallback safe
- state exact dimensions used
- verify texture paths before using them
- update `_ui_defs.json` if needed
- validate the pack after changes
```
