# Task: Build A Production RPG HUD And Menu

Use this when one resource pack needs a compact live RPG HUD and a polished routed server-form dashboard.

## Goal

Build the geometry from the bundled RPG IR templates, then hand-finish Bedrock bindings, animations, form collections, route markers, and target-owned textures.

## Recommended Skills

- `mcbe-json-ui-master`
- `mcbe-json-ui-ir-authoring`
- `mcbe-json-ui-tools-runner`
- `mcbe-json-ui-hud-and-chat`
- `mcbe-json-ui-server-forms`
- `mcbe-json-ui-debugging`
- `mcbe-json-ui-vanilla-assets`

## Inspect First

1. `docs/67-production-rpg-ui-architecture.md`
2. `templates/ir/rpg_hud.yaml`
3. `templates/ir/rpg_menu.yaml`
4. target `ui/_ui_defs.json`, `ui/hud_screen.json`, and `ui/server_form.json`
5. target feature files and `textures/ui/`

## Required Decisions

- title/actionbar/form channel ownership
- versioned HUD payload and route marker
- live player renderer fallback
- HP, MP, defense, EXP, and currency source values
- custom menu card collection and button event wiring
- desktop/touch and GUI-scale limits
- custom texture ownership versus verified vanilla keys

## Expected Result

- compiled clean geometry for both templates
- thin vanilla entry files and isolated feature namespaces
- one parsed value per payload field, reused by labels and bars
- event-driven bar changes and hidden-by-default transient panels
- normal, hover, and pressed server-form button states
- vanilla fallback for unrelated forms
- complete `_ui_defs.json` registration
- a full pack validation report and remaining runtime-only checks

## Prompt

```text
Use mcbe-json-ui-master, mcbe-json-ui-ir-authoring, mcbe-json-ui-tools-runner,
mcbe-json-ui-hud-and-chat, and mcbe-json-ui-server-forms.

Target RP:
- <resource pack path>

Target BP or server integration:
- <behavior pack, Script API, or external server integration path>

Build a production RPG UI suite using docs/67-production-rpg-ui-architecture.md.
Start the HUD from templates/ir/rpg_hud.yaml and the routed menu from
templates/ir/rpg_menu.yaml. Preserve the solved geometry when hand-finishing.

Requirements:
- compact live-player HUD with HP, MP, defense, EXP, level, and currency
- animated stat fills driven by concrete bindings
- asymmetric four-card server-form dashboard with bound text and icons
- hidden-by-default dialogue, toast, title, and notification surfaces
- vanilla fallback for forms that do not match the route marker
- exact-case texture verification and _ui_defs registration
- full pack validation after implementation
```
