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

Primary files:

- `docs/11-basics-and-mental-model.md`
- `docs/23-bedrock-resource-pack-basics.md`
- `docs/24-json-ui-layout-units.md`
- `references/external/bedrock-wiki-json-ui/json-ui-intro.md`
- `references/external/bedrock-wiki-json-ui/add-hud-elements.md`
- `references/official/bedrock-samples-ui/_ui_defs.json`

## 2. Entry points and structure

Learn first:

- `_ui_defs.json`
- screen registration
- namespaces
- modifications
- factories

Primary files:

- `references/source-packs/1seulbi/ui/_ui_defs.json`
- `references/source-packs/custom-crops-reference/ui/_ui_defs.json`
- `references/source-packs/bunnyfarm/GfE8ULhgL4I/ui/_ui_defs.json`
- `references/local-utils/integrated-sample/ui/_ui_defs.json`

## 3. HUD and chat

Learn next:

- root panel injection
- HUD extension
- chat screen modification
- title and actionbar as data channels

Primary files:

- `references/source-packs/1seulbi/ui/hud_screen.json`
- `references/source-packs/1seulbi/ui/chat_screen.json`
- `references/source-packs/custom-crops-reference/ui/hud_screen.json`
- `references/source-packs/bunnyfarm/z65tCLQRo0Q/ui/hud_screen.json`
- `references/local-utils/json-ui-utils/topbar_chat_notification_utils.json`
- `references/local-utils/json-ui-utils/tablist_hud_screen.json`

## 4. Server forms

Learn next:

- `server_form` namespace
- long or custom form routing
- title prefix routing
- chest and furnace substitution

Primary files:

- `references/source-packs/1seulbi/ui/server_form.json`
- `references/source-packs/custom-crops-reference/ui/server_form.json`
- `references/source-packs/bunnyfarm/GfE8ULhgL4I/ui/server_form.json`

## 5. Reusable patterns

Learn next:

- animated bars
- scoreboard overlays
- chest and pocket container layouts
- reusable presets

Primary files:

- `references/source-packs/custom-crops-reference/ui/animated_bar.json`
- `references/source-packs/bunnyfarm/tDAp1yJMUYo/ui/animated_bar.json`
- `references/source-packs/1seulbi/ui/scoreboards.json`
- `references/source-packs/bunnyfarm/Y5dOnRAM7js/ui/custom_pocket_containers.json`
- `references/local-utils/json-ui-utils/progress_bar_utils.json`
- `references/local-utils/json-ui-utils/title_progress_utils.json`
- `references/local-utils/json-ui-utils/prefix_router_utils.json`
- `references/local-examples/rpg-hud/ui/rpg_hud.json`
- `references/local-examples/multi-animated-progress/ui/hud_screen.json`

## 6. Bindings, validation, and merge safety

Learn next:

- screen-specific bindings
- hardcoded values
- pack merge risks
- validation script workflow
- common failure triage
- token-efficient route selection

Primary files:

- `docs/19-bindings-and-hardcoded-values.md`
- `docs/20-pack-merge-playbook.md`
- `docs/26-common-failure-modes.md`
- `docs/27-token-efficient-routing.md`
- `docs/29-mcbe-json-ui-resource-upstream.md`
- `docs/30-file-and-code-fragment-usage.md`
- `docs/31-fragment-routing-table.md`
- `scripts/validate-json-ui-pack.ps1`
- `references/official/bedrock-samples-ui/hud_screen.json`
- `references/official/bedrock-samples-ui/server_form.json`

## 7. Full addon integration

Learn last:

- how UI depends on textures, fonts, blocks, items, and addon data
- where UI changes stop and addon asset changes begin
- how PMMP drives title, actionbar, chat, scoreboard, and form UI

Primary source:

- `references/source-packs/custom-crops-reference/`
- `docs/25-pmmp-json-ui-bridge.md`
- `docs/28-local-example-mining.md`
