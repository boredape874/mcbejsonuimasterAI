# Production RPG UI Prompt

```text
Use mcbe-json-ui-master, mcbe-json-ui-ir-authoring, mcbe-json-ui-tools-runner,
mcbe-json-ui-hud-and-chat, mcbe-json-ui-server-forms, and mcbe-json-ui-debugging.

Target resource pack:
- <path>

Server or behavior-pack integration:
- <path and data source>

Build a compact production RPG HUD plus an asymmetric four-card server-form menu.
Use docs/67-production-rpg-ui-architecture.md and the rpg_hud/rpg_menu IR templates.
Run the geometry pipeline first, then hand-finish bindings, animation events,
form collections, button states, title routing, textures, and _ui_defs registration.
Keep unrelated forms on the vanilla fallback and all transient HUD surfaces hidden
until a concrete payload condition enables them. Validate the complete pack and
report every remaining warning with its exact file path.
```
