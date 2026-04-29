# advanced-ui-set File Pattern Routes

This file is the file-by-file routing layer for the restricted `advanced-ui-set` reference mirror. It points an AI to the nearest source file without exposing original pack identity.

Use with:

- `docs/60-advanced-ui-set-special-ui-reference.md`
- `docs/62-special-form-device-ui-patterns.md`
- `docs/64-motion-form-hud-reference.md`
- `data/advanced-ui-set-file-index.json`

raw restricted files live under `references/restricted/advanced-ui-set-ui/` and are ignored by Git.

## File Routes

| Neutral path | Target | Pattern | Size signal |
| --- | --- | --- | --- |
| `restricted-suite-a-bp/scripts/src/ui-data/legendary.js` | `ui` | `generic` | 0 keys, 0 bindings, 0 controls |
| `restricted-suite-a-bp/scripts/src/ui-data/battle.js` | `battle_ui` | `battle_menu` | 0 keys, 0 bindings, 0 controls |
| `restricted-suite-a-bp/scripts/src/ui-data/revive.js` | `ui` | `generic` | 0 keys, 0 bindings, 0 controls |
| `restricted-suite-a-bp/scripts/src/ui-data/starterMenu.js` | `ui` | `generic` | 0 keys, 0 bindings, 0 controls |
| `restricted-suite-a-bp/scripts/src/ui-data/teamMenu.js` | `ui` | `generic` | 0 keys, 0 bindings, 0 controls |
| `restricted-suite-a-rp/ui/_global_variables.json` | `foundation` | `global_variables` | 314 keys, 0 bindings, 0 controls |
| `restricted-suite-a-rp/ui/_ui_defs.json` | `foundation` | `ui_defs` | 1 key, 0 bindings, 0 controls |
| `restricted-suite-a-rp/ui/legendary_menu.json` | `ui` | `generic` | nonstandard source; inspect manually |
| `restricted-suite-a-rp/ui/battle_menu.json` | `battle_ui` | `battle_menu` | 4 keys, 3 bindings, 7 controls |
| `restricted-suite-a-rp/ui/chest_screen.json` | `ui` | `generic` | 18 keys, 0 bindings, 30 controls |
| `restricted-suite-a-rp/ui/closet_screen.json` | `profile_ui` | `closet_screen` | 19 keys, 25 bindings, 61 controls |
| `restricted-suite-a-rp/ui/daily_menu.json` | `ui` | `generic` | 4 keys, 3 bindings, 7 controls |
| `restricted-suite-a-rp/ui/hud_screen_team_cards.json` | `ui` | `generic` | 1 key, 0 bindings, 0 controls |
| `restricted-suite-a-rp/ui/hud_screen.json` | `hud` | `hud_injection` | 3 keys, 138 bindings, 50 controls |
| `restricted-suite-a-rp/ui/hud_team_cards.json` | `ui` | `generic` | 1 key, 0 bindings, 0 controls |
| `restricted-suite-a-rp/ui/info_screen_dark_witch.json` | `database_ui` | `info_screen` | 20 keys, 25 bindings, 54 controls |
| `restricted-suite-a-rp/ui/info_screen.json` | `database_ui` | `info_screen` | 20 keys, 26 bindings, 54 controls |
| `restricted-suite-a-rp/ui/inventory_screen_pocket.json` | `inventory_ui` | `inventory_screen` | 51 keys, 15 bindings, 96 controls |
| `restricted-suite-a-rp/ui/inventory_screen.json` | `inventory_ui` | `inventory_screen` | 109 keys, 55 bindings, 162 controls |
| `restricted-suite-a-rp/ui/new_ui/creature_bg.json` | `ui` | `generic` | 5 keys, 0 bindings, 0 controls |
| `restricted-suite-a-rp/ui/options_menu.json` | `special_form` | `options_menu` | 6 keys, 8 bindings, 18 controls |
| `restricted-suite-a-rp/ui/server_form_1.json` | `ui` | `generic` | 21 keys, 9 bindings, 15 controls |
| `restricted-suite-a-rp/ui/server_form.json` | `server_form` | `multi_route_form_router` | 27 keys, 100 bindings, 271 controls |
| `restricted-suite-a-rp/ui/starters_menu.json` | `ui` | `generic` | 4 keys, 3 bindings, 11 controls |
| `restricted-suite-a-rp/ui/summary_menu.json` | `ui` | `generic` | 4 keys, 5 bindings, 3 controls |
| `restricted-suite-a-rp/ui/team_card_template.json` | `ui` | `generic` | 3 keys, 0 bindings, 0 controls |
| `restricted-suite-a-rp/ui/trade_2_screen_pocket.json` | `trade_ui` | `trade_screen` | 17 keys, 12 bindings, 56 controls |
| `restricted-suite-a-rp/ui/trade_2_screen.json` | `trade_ui` | `trade_screen` | 68 keys, 68 bindings, 95 controls |
| `restricted-suite-b/textures/ui/creature/background_default.json` | `ui` | `generic` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-b/textures/ui/creature/background_hover.json` | `ui` | `generic` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-b/ui/_global_variables.json` | `foundation` | `global_variables` | nonstandard source; inspect manually |
| `restricted-suite-b/ui/_ui_defs.json` | `foundation` | `ui_defs` | 1 key, 0 bindings, 0 controls |
| `restricted-suite-b/ui/chest_server_form.json` | `container_form` | `chest_form_router` | 12 keys, 51 bindings, 60 controls |
| `restricted-suite-b/ui/hud_screen.json` | `hud` | `hud_injection` | 8 keys, 7 bindings, 6 controls |
| `restricted-suite-b/ui/phud/actionbar.json` | `hud` | `title_payload_hud` | 1 key, 4 bindings, 2 controls |
| `restricted-suite-b/ui/phud/battle_wait.json` | `hud` | `title_payload_hud` | 1 key, 6 bindings, 4 controls |
| `restricted-suite-b/ui/phud/currency.json` | `hud` | `title_payload_hud` | 1 key, 5 bindings, 6 controls |
| `restricted-suite-b/ui/phud/evolutionWait.json` | `hud` | `title_payload_hud` | 1 key, 4 bindings, 1 control |
| `restricted-suite-b/ui/phud/loadingScreen.json` | `hud` | `title_payload_hud` | 1 key, 5 bindings, 1 control |
| `restricted-suite-b/ui/phud/phone.json` | `hud` | `title_payload_hud` | 16 keys, 4 bindings, 9 controls |
| `restricted-suite-b/ui/phud/phud.json` | `hud` | `title_payload_hud` | 4 keys, 11 bindings, 17 controls |
| `restricted-suite-b/ui/phud/playerPing.json` | `hud` | `title_payload_hud` | 1 key, 4 bindings, 1 control |
| `restricted-suite-b/ui/phud/sidebar.json` | `hud` | `title_payload_hud` | 3 keys, 13 bindings, 24 controls |
| `restricted-suite-b/ui/creature/attack.json` | `battle_ui` | `move_selection` | 24 keys, 42 bindings, 82 controls |
| `restricted-suite-b/ui/creature/pc.json` | `storage_ui` | `pc_storage` | 11 keys, 34 bindings, 39 controls |
| `restricted-suite-b/ui/creature/creature_database.json` | `database_ui` | `creature_database` | 12 keys, 30 bindings, 26 controls |
| `restricted-suite-b/ui/creature/creature.json` | `team_ui` | `creature_team_menu` | 12 keys, 22 bindings, 27 controls |
| `restricted-suite-b/ui/device_phone/first.json` | `special_form` | `phone_device_form` | 19 keys, 16 bindings, 34 controls |
| `restricted-suite-b/ui/device_phone/second.json` | `special_form` | `phone_device_form` | 19 keys, 16 bindings, 41 controls |
| `restricted-suite-b/ui/device_phone/third.json` | `special_form` | `phone_device_form` | 21 keys, 17 bindings, 43 controls |
| `restricted-suite-b/ui/search_server_form.json` | `server_form` | `search_form` | 5 keys, 6 bindings, 7 controls |
| `restricted-suite-b/ui/server_form.json` | `server_form` | `multi_route_form_router` | 6 keys, 41 bindings, 16 controls |
| `restricted-suite-c-rp/textures/ui/buttons/battle_bar.json` | `battle_ui` | `battle_menu` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/textures/ui/buttons/battle_default.json` | `battle_ui` | `battle_menu` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/textures/ui/buttons/battle_hover.json` | `battle_ui` | `battle_menu` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/textures/ui/buttons/creaturedata_default.json` | `ui` | `generic` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/textures/ui/buttons/creaturedata_hover.json` | `ui` | `generic` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/textures/ui/buttons/generic_black_border.json` | `ui` | `generic` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/textures/ui/buttons/generic_white_border.json` | `ui` | `generic` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/textures/ui/buttons/icon_bg.json` | `ui` | `generic` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/textures/ui/buttons/text_default.json` | `ui` | `generic` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/textures/ui/buttons/text_hover.json` | `ui` | `generic` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/ui/_global_variables.json` | `foundation` | `global_variables` | 20 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/ui/_ui_defs.json` | `foundation` | `ui_defs` | 1 key, 0 bindings, 0 controls |
| `restricted-suite-c-rp/ui/battle.json` | `battle_ui` | `battle_shell_texture_metadata` | 2 keys, 0 bindings, 0 controls |
| `restricted-suite-c-rp/ui/creaturebt.json` | `server_form` | `button_template_suite` | 6 keys, 20 bindings, 4 controls |
| `restricted-suite-c-rp/ui/creaturesv.json` | `server_form` | `compact_form_view` | 6 keys, 8 bindings, 15 controls |
| `restricted-suite-c-rp/ui/hud_screen.json` | `hud` | `hud_injection` | 6 keys, 6 bindings, 13 controls |
| `restricted-suite-c-rp/ui/server_form.json` | `server_form` | `multi_route_form_router` | 3 keys, 3 bindings, 3 controls |
| `premium-form-gallery-a/ui/server_form.json` | `server_form` | `multi_route_form_router` | 12 keys, 56 bindings, 29 controls |
| `premium-form-gallery-a/ui/common/common.json` | `foundation` | `premium_form_common_templates` | 24 keys, 75 bindings, 112 controls |
| `premium-form-gallery-a/ui/menus/generic/long_form.json` | `server_form` | `generic_form_template` | 5 keys, 8 bindings, 15 controls |
| `premium-form-gallery-a/ui/menus/generic/modal_form.json` | `server_form` | `generic_form_template` | 33 keys, 3 bindings, 18 controls |
| `premium-form-gallery-a/ui/menus/other/store.json` | `server_form` | `shop_store_form` | 32 keys, 139 bindings, 211 controls |
| `premium-form-gallery-a/ui/menus/other/store-tokens.json` | `server_form` | `shop_store_form` | 34 keys, 107 bindings, 176 controls |
| `premium-form-gallery-a/ui/menus/other/auction_house.json` | `server_form` | `auction_house_form` | 10 keys, 51 bindings, 75 controls |
| `premium-form-gallery-a/ui/menus/other/boxes.json` | `server_form` | `box_inventory_form` | 35 keys, 135 bindings, 227 controls |
| `premium-form-gallery-a/ui/menus/other/details.json` | `server_form` | `detail_panel_form` | 5 keys, 20 bindings, 24 controls |
| `premium-form-gallery-a/ui/menus/other/gifting.json` | `server_form` | `gifting_form` | 10 keys, 14 bindings, 60 controls |
| `premium-form-gallery-a/ui/menus/other/inventory.json` | `server_form` | `inventory_form` | 7 keys, 30 bindings, 31 controls |
| `premium-form-gallery-a/ui/menus/other/trade.json` | `server_form` | `trade_form` | 18 keys, 34 bindings, 51 controls |
| `premium-form-gallery-a/ui/menus/crates/menu.json` | `server_form` | `crate_reward_form` | 5 keys, 13 bindings, 18 controls |
| `premium-form-gallery-a/ui/menus/crates/preview_v2.json` | `server_form` | `crate_reward_form` | 14 keys, 26 bindings, 52 controls |
| `premium-form-gallery-a/ui/menus/crates/progression.json` | `server_form` | `crate_reward_form` | 10 keys, 64 bindings, 184 controls |
| `premium-form-gallery-a/ui/menus/gamemodes/gamemodes_menu.json` | `server_form` | `gamemode_selector_form` | 6 keys, 8 bindings, 17 controls |
| `premium-form-gallery-a/ui/menus/main/city/claim_chunk_menu.json` | `server_form` | `city_claim_form` | 3 keys, 0 bindings, 8 controls |
| `premium-form-gallery-a/ui/menus/main/common.json` | `server_form` | `tabbed_main_menu` | 13 keys, 26 bindings, 39 controls |
| `premium-form-gallery-a/ui/scoreboards.json` | `hud` | `scoreboard_sidebar` | 2 keys, 7 bindings, 10 controls |
| `premium-form-gallery-a/ui/hud_screen.json` | `hud` | `hud_injection` | 27 keys, 50 bindings, 60 controls |
| `motion-form-gallery-a/ui/server_form.json` | `server_form` | `multi_route_form_router` | 5 keys, 2 bindings, 2 controls |
| `motion-form-gallery-a/ui/mai/common.json` | `foundation` | `maze_common_templates` | 34 keys, 8 bindings, 30 controls |
| `motion-form-gallery-a/ui/mai/custom_form.json` | `server_form` | `maze_multi_feature_form_router` | 11 keys, 904 bindings, 412 controls |
| `motion-form-gallery-a/ui/mai/components/ability/ability_upgrades_tab.json` | `server_form` | `ability_upgrade_carousel` | 26 keys, 14 bindings, 59 controls, 1 animation |
| `motion-form-gallery-a/ui/mai/components/ability/ability_xp.json` | `server_form` | `ability_xp_progress` | 6 keys, 3 bindings, 3 controls |
| `motion-form-gallery-a/ui/mai/components/shop/shop_browser.json` | `server_form` | `shop_grid_form_component` | 16 keys, 16 bindings, 55 controls |
| `motion-form-gallery-a/ui/mai/components/purchase/purchase_popup.json` | `server_form` | `purchase_popup_flow` | 5 keys, 2 bindings, 5 controls |
| `motion-form-gallery-a/ui/mai/components/quest/quest_tab.json` | `server_form` | `quest_form_component` | 27 keys, 13 bindings, 55 controls |
| `motion-form-gallery-a/ui/mai/custom_hud/maze.json` | `hud` | `maze_status_hud` | 45 keys, 80 bindings, 70 controls, 1 animation |
| `motion-form-gallery-a/ui/mai/custom_hud/reward.json` | `hud` | `reward_hud_overlay` | 55 keys, 15 bindings, 81 controls, 2 animations |
| `motion-form-gallery-a/ui/mai/custom_npc.json` | `server_form` | `npc_dialogue_form` | 8 keys, 5 bindings, 19 controls |

## Per-Task Opening Order

| User asks for | Open |
| --- | --- |
| phone, PDA, device, profile card, special form | `restricted-suite-b/ui/device_phone/second.json`, then first/third variant |
| one server form that routes many custom screens | `restricted-suite-b/ui/server_form.json`, then `restricted-suite-a-rp/ui/server_form.json` |
| compact routed form with custom button templates | `restricted-suite-c-rp/ui/server_form.json`, then `restricted-suite-c-rp/ui/creaturesv.json` and `restricted-suite-c-rp/ui/creaturebt.json` |
| polished shop/store server form | `premium-form-gallery-a/ui/server_form.json`, then `premium-form-gallery-a/ui/common/common.json`, then `premium-form-gallery-a/ui/menus/other/store.json` |
| auction, inventory listing, trade, or gifting form | `premium-form-gallery-a/ui/common/common.json`, then the matching file under `premium-form-gallery-a/ui/menus/other/` |
| crate/reward preview or progression | `premium-form-gallery-a/ui/menus/crates/preview_v2.json`, then `premium-form-gallery-a/ui/menus/crates/progression.json` |
| generic long/modal form skin | `premium-form-gallery-a/ui/menus/generic/long_form.json`, then `premium-form-gallery-a/ui/menus/generic/modal_form.json` |
| city/claim/gamemode menu | `premium-form-gallery-a/ui/menus/main/city/claim_chunk_menu.json` or `premium-form-gallery-a/ui/menus/gamemodes/gamemodes_menu.json` |
| ability, skill tree, or battlepass-like progression form | `docs/64-motion-form-hud-reference.md`, then `motion-form-gallery-a/ui/mai/components/ability/ability_upgrades_tab.json` and `ability_xp.json` |
| animation-heavy shop plus purchase popup | `docs/64-motion-form-hud-reference.md`, then `motion-form-gallery-a/ui/mai/components/shop/shop_browser.json` and `components/purchase/purchase_popup.json` |
| quest tab or objective browser | `motion-form-gallery-a/ui/mai/components/quest/quest_tab.json`, then matching quest browser/detail component |
| custom HUD with cooldowns, effects, or status progress | `motion-form-gallery-a/ui/mai/custom_hud/maze.json`, then `motion-form-gallery-a/ui/mai/custom_hud.json` |
| reward overlay HUD | `motion-form-gallery-a/ui/mai/custom_hud/reward.json` |
| NPC dialogue or book-style form | `motion-form-gallery-a/ui/mai/custom_npc.json`, then `motion-form-gallery-a/ui/mai/custom_npc/book.json` |
| inventory-like server form | `restricted-suite-b/ui/chest_server_form.json` |
| battle command UI | `restricted-suite-b/ui/creature/attack.json` |
| battle-styled button texture metadata | `restricted-suite-c-rp/ui/battle.json`, then `restricted-suite-c-rp/textures/ui/buttons/*.json` |
| creature or item storage PC | `restricted-suite-b/ui/creature/pc.json` |
| database or encyclopedia | `restricted-suite-b/ui/creature/creature_database.json`, then `restricted-suite-a-rp/ui/info_screen.json` |
| party/team menu | `restricted-suite-b/ui/creature/creature.json` |
| protocol HUD | `restricted-suite-b/ui/phud/phud.json`, then the matching component under `phud/` |
| vanilla renderer relocation or actionbar fade | `restricted-suite-c-rp/ui/hud_screen.json` |
| large HUD data injection | `restricted-suite-a-rp/ui/hud_screen.json` |
| full inventory/trade replacement | desktop file first, then pocket variant |

## Extraction Checklist

- Identify the root template and whether it extends a vanilla preset.
- Identify factory or collection boundaries before reading visual children.
- For every button, compare default, hover, pressed, locked, and selected states.
- For every label, record explicit `size`, `font_size`, `font_scale_factor`, and anchor.
- For every grid, record item size, gap implied by grid area, collection name, and max item count.
- For every routed form, record the hidden title/body/button flag protocol in neutral names.
- For every texture, replace the path unless the target pack deliberately owns the asset.
