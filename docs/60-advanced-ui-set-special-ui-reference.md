# advanced-ui-set Special UI Reference

`advanced-ui-set` is treated as a restricted, high-quality Bedrock JSON UI reference set. It is not published as raw source. The public repository stores only neutral routing data and design analysis.

Public index:

- `data/advanced-ui-set-file-index.json`

restricted neutral mirror, ignored by Git:

- `references/restricted/advanced-ui-set-ui/restricted-suite-a-rp/`
- `references/restricted/advanced-ui-set-ui/restricted-suite-a-bp/`
- `references/restricted/advanced-ui-set-ui/restricted-suite-b/`
- `references/restricted/advanced-ui-set-ui/restricted-suite-c-rp/`
- `references/restricted/advanced-ui-set-ui/premium-form-gallery-a/`
- `references/restricted/advanced-ui-set-ui/motion-form-gallery-a/`

## Source Rules

- Do not publish original pack names, comments, credits, server names, or restricted texture paths.
- Use the raw restricted mirror only as local implementation evidence.
- When adapting a pattern, rename namespaces, controls, texture paths, and title/form flags.
- Public docs describe the pattern, purpose, geometry, bindings, and routing shape, not the original identity.
- If a file is opened line by line, extract only the reusable mechanism: control hierarchy, binding data flow, button state shape, collection usage, and layout ratios.

## Reference Families

| Neutral family | Main value | Use when |
| --- | --- | --- |
| `restricted-suite-a-rp` | large RP screen replacement set | full-screen inventory/trade/profile/info screens, large routed server forms, HUD injection |
| `restricted-suite-a-bp` | BP form and UI data senders | script-generated form payloads, form title/body/button protocol, gameplay-to-UI data bridge |
| `restricted-suite-b` | special form and HUD system | device/phone forms, routed server form shell, chest-like forms, battle panels, PC/database/team UIs, title-payload HUD suite |
| `restricted-suite-c-rp` | compact routed form and HUD supplement | compact routed server forms, reusable form button templates, battle shell metadata, renderer relocation, button texture states |
| `premium-form-gallery-a` | polished server form design gallery | shop/store forms, crate rewards, auction/listing forms, city/claim menus, generic long/modal templates, scoreboards/toast/HUD polish |
| `motion-form-gallery-a` | animation-heavy game-mode UI suite | ability/progression forms, shop and purchase flows, quest tabs, NPC/book forms, status HUDs, reward overlays, flip-book and progress animation values |

## Pattern Map

| Pattern | Purpose | Open first | Extract |
| --- | --- | --- | --- |
| `multi_route_form_router` | One `server_form.json` dispatches many special forms by hidden title flags. | `restricted-suite-b/ui/server_form.json` for concise routing, then `restricted-suite-a-rp/ui/server_form.json` for large-form scale. | invisible route panels, `#title_text` flag tests, fallback `long_form`, `form_buttons` collection reuse |
| `phone_device_form` | Diegetic handheld/device UI, not a normal action form. | `restricted-suite-b/ui/device_phone/second.json` | full-image shell, region stack panels, per-region factories, flag-gated button placement |
| `title_payload_hud` | One title/actionbar protocol updates many HUD widgets. | `restricted-suite-b/ui/phud/phud.json` | preserved data panel, prefix-based component routing, separate renderer files |
| `chest_form_router` | Server-form buttons rendered as inventory/container slots. | `restricted-suite-b/ui/chest_server_form.json` | grid variants, item renderer usage, stack/count parsing, route flags |
| `move_selection` | Battle action screen with actor cards, moves, PP/progress bars, and action buttons. | `restricted-suite-b/ui/creature/attack.json` | `form_buttons` as move/action data, actor description panels, dynamic bar template |
| `pc_storage` | Creature or item storage box UI. | `restricted-suite-b/ui/creature/pc.json` | grid body, filter/search/settings controls, party/storage visual split |
| `creature_database` | Database/detail viewer. | `restricted-suite-b/ui/creature/creature_database.json` | grid page, detail page, search/back/page buttons |
| `creature_team_menu` | Party/team selection UI. | `restricted-suite-b/ui/creature/creature.json` | button stack, selectable card state, image/text split |
| `compact_form_view` | Small routed form pages with tight cards and list/grid regions. | `restricted-suite-c-rp/ui/creaturesv.json`, with `restricted-suite-c-rp/ui/server_form.json` as the router. | prefix route panel, compact scroll/grid body, `form_buttons` collection, item renderer/detail split |
| `button_template_suite` | Reusable server-form button states for compact apps. | `restricted-suite-c-rp/ui/creaturebt.json` | default/hover/locked texture state, icon binding, form button text binding, consistent state dimensions |
| `battle_shell_texture_metadata` | Texture metadata for battle-style button and bar assets. | `restricted-suite-c-rp/ui/battle.json` and `restricted-suite-c-rp/textures/ui/buttons/*.json` | `nineslice_size`, `base_size`, reusable state texture sizing |
| `hud_renderer_relayout` | Move vanilla HUD renderers into new anchor panels without fully replacing gameplay UI. | `restricted-suite-c-rp/ui/hud_screen.json` | renderer relocation, actionbar fade animation, bottom-center/non-centered panel split |
| `premium_form_router` | Large custom server-form router with many title-prefix routes. | `premium-form-gallery-a/ui/server_form.json` | route bindings, vanilla fallback, screen animations, menu namespace dispatch |
| `premium_form_common_templates` | Shared frame, label, grid, scroll, button, and texture-state primitives. | `premium-form-gallery-a/ui/common/common.json` | `form_template`, button color variants, `common.scrolling_panel` wrappers, explicit sizing |
| `shop_store_form` | Store/shop page with header stats, category tabs, offer cards, product grid, and pagination. | `premium-form-gallery-a/ui/menus/other/store.json` | 380px-class modal, header row, scroll body, `form_buttons` index mapping, product card geometry |
| `crate_reward_form` | Crate/reward preview and progression forms. | `premium-form-gallery-a/ui/menus/crates/preview_v2.json`, then `progression.json` | reward grid, preview rows, progress/reward states, stable card sizes |
| `auction_house_form` | Marketplace/listing style form. | `premium-form-gallery-a/ui/menus/other/auction_house.json` | filter/action sections, item cards, price/status labels, scroll layout |
| `generic_form_template` | Polished generic long/modal form replacement. | `premium-form-gallery-a/ui/menus/generic/long_form.json`, `modal_form.json` | reusable body panel, button grid, tooltip overflow pattern, modal button states |
| `maze_multi_feature_form_router` | One high-density form shell routes ability, cosmetics, death, purchase, quest, shop, end, and reward views. | `motion-form-gallery-a/ui/mai/custom_form.json` | fixed-width payload parsing, route panels, shared form chrome, per-feature component dispatch |
| `maze_common_templates` | Shared window, selection, button, and scroll primitives for the maze UI family. | `motion-form-gallery-a/ui/mai/common.json` | dark window frame, close/selection states, scroll panel wrappers, consistent card chrome |
| `ability_upgrade_carousel` | Progression or battlepass-like ability node carousel. | `motion-form-gallery-a/ui/mai/components/ability/ability_upgrades_tab.json` | slider-derived horizontal offset, clipped node strip, locked/unlocked state cards, offset animation |
| `shop_grid_form_component` | Dense product browser with indexed item buttons. | `motion-form-gallery-a/ui/mai/components/shop/shop_browser.json` | product grid, item card state, price/status label, scroll browser |
| `purchase_popup_flow` | Multi-state purchase confirmation popup. | `motion-form-gallery-a/ui/mai/components/purchase/purchase_popup.json` | description, confirmation, waiting, success, failure state split |
| `maze_status_hud` | Status HUD with effects, ability cooldowns, progress bars, and flip-book icons. | `motion-form-gallery-a/ui/mai/custom_hud/maze.json` | `clip_ratio` bars, cooldown overlays, effect rows, `flip_book` values |
| `reward_hud_overlay` | Reward/status overlay with animated presentation. | `motion-form-gallery-a/ui/mai/custom_hud/reward.json` | reward rows, animated grouping, HUD overlay layout |
| `maze_ui_texture_state` | Texture metadata families for windows, ability states, tabs, item borders, and scrollbars. | `motion-form-gallery-a/textures/ui/**.json` | `nineslice_size`, `base_size`, state texture sizing |
| `info_screen` | Large info/encyclopedia screen. | `restricted-suite-a-rp/ui/info_screen.json` | content panels, previous/image/title-body zones, collection-bound button templates |
| `inventory_screen` | Full inventory replacement. | `restricted-suite-a-rp/ui/inventory_screen.json` | screen-region replacement, pocket/desktop variants, existing inventory collection reuse |
| `trade_screen` | Full trade replacement. | `restricted-suite-a-rp/ui/trade_2_screen.json` | desktop/pocket split, mirrored participant regions, trade state controls |

## How AI Should Use This Set

1. Classify the task by target: HUD, server form, device form, chest/container, battle, database, storage, inventory, or trade.
2. Open `data/advanced-ui-set-file-index.json` and choose the closest `pattern`.
3. Open only one restricted mirror file first.
4. Read the file line by line only around the selected mechanism:
   - screen/root entry
   - factory/control dispatch
   - binding block
   - button/default/hover/pressed state
   - collection/grid template
   - animation block
5. Write a neutral extraction note before coding:
   - source neutral path
   - mechanism extracted
   - target file to patch
   - restricted names/textures that must be replaced
6. Implement in the target pack with new namespaces and public-safe texture paths.

## Design Notes

- The device forms are special forms: they use server form data but visually behave like an in-world handheld UI with fixed button zones.
- The HUD suite is protocol-driven: the title/actionbar string is a data bus, not player-facing text.
- The battle/storage/database forms are data-dense and should use stable geometry. Keep button sizes, row heights, and gaps consistent across state controls.
- The compact routed form set is best when the user wants a high-density menu but not a full-screen replacement. Start from its router, then open the compact view and button template files.
- The premium form design gallery is best when the user wants a polished shop, crate, auction, city, generic long form, or tabbed menu. Start from the router, then open `ui/common/common.json`, then one matching menu file.
- The maze UI family is best when the user wants an animation-heavy ability/progression menu, shop plus purchase popup, quest tab, NPC/book form, or status HUD. Start from `docs/64-motion-form-hud-reference.md`, then open exactly one matching restricted file.
- Reusable button templates should be extracted as state machines: default, hover, pressed or locked controls must keep identical `size` and predictable icon/text padding.
- HUD renderer relocation examples are for moving existing Bedrock renderers. Treat them differently from title-payload HUDs that create new widgets from script data.
- Large RP screen replacements need desktop and pocket variants when vanilla has separate files.
- If text looks oversized, reduce `font_scale_factor` first and keep every label `size` explicit.
