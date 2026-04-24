# Skill Map

## `mcbe-json-ui-master`

Top-level router for end-to-end Bedrock JSON UI work.

Use this when the task spans multiple areas:

- pack structure
- HUD or chat
- title or actionbar protocols
- server forms
- debugging
- addon integration
- vanilla asset lookup

## `mcbe-json-ui-foundations`

Use for:

- `_ui_defs.json`
- namespaces
- modifications
- factories
- pack structure

## `mcbe-json-ui-logic`

Use for:

- bindings
- variables
- string parsing
- delimiters
- visibility logic
- preserved text logic

## `mcbe-json-ui-hud-and-chat`

Use for:

- `hud_screen.json`
- `chat_screen.json`
- scoreboard overlays
- title and actionbar driven UI
- chat protocol rendering

## `mcbe-json-ui-server-forms`

Use for:

- `server_form.json`
- long form routing
- chest and furnace substitutions
- title prefix or suffix routing

## `mcbe-json-ui-patterns`

Use for:

- animated bars
- reusable templates
- chest UI patterns
- pocket container patterns
- scoreboard patterns

## `mcbe-json-ui-debugging`

Use for:

- invisible controls
- broken bindings
- missing textures
- wrong namespace injection
- failed server form replacement

## `mcbe-json-ui-addon-integration`

Use for:

- UI linked to textures, fonts, blocks, items, entities, or addon data
- BP and RP cross-reference work
- addon-wide asset tracing

## `mcbe-json-ui-vanilla-assets`

Use for:

- vanilla `textures/ui/*`
- vanilla item icon verification
- vanilla block icon verification
- current vanilla screen file lookup

This skill uses `ZtechNetwork/MCBVanillaResourcePack` as the upstream authority.

## `mcbe-json-ui-research`

Use for:

- selecting the right external source
- deciding whether a question needs local samples, Mojang samples, Bedrock Wiki, or Ztech
- documenting whether a result is confirmed or only inferred

## `mcbe-json-ui-schemas`

Use for:

- schema validation
- VSCode JSON schema setup
- deciding between Blockception and DJStompZone schema sources
- checking `ui`, `_ui_defs`, and `_global_variables` schema coverage

## `mcbe-json-ui-tooling`

Use for:

- visual editor workflows
- builder-generated JSON UI examples
- Chest-UI style authoring or chest-form systems
- understanding how tools shape JSON UI authoring
