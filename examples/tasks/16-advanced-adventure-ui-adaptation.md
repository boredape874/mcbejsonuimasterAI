# Task: Adapt Advanced Adventure UI Patterns

Use this when a pack needs a large polished UI system: store, battle pass, quest board, equipment, NPC vendor, navigation, or reward toast.

## Goal

Adapt the architecture from `docs/50-advanced-ui-reference-analysis.md` into a target Bedrock resource pack without copying private source assets.

## Recommended Skills

- `mcbe-json-ui-master`
- `mcbe-json-ui-server-forms`
- `mcbe-json-ui-patterns`
- `mcbe-json-ui-vanilla-assets`

## Inspect First

1. `docs/50-advanced-ui-reference-analysis.md`
2. target pack `ui/_ui_defs.json`
3. target pack `ui/server_form.json` or the target screen file
4. target pack texture folders
5. if available locally, only the matching private reference family under `references/private/advanced-ui-reference/ui-pack/ui/<feature_root>/`

## Required Decisions

- which family is being adapted: battle pass, store, quest, NPC, equipment, map, reward toast, or generic router
- route prefix and payload format controlled by PMMP
- modal vs full-screen shell
- root size and max size
- header/body/footer split
- grid dimensions and item template
- icon and button sizes
- texture ownership: target pack assets, vanilla assets, or new generated assets

## Expected Result

The AI should return:

- files changed
- exact JSON UI controls added or modified
- `_ui_defs.json` registration changes
- route/payload convention PMMP should emit
- exact dimensions and ratios used
- texture paths verified in the target pack
- validation command result
- any private-reference assumptions that were inferred rather than verified

## Prompt

```text
Use mcbe-json-ui-master, mcbe-json-ui-server-forms, and mcbe-json-ui-patterns.
Adapt an advanced adventure UI pattern into this pack:

Target pack:
- <path>

Feature:
- <battle pass / store / quest / NPC vendor / equipment / map / reward toast>

Route prefix:
- <prefix>

Payload:
- <title/body/button format emitted by PMMP>

Style constraints:
- <dark RPG / bright shop / quest parchment / compact equipment / full-screen store>

Requirements:
- use docs/50-advanced-ui-reference-analysis.md as the design source
- inspect private reference files only if they exist locally
- do not commit or paste private source JSON
- rewrite into the target namespace
- keep vanilla fallback where needed
- state exact sizes and texture paths
- validate after editing
```
