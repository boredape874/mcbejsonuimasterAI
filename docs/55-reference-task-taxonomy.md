# Reference Task Taxonomy

Use this document when the user asks to create, redesign, debug, or extend any Bedrock JSON UI. It maps the user's intent to the smallest useful reference set.

The companion machine-readable indexes are `data/reference-task-index.json` and `data/reference-hierarchy.json`.

## Mandatory Routing Sequence

1. Classify the task by target screen.
2. Classify by feature family.
3. Classify by data source.
4. If the task is broad, use `docs/57-hierarchical-task-router.md` to choose major, mid, and sub topic.
5. Open the smallest reference file listed for that combination.
6. Open the target file to patch.
7. Apply visual-fit rules from `docs/54-visual-fit-and-reference-discipline.md`.
8. Validate JSON and rebuild any pack archive.

Do not start by opening every document. Use the smallest matching row.

## Target Screen Taxonomy

| Target | User wording | First docs | First references | Patch target |
| --- | --- | --- | --- | --- |
| HUD overlay | HUD, RPG HUD, health bar, mana, stamina, actionbar UI, top/bottom overlay | `docs/16-screen-by-screen-reference.md`, `docs/25-pmmp-json-ui-bridge.md`, `docs/54-visual-fit-and-reference-discipline.md` | `references/verified-samples/bedrock-samples-ui/hud_screen.json`, `references/local-examples/rpg-hud/ui/hud_screen.json`, `references/local-examples/multi-animated-progress/ui/animated_bar.json` | `RP/ui/hud_screen.json`, optional utility file |
| Hotbar relayout | vertical hotbar, circular hotbar, radial hotbar, numbered slot labels | `docs/16-screen-by-screen-reference.md`, `docs/56-local-json-ui-reference-pack-analysis.md`, `docs/57-hierarchical-task-router.md` | vanilla `hud_screen.json`, optional restricted `vertical-hotbar-left-right` or `circular-hotbar` mirror | `RP/ui/hud_screen.json`, optional `_global_variables.json` |
| Interactable HUD tools | minimap, 3D renderer, HUD settings, live sliders, input overlay | `docs/38-advanced-json-ui-recipes.md`, `docs/56-local-json-ui-reference-pack-analysis.md`, `docs/57-hierarchical-task-router.md` | optional restricted `minimap-overlay` mirror | `RP/ui/hud_screen.json`, optional addon renderer files |
| Chat UI | chat position, chat panel, chat notification, hide protocol message | `docs/25-pmmp-json-ui-bridge.md`, `docs/37-vanilla-dumper-screen-recipes.md` | `references/verified-samples/bedrock-samples-ui/chat_screen.json`, `references/local-utils/json-ui-utils/topbar_chat_notification_utils.json` | `RP/ui/chat_screen.json`, sometimes `hud_screen.json` |
| Chat command palette | quick commands, command sidebar, chat formatting panel | `docs/37-vanilla-dumper-screen-recipes.md`, `docs/56-local-json-ui-reference-pack-analysis.md` | vanilla `chat_screen.json`, optional restricted `fast-commands` mirror | `RP/ui/chat_screen.json`, `RP/ui/ui_common.json` |
| Server form | action form, custom form, menu, quest, shop, skill, stat, NPC dialogue | `docs/39-design-recommendation-catalog.md`, `docs/40-server-form-example-index.md`, `docs/53-premium-ui-pattern-reference.md` | `references/sample-packs/rpg-server-ui-reference/ui/server_form.json`, `references/sample-packs/modern-cloud-ui-reference/ui/server_form.json` | `RP/ui/server_form.json` plus feature UI files |
| Animation-heavy progression form | ability form, skill tree, battlepass, upgrade nodes, shop popup, quest tab | `docs/64-motion-form-hud-reference.md`, `docs/61-advanced-ui-set-file-pattern-routes.md` | optional restricted `advanced-ui-set-ui/motion-form-gallery-a/ui/mai/components/ability/ability_upgrades_tab.json` or matching component | `RP/ui/server_form.json` plus feature UI files |
| Special device form | phone form, PDA, guidebook, profile card, special form shell | `docs/60-advanced-ui-set-special-ui-reference.md`, `docs/62-special-form-device-ui-patterns.md` | optional restricted `advanced-ui-set-ui/restricted-suite-b/ui/device_phone/second.json` | `RP/ui/server_form.json`, `RP/ui/device_*.json`, `_ui_defs.json` |
| Battle/database/storage UI | battle moves, actor card, database details, PC/storage grid, team menu | `docs/60-advanced-ui-set-special-ui-reference.md`, `docs/61-advanced-ui-set-file-pattern-routes.md` | optional restricted `advanced-ui-set-ui/restricted-suite-b/ui/creature/*.json` | `RP/ui/server_form.json`, feature UI files |
| Chest/container form | chest UI, inventory menu, slot menu, custom container | `docs/18-tooling-auxgen-dumper-dynamic form library.md`, `docs/47-custom-auxid-and-form-progress.md` | `references/sample-packs/rpg-server-ui-reference/ui/chest_server_form.json`, compact container references | `RP/ui/chest_screen.json`, `server_form.json`, custom container files |
| Loading screen | loading screen, joining screen, progress percent, world loading | `docs/53-premium-ui-pattern-reference.md`, `docs/54-visual-fit-and-reference-discipline.md` | `references/verified-samples/bedrock-samples-ui/progress_screen.json` if present, premium loading references | `RP/ui/progress_screen.json` |
| Scoreboard/sidebar | scoreboard, sidebar, personal score HUD, list score | `docs/17-community-patterns-string-score-hud.md`, `docs/34-binding-patterns-value-index.md` | `references/sample-packs/modern-cloud-ui-reference/ui/scoreboards.json`, personal score examples | `RP/ui/scoreboards.json`, sometimes `hud_screen.json` |
| Inventory/pocket UI | inventory, pocket inventory, mobile UI, item grid | `docs/37-vanilla-dumper-screen-recipes.md`, `docs/51-compact-crafting-pocket-ui-reference.md` | vanilla inventory/pocket files, compact pocket reference | matching inventory or pocket screen |
| Pause/settings modal | pause screen, settings, popup modal | `docs/16-screen-by-screen-reference.md`, `docs/45-jsonui-spec-and-presets.md` | vanilla pause/settings/dialog references | matching screen file |
| Tooltip/hover UI | hover text, animated tooltip, rarity tooltip, item tooltip | `docs/36-dumper-value-cookbook.md`, `docs/56-local-json-ui-reference-pack-analysis.md` | optional restricted `animated-hover-text` mirror | `RP/ui/ui_common.json`, inventory or item screens |

## Feature Family Taxonomy

| Feature | Open first | Pattern to extract | Visual fit focus |
| --- | --- | --- | --- |
| Animated progress bar | `references/local-examples/multi-animated-progress/ui/animated_bar.json` | data source, `clip_ratio`, trail/fill/background layers | bar height, text optional under 10px, `clip_ratio` direction |
| RPG multi-bar HUD | `references/local-examples/rpg-hud/ui/rpg_hud.json` | preserved title panels, HP/MP/XP grouping | hotbar side effects, compact text scales, bottom alignment |
| Vertical hotbar | `docs/56-local-json-ui-reference-pack-analysis.md` plus vanilla `hud_screen.json` | one-column hotbar grid, slot label variables, left/right anchors | renderer side effects and safe-zone placement |
| Circular hotbar | `docs/56-local-json-ui-reference-pack-analysis.md` plus vanilla `hud_screen.json` | manual slot offset map, selected slot highlight | do not remove vanilla hotbar accidentally |
| Animated hover tooltip | `docs/56-local-json-ui-reference-pack-analysis.md` | hover text binding, `alpha`/`size` animation, rarity selector shape | normalize names and replace restricted textures |
| Chat command palette | `docs/56-local-json-ui-reference-pack-analysis.md` plus vanilla `chat_screen.json` | `edit_box`, hidden send button, expandable command categories | preserve chat fallback and touch keyboard mappings |
| Minimap/settings overlay | `docs/56-local-json-ui-reference-pack-analysis.md` | HUD input flags, slider-bound offsets, `3d_structure_renderer` | addon dependencies and input capture |
| Actionbar summary | vanilla `hud_screen.json` actionbar text | factory target and label sizing | long dynamic text width; avoid `MinecraftTen` |
| Title protocol parsing | `docs/25-pmmp-json-ui-bridge.md` | exact payload prefix and preserved binding | hide raw title only after preserving source |
| Form router | modern cloud or RPG `server_form.json` | title prefix routing, factory split | fallback form must still work |
| Device form shell | `docs/62-special-form-device-ui-patterns.md` | shell image, region panels, per-region factories | hidden markers must not be visible |
| Battle move selector | `docs/61-advanced-ui-set-file-pattern-routes.md` | actor cards, move buttons, PP/dynamic bars | labels and button states must stay same size |
| Database/storage panel | `docs/61-advanced-ui-set-file-pattern-routes.md` | grid/detail split, search/filter, storage slots | grid cell and detail text sizes |
| Quest/list form | `docs/40-server-form-example-index.md` quest row | scroll viewport, repeated list buttons | equal row height/gap |
| Shop/grid form | `docs/40-server-form-example-index.md` shop row | grid item, icon, price, state | item cell size and text truncation |
| Animation-heavy ability/progression form | `docs/64-motion-form-hud-reference.md` | clipped horizontal node strip, slider-derived offset, XP bar, locked/unlocked states | node size stability and thin-bar label placement |
| Shop purchase popup flow | `docs/64-motion-form-hud-reference.md` | product browser grid plus purchase state machine | product card label zones and form button index contract |
| Status/reward HUD overlay | `docs/64-motion-form-hud-reference.md` | effect bars, cooldown overlays, reward grouping, flip-book animation | vanilla HUD preservation and payload contract |
| Skill/stat form | RPG stat/skill references | compact cards, icon labels, description panel | label hierarchy and short `MinecraftTen` only |
| NPC dialogue | NPC dialogue reference | portrait/text/options layout | body text line height and option row spacing |
| Topbar notification | `topbar_chat_notification_utils.json` | chat prefix filter and HUD display | animation and chat suppression |
| Search/filter UI | tutorial/search references | text input binding and visibility filter | input width, list item height |
| Scroll list/carousel | `docs/35-scroll-and-carousel-patterns.md` | `common.scrolling_panel`, viewport, content panel | scrollbar width and content padding |
| Button state skin | vanilla `ui_common.json` or tutorials | default/hover/pressed/locked controls | stable button size across states |
| Texture-backed panel | vanilla or target texture metadata | image, nineslice, base size | verify texture path and metadata |

## Data Source Taxonomy

| Data source | Use when | Required docs | Required implementation note |
| --- | --- | --- | --- |
| Static RP only | decorative UI, fixed text, layout mockup | layout and visual-fit docs | no BP/PMMP dependency |
| Title packet | bars, preserved values, high-frequency HUD data | `docs/25-pmmp-json-ui-bridge.md` | exact prefix, delimiter, and sender code |
| Actionbar packet | compact status text, visible summaries | vanilla `hud_screen.json` actionbar reference | dynamic text must fit a wide label |
| Chat packet | notifications, hidden protocol lines | `docs/25-pmmp-json-ui-bridge.md`, chat references | suppression rule for protocol lines |
| Server form collections | action form buttons, custom form fields | server form docs and examples | uses `form_buttons`, `#form_text`, `#title_text` |
| Scoreboard collections | personal score or sidebar | scoreboard docs | collection-heavy patterns may lag |
| Script API BP | local addon prototype | addon integration docs | manifest module version and payload format |
| PMMP plugin | production server UI | PMMP bridge docs | packet/form sender code must match UI parser |
| Addon renderer files | 3D renderer, minimap, model-backed UI | addon integration docs and `docs/56-local-json-ui-reference-pack-analysis.md` | copy or recreate entity/model/render-controller dependencies |
| advanced-ui-set restricted mirror | top-tier special form and HUD references | `docs/60-advanced-ui-set-special-ui-reference.md` | use neutral restricted paths only; never publish original names or restricted textures |

## Visual Style Taxonomy

| Style | Best for | Reference family | Avoid |
| --- | --- | --- | --- |
| Vanilla-safe | compatibility, minimal RP assets | vanilla bedrock-samples | custom texture assumptions |
| Compact RPG | RPG stats, quest/shop/skill menus | RPG server UI reference | large paragraphs in tiny panels |
| Modern cloud | polished forms, large menus, inbox/shop | modern cloud reference | copying only one file without dependencies |
| Premium dark | loading screens, adventure menus, rich panels | premium pattern reference | source branding or restricted asset names |
| Special RPG device | phone/PDA, battle, database, storage, protocol HUD | advanced-ui-set special reference | original namespaces, hidden marker text, restricted shell textures |
| Maze game-mode suite | ability progression, shop purchase, quest tabs, NPC/book, cooldown HUD, reward overlay | advanced-ui-set maze neutral reference | original namespaces, hidden marker text, restricted texture paths |
| Pocket/mobile compact | mobile inventory/forms/HUD | compact pocket reference | desktop-only offsets |
| Tutorial/minimal | learning one control pattern | tutorial index | production polish claims |

## Failure/Debug Taxonomy

| Symptom | Open first | Common cause |
| --- | --- | --- |
| UI file does not load | `docs/26-common-failure-modes.md` | `_ui_defs.json`, namespace, JSON syntax |
| Element invisible | target file + vanilla reference | wrong binding, layer, size `[0,0]`, parent hidden |
| Text clipped or ugly | `docs/54-visual-fit-and-reference-discipline.md` | font scale too large, no explicit label size |
| Hotbar disappeared | vanilla `hud_screen.json` around hotbar | `hotbar_renderer` or `exp_progress_bar_and_hotbar` overridden |
| Hunger/heart still visible | vanilla `hud_screen.json` renderer list | missing specific renderer override |
| Progress bar reversed | animated bar reference | wrong `clip_ratio` polarity |
| Chat moved wrong | vanilla `hud_screen.json` and `chat_screen.json` | wrong anchor/max size, chat stack conflict |
| Server form fallback broken | target `server_form.json` + router reference | router swallowed vanilla `long_form` or `custom_form` |
| Hotbar/XP/hunger shifted | vanilla `hud_screen.json` + hotbar reference | hotbar renderer or bottom GUI container overridden |
| Gameplay input captured by HUD | target HUD + minimap/input reference | `always_accepts_input`, `should_steal_mouse`, or global button mapping too broad |

## Search Commands

Use these before opening large archives:

```powershell
rg -n "hud_screen|chat_screen|server_form|animated_bar|scoreboards" references -g "*.json"
rg -n "clip_ratio|hud_title_text_string|form_buttons|common.scrolling_panel" references docs -g "*.json" -g "*.md"
rg -n "quest|shop|skill|stat|npc|dialogue|progress|loading" docs references -g "*.md" -g "*.json"
rg -n "custom_hotbar|circular_hotbar|3d_structure_renderer|#message_text_box|hover_text" references/restricted/json-ui-reference-packs -g "*.json"
```

## Final Answer Evidence

For visual JSON UI changes, include:

```text
Used references:
- references/verified-samples/bedrock-samples-ui/hud_screen.json
- references/local-examples/multi-animated-progress/ui/animated_bar.json

Visual checks:
- text labels have explicit size
- repeated slots use same item size and gap
- hotbar/chat/title side effects are intentional
```
