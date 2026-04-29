# Skill Map

# `mcbe-json-ui-basics`

Use for:

- beginner onboarding
- what a resource pack is
- what JSON UI is
- `_ui_defs.json` mental model
- screen vs template distinctions
- practical screen-size and layout expectations
- resource-pack folder roles
- JSON UI layout units

## `mcbe-json-ui-master`

Top-level router for end-to-end Bedrock JSON UI work.

Use this when the task spans multiple areas:

- planning or intake for a new UI
- basics or mental model
- pack structure
- HUD or chat
- title or actionbar protocols
- server forms
- server form visual direction and design recommendation
- debugging
- addon integration
- vanilla asset lookup

For new UI planning, start with `docs/52-json-ui-intake-questionnaire.md`, then route geometry to `mcbe-json-ui-ir-authoring` and Bedrock-specific behavior to the relevant topic skill.

For visual implementation, sizing, alignment, text fit, or "make it look like this" tasks, also apply `docs/54-visual-fit-and-reference-discipline.md` before editing files.

For broad "what reference should I use?" routing, apply `docs/55-reference-task-taxonomy.md`, then `docs/57-hierarchical-task-router.md` if the task spans multiple surfaces. Query `data/reference-task-index.json` and `data/reference-hierarchy.json` for machine-readable routing.

For restricted local example packs, use `docs/56-local-json-ui-reference-pack-analysis.md`. Raw mirrors under `references/restricted/` are pattern evidence only and must not be copied into public docs with source names, credits, or restricted texture paths.

For the `advanced-ui-set` restricted reference set, use `docs/60-advanced-ui-set-special-ui-reference.md`, `docs/61-advanced-ui-set-file-pattern-routes.md`, `docs/62-special-form-device-ui-patterns.md`, `docs/63-premium-form-gallery.md`, and `docs/64-motion-form-hud-reference.md`. This route covers device/phone forms, premium shop/store forms, animation-heavy ability/progression forms, shop purchase popups, quest tabs, NPC/book forms, battle command UI, creature/database/storage forms, advanced chest-form routing, status/reward HUDs, and protocol HUD suites.

For visual design work, use `docs/58-design-reference-atlas.md` and `docs/59-diagrammatic-workflows.md` so the AI records design family, layout skeleton, state pattern, data source, closest reference, and patch target before editing.

## `mcbe-json-ui-ir-authoring`

Use for:

- layout-heavy planning
- position, size, alignment, equal spacing, and symmetry
- image/spec to IR conversion
- generating `workspace/<task>/ir.yaml` before final JSON UI hand-finish

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
- server form design family selection and size planning

## `mcbe-json-ui-patterns`

Use for:

- animated bars
- topbar notifications
- reusable templates
- chest UI patterns
- pocket container patterns
- scoreboard patterns
- tablist and utility-library patterns
- design catalogs for choosing a reference style before implementation
- premium local pattern summaries such as `docs/53-premium-ui-pattern-reference.md`
- restricted local reference pack summaries such as `docs/56-local-json-ui-reference-pack-analysis.md`
- special device/form/HUD suites from `docs/60-advanced-ui-set-special-ui-reference.md`
- animation-heavy progression, purchase popup, and HUD animation routes from `docs/64-motion-form-hud-reference.md`

## `mcbe-json-ui-debugging`

Use for:

- invisible controls
- broken bindings
- missing textures
- wrong namespace injection
- failed server form replacement
- first-pass failure mode triage

## `mcbe-json-ui-addon-integration`

Use for:

- UI linked to textures, fonts, blocks, items, entities, or addon data
- BP and RP cross-reference work
- addon-wide asset tracing
- PMMP-to-title/actionbar/chat/form bridge design

## `mcbe-json-ui-vanilla-assets`

Use for:

- vanilla `textures/ui/*`
- vanilla item icon verification
- vanilla block icon verification
- current vanilla screen file lookup
- explaining how to search and apply the right vanilla source

This skill uses `vanilla resource mirror` as the upstream authority.

## `mcbe-json-ui-research`

Use for:

- selecting the right external source
- deciding whether a question needs local samples, verified sample source samples, community reference docs, or Ztech
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
