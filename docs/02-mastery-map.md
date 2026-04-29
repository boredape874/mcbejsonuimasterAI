# Mastery Map

Use this order to learn or analyze MCBE JSON UI efficiently.

## 1. Basics and mental model

Learn first:

- what a resource pack is
- how JSON UI is loaded
- why `_ui_defs.json` matters
- why there is no one fixed Bedrock screen size
- how screens differ from templates
- how `manifest.json`, pack priority, `textures/`, `font/`, and `texts/` affect UI behavior
- how JSON UI layout units and anchors behave across device modes
- how to collect a useful UI spec before implementing

Primary files:

- `docs/52-json-ui-intake-questionnaire.md`
- `docs/11-basics-and-mental-model.md`
- `docs/23-bedrock-resource-pack-basics.md`
- `docs/24-json-ui-layout-units.md`
- `references/mirrors/bedrock-wiki-json-ui/json-ui-intro.md`
- `references/mirrors/bedrock-wiki-json-ui/add-hud-elements.md`
- `references/verified-samples/bedrock-samples-ui/_ui_defs.json`

## 2. Entry points and structure

Learn first:

- `_ui_defs.json`
- screen registration
- namespaces
- modifications
- factories

Primary files:

- `references/sample-packs/modern-cloud-ui-reference/ui/_ui_defs.json`
- `references/sample-packs/rpg-server-ui-reference/ui/_ui_defs.json`
- `references/sample-packs/farm-ui-variants/GfE8ULhgL4I/ui/_ui_defs.json`
- `references/local-utils/integrated-sample/ui/_ui_defs.json`

## 3. HUD and chat

Learn next:

- root panel injection
- HUD extension
- chat screen modification
- title and actionbar as data channels

Primary files:

- `references/sample-packs/modern-cloud-ui-reference/ui/hud_screen.json`
- `references/sample-packs/modern-cloud-ui-reference/ui/chat_screen.json`
- `references/sample-packs/rpg-server-ui-reference/ui/hud_screen.json`
- `references/sample-packs/farm-ui-variants/z65tCLQRo0Q/ui/hud_screen.json`
- `references/local-utils/json-ui-utils/topbar_chat_notification_utils.json`
- `references/local-utils/json-ui-utils/tablist_hud_screen.json`

## 4. Server forms

Learn next:

- `server_form` namespace
- long or custom form routing
- title prefix routing
- chest and furnace substitution

Primary files:

- `references/sample-packs/modern-cloud-ui-reference/ui/server_form.json`
- `references/sample-packs/rpg-server-ui-reference/ui/server_form.json`
- `references/sample-packs/farm-ui-variants/GfE8ULhgL4I/ui/server_form.json`

## 5. Reusable patterns

Learn next:

- animated bars
- standalone animation chains
- dumper-derived animation values
- dumper-derived factories, grids, renderers, focus, and input mappings
- server form and screen design families
- scoreboard overlays
- chest and pocket container layouts
- vertical scroll panels
- horizontal carousel patterns
- reusable presets
- how to convert design choices into IR constraints for exact geometry
- how to route broad tasks through target, feature family, data source, and closest reference
- how to extract useful patterns from restricted local references without copying their identity

Primary files:

- `docs/44-design-to-ir-mapping.md`
- `docs/52-json-ui-intake-questionnaire.md`
- `docs/55-reference-task-taxonomy.md`
- `docs/56-local-json-ui-reference-pack-analysis.md`
- `docs/57-hierarchical-task-router.md`
- `docs/58-design-reference-atlas.md`
- `docs/59-diagrammatic-workflows.md`
- `docs/33-animation-patterns-and-dumper-values.md`
- `docs/35-scroll-and-carousel-patterns.md`
- `docs/36-dumper-value-cookbook.md`
- `docs/37-vanilla-dumper-screen-recipes.md`
- `docs/38-advanced-json-ui-recipes.md`
- `docs/39-design-recommendation-catalog.md`
- `docs/40-server-form-example-index.md`
- `references/sample-packs/rpg-server-ui-reference/ui/animated_bar.json`
- `references/sample-packs/farm-ui-variants/tDAp1yJMUYo/ui/animated_bar.json`
- `references/verified-samples/bedrock-samples-ui/hud_screen.json`
- `references/verified-samples/bedrock-samples-ui/ui_common.json`
- `references/sample-packs/modern-cloud-ui-reference/ui/scoreboards.json`
- `references/sample-packs/farm-ui-variants/Y5dOnRAM7js/ui/custom_pocket_containers.json`
- `references/local-utils/json-ui-utils/progress_bar_utils.json`
- `references/local-utils/json-ui-utils/title_progress_utils.json`
- `references/local-utils/json-ui-utils/prefix_router_utils.json`
- `references/local-examples/rpg-hud/ui/rpg_hud.json`
- `references/local-examples/multi-animated-progress/ui/hud_screen.json`
- optional local restricted mirrors under `references/restricted/json-ui-reference-packs/`

## 6. Bindings, validation, and merge safety

Learn next:

- screen-specific bindings
- hardcoded values
- binding dump lookup
- collection, view, and search binding patterns
- pack merge risks
- validation script workflow
- common failure triage
- token-efficient route selection
- machine-readable task and hierarchy indexes

Primary files:

- `docs/19-bindings-and-hardcoded-values.md`
- `docs/34-binding-patterns-value-index.md`
- `docs/20-pack-merge-playbook.md`
- `docs/26-common-failure-modes.md`
- `docs/27-token-efficient-routing.md`
- `docs/55-reference-task-taxonomy.md`
- `docs/57-hierarchical-task-router.md`
- `data/reference-task-index.json`
- `data/reference-hierarchy.json`
- `data/design-reference-index.json`
- `docs/29-mcbe-json-ui-resource-upstream.md`
- `docs/30-file-and-code-fragment-usage.md`
- `docs/31-fragment-routing-table.md`
- `docs/32-minecraft-bedrock-json-ui-sample-upstream.md`
- `scripts/validate-json-ui-pack.ps1`
- `references/verified-samples/bedrock-samples-ui/hud_screen.json`
- `references/verified-samples/bedrock-samples-ui/server_form.json`

## 7. Full addon integration

Learn last:

- how UI depends on textures, fonts, blocks, items, and addon data
- where UI changes stop and addon asset changes begin
- how PMMP drives title, actionbar, chat, scoreboard, and form UI

Primary source:

- `references/sample-packs/rpg-server-ui-reference/`
- `docs/25-pmmp-json-ui-bridge.md`
- `docs/28-local-example-mining.md`
