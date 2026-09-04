# Skill Map

## `mcbe-json-ui-basics`

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

Short top-level router for broad or cross-layer tasks. It selects the smallest specialist skill and does not load every topic document.

Machine-readable routing uses:

1. `data/skill-tool-profiles.json` for the selected skill's ordered tools and boundaries.
2. `data/ai-tool-registry.json` for exact command, status, input, output, and failure contracts.
3. `tools/skill-doctor.mjs` before execution and `tools/skill-context.mjs` to expand only one profile.

Never invoke a tool reported as planned or unavailable. Narrow tasks should start directly with their specialist skill.

## `mcbe-json-ui-visual-design`

Use for measured proportions, position, size, spacing, alignment, typography, nine-slice surfaces, and visual states.

Preferred flow:

```text
visual-design -> design.search -> IR authoring -> pipeline.run -> preview.texture
```

Use only stages confirmed available by the skill profile. Static previews are evidence, not Bedrock runtime proof.

## `mcbe-json-ui-reference`

Use for exact control, property, binding, catalog, vanilla screen, texture, or atlas lookup. Return the evidence path and label the result as confirmed, sample-observed, inferred, or unresolved instead of guessing.

## `mcbe-json-ui-samples`

Use to mine working RP/BP samples while preserving source tier, revision, license, and redistribution limits.

When every stage is available, use:

```text
sources.validate -> source.scan -> catalog.build -> design.search
```

Restricted or local-only inputs remain local evidence and are not copied into public output.

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
- BP Script API and server-sender title/actionbar/chat/form protocol design

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
