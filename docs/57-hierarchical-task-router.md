# Hierarchical Task Router

Use this when an AI must choose the right Bedrock JSON UI docs and references for a broad task. The goal is to route from user intent to the smallest useful source set.

The machine-readable companion is `data/reference-hierarchy.json`.

## Mandatory Flow

1. Identify the target surface: HUD, chat, server form, container, loading screen, hotbar, pause/settings, or addon-integrated overlay.
2. Identify the feature family: bar, list, button grid, tooltip, command palette, renderer, form router, scroll panel, etc.
3. Identify the data source: static RP, title/actionbar/chat payload, server form collection, scoreboard collection, Script API, or PMMP.
4. If the task is visual, choose a design family from `docs/58-design-reference-atlas.md`.
5. Open the first matching docs row below.
6. Open one closest reference file.
7. Patch the target pack.
8. Validate JSON and do the visual-fit checklist.

Do not open all references. If two rows match, choose the row whose patch target is closest to the file being edited.

## Top-Level Routes

| Major Topic | Mid Topic | Sub Topic | Open First | Closest Reference | Patch Target |
| --- | --- | --- | --- | --- | --- |
| HUD | RPG/status bars | HP, mana, stamina, XP bars | `docs/25-pmmp-json-ui-bridge.md`, `docs/54-visual-fit-and-reference-discipline.md` | `references/local-examples/rpg-hud/ui/rpg_hud.json`, `references/local-examples/multi-animated-progress/ui/animated_bar.json` | `RP/ui/hud_screen.json` |
| HUD | hotbar relayout | vertical hotbar | `docs/16-screen-by-screen-reference.md`, `docs/56-local-json-ui-reference-pack-analysis.md` | `references/restricted/json-ui-reference-packs/vertical-hotbar-left-right/.../ui/hud_screen.json` | `RP/ui/hud_screen.json` |
| HUD | hotbar relayout | circular hotbar | `docs/16-screen-by-screen-reference.md`, `docs/56-local-json-ui-reference-pack-analysis.md` | `references/restricted/json-ui-reference-packs/circular-hotbar/ui/hud_screen.json` | `RP/ui/hud_screen.json` |
| HUD | interactable overlay | toggle/settings panel, draggable-like controls, live position sliders | `docs/38-advanced-json-ui-recipes.md`, `docs/56-local-json-ui-reference-pack-analysis.md` | `references/restricted/json-ui-reference-packs/minimap-overlay/ui/hud_screen.json` | `RP/ui/hud_screen.json`, addon files |
| HUD | minimap/3D renderer | 3D structure or entity-backed panel | `docs/15-json-ui-file-role-catalog.md`, `docs/56-local-json-ui-reference-pack-analysis.md` | `references/restricted/json-ui-reference-packs/minimap-overlay/ui/hud_screen.json` and addon JSONs | `RP/ui/hud_screen.json`, `RP/entity`, `RP/models`, `RP/render_controllers` |
| HUD | scoreboard | personal score, list score, sidebar | `docs/17-community-patterns-string-score-hud.md`, `docs/34-binding-patterns-value-index.md` | scoreboard examples and vanilla HUD | `RP/ui/scoreboards.json`, `RP/ui/hud_screen.json` |
| Chat | command palette | quick command sidebar, text formatting grid | `docs/37-vanilla-dumper-screen-recipes.md`, `docs/56-local-json-ui-reference-pack-analysis.md` | `references/restricted/json-ui-reference-packs/fast-commands/ui/chat_screen.json` | `RP/ui/chat_screen.json` |
| Chat | notifications | topbar/chat notification, hidden protocol line | `docs/25-pmmp-json-ui-bridge.md`, `docs/38-advanced-json-ui-recipes.md` | `references/local-utils/json-ui-utils/topbar_chat_notification_utils.json` | `RP/ui/chat_screen.json`, `RP/ui/hud_screen.json` |
| Chat | input area | move chat, custom text box, formatting buttons | `docs/37-vanilla-dumper-screen-recipes.md`, `docs/54-visual-fit-and-reference-discipline.md` | vanilla `chat_screen.json`, optional `fast-commands` restricted reference | `RP/ui/chat_screen.json` |
| Server Form | menu grid | quest/shop/skill/stat/NPC form | `docs/39-design-recommendation-catalog.md`, `docs/40-server-form-example-index.md` | one matching server form reference | `RP/ui/server_form.json` |
| Server Form | router | title prefix dispatch, long/custom fallback | `docs/40-server-form-example-index.md`, `docs/53-premium-ui-pattern-reference.md` | modern cloud or RPG server form router | `RP/ui/server_form.json` |
| Server Form | texture buttons | icon buttons, hover/pressed/locked states | `docs/49-json-ui-tutorial-index.md`, `docs/56-local-json-ui-reference-pack-analysis.md` | vanilla `ui_common.json`, optional `fast-commands` texture metadata | `RP/ui/server_form.json`, texture JSON |
| Server Form | ability/progression | skill tree, upgrade nodes, battlepass-like form | `docs/64-motion-form-hud-reference.md`, `docs/35-scroll-and-carousel-patterns.md` | `references/restricted/advanced-ui-set-ui/motion-form-gallery-a/ui/mai/components/ability/ability_upgrades_tab.json` | `RP/ui/server_form.json`, feature UI files |
| Server Form | shop/purchase/quest | product grid, purchase popup, quest tabs | `docs/64-motion-form-hud-reference.md`, `docs/61-advanced-ui-set-file-pattern-routes.md` | one `references/restricted/advanced-ui-set-ui/motion-form-gallery-a/ui/mai/components/` file | `RP/ui/server_form.json`, feature UI files |
| Special Form | device shell | phone/PDA/profile/guidebook with mapped button regions | `docs/60-advanced-ui-set-special-ui-reference.md`, `docs/62-special-form-device-ui-patterns.md` | `references/restricted/advanced-ui-set-ui/restricted-suite-b/ui/device_phone/second.json` | `RP/ui/server_form.json`, `RP/ui/device_*.json` |
| Battle UI | command panel | actor card, move buttons, PP/progress bars | `docs/60-advanced-ui-set-special-ui-reference.md`, `docs/61-advanced-ui-set-file-pattern-routes.md` | `references/restricted/advanced-ui-set-ui/restricted-suite-b/ui/creature/attack.json` | `RP/ui/server_form.json`, `RP/ui/battle*.json` |
| Database/Storage | application UI | database/detail page, PC/storage grid, team menu | `docs/60-advanced-ui-set-special-ui-reference.md`, `docs/61-advanced-ui-set-file-pattern-routes.md` | one `references/restricted/advanced-ui-set-ui/restricted-suite-b/ui/creature/*.json` file | `RP/ui/server_form.json`, `RP/ui/database*.json`, `RP/ui/storage*.json` |
| HUD | protocol suite | title payload to many widgets | `docs/60-advanced-ui-set-special-ui-reference.md`, `docs/61-advanced-ui-set-file-pattern-routes.md` | `references/restricted/advanced-ui-set-ui/restricted-suite-b/ui/phud/phud.json` | `RP/ui/hud_screen.json`, `RP/ui/phud/*.json` |
| HUD | status/reward overlay | cooldowns, effects, reward overlay, flip-book icons | `docs/64-motion-form-hud-reference.md`, `docs/33-animation-patterns-and-dumper-values.md` | `references/restricted/advanced-ui-set-ui/motion-form-gallery-a/ui/mai/custom_hud/maze.json` or `custom_hud/reward.json` | `RP/ui/hud_screen.json`, feature UI files |
| Container | chest/inventory | slot menu, item grid, custom container | `docs/18-tooling-auxgen-dumper-dynamic form library.md`, `docs/47-custom-auxid-and-form-progress.md` | chest UI references | `RP/ui/chest_screen.json`, `RP/ui/server_form.json` |
| Loading | world/progress | loading background, loading bar, percent label | `docs/53-premium-ui-pattern-reference.md`, `docs/54-visual-fit-and-reference-discipline.md` | vanilla `progress_screen.json` and loading references | `RP/ui/progress_screen.json` |
| Tooltip | hover UI | animated hover text, rarity frame, item tooltip | `docs/36-dumper-value-cookbook.md`, `docs/56-local-json-ui-reference-pack-analysis.md` | `references/restricted/json-ui-reference-packs/animated-hover-text/ui/ui_common.json` | `RP/ui/ui_common.json`, item/inventory screens |
| Pause/Settings | simple modal | pause overlay, resume-only screen, settings toggle bridge | `docs/16-screen-by-screen-reference.md`, `docs/45-jsonui-spec-and-presets.md` | vanilla pause screen, optional minimap pause bridge | `RP/ui/pause_screen.json` |
| Addon Integration | renderer-backed UI | entity/model/render-controller backed UI | `docs/15-json-ui-file-role-catalog.md`, `docs/56-local-json-ui-reference-pack-analysis.md` | minimap overlay addon JSONs | `RP/ui`, `RP/entity`, `RP/models`, `RP/render_controllers` |

## Decision Rules

### If the task mentions layout quality

Read `docs/54-visual-fit-and-reference-discipline.md` and use IR/tooling for geometry if the UI has repeated cards, bars, grids, or screenshot matching.

### If the task mentions "make something like this image"

Read visual-fit first, then pick the closest design family from:

- `docs/39-design-recommendation-catalog.md`
- `docs/40-server-form-example-index.md`
- `docs/53-premium-ui-pattern-reference.md`
- `docs/56-local-json-ui-reference-pack-analysis.md`
- `docs/58-design-reference-atlas.md`
- `docs/59-diagrammatic-workflows.md`

### If the task modifies hotbar or HUD renderers

Open vanilla `hud_screen.json` before restricted references. Hotbar, XP, heart, hunger, crosshair, and chat layout can share parent containers.

### If the task uses interactive HUD input

Treat it as high-risk. Check:

- `always_accepts_input`
- `always_listen_to_input`
- `should_steal_mouse`
- `absorbs_input`
- `prevent_touch_input`
- button mappings and toggle groups

### If the task uses restricted references

Use the restricted source only as pattern evidence. Do not publish original names, comments, credits, or texture paths.

## Evidence To Include In Final Answers

For implementation work, say:

```text
Routing used:
- major: HUD
- mid: hotbar relayout
- sub: vertical hotbar

References opened:
- docs/56-local-json-ui-reference-pack-analysis.md
- references/restricted/json-ui-reference-packs/vertical-hotbar-left-right/.../ui/hud_screen.json

Checks:
- label sizes explicit
- repeated slots use one size and gap
- vanilla hotbar side effects checked
```
