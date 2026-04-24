# Source Catalog

This document lists the included source groups and what they are good for.

## `references/source-packs/1seulbi`

Strong for:

- `_ui_defs.json` study
- HUD injection
- custom chat protocol parsing
- scoreboard replacement
- server form routing
- reusable UI presets

Primary files:

- `ui/_ui_defs.json`
- `ui/hud_screen.json`
- `ui/chat_screen.json`
- `ui/scoreboards.json`
- `ui/server_form.json`
- `ui/neroluna/form/*.json`

## `references/source-packs/bunnyfarm`

This is a sample collection, not one single UI pack. Use only the relevant subpack for the task.

Useful subpacks:

- `GfE8ULhgL4I`
  - server form, chest screen, `ui_common`, scoreboards
- `tDAp1yJMUYo`
  - animated bars, HUD, bar textures
- `Y5dOnRAM7js`
  - custom pocket containers, custom scroll UI, chest patterns
- `FwnQgFaZsHs`
  - HUD and chat variations
- `gPiyv-DJxGw`
  - `_global_variables`, HUD, scoreboard
- `z65tCLQRo0Q`
  - paired HUD and chat samples

## `references/source-packs/custom-crops-reference`

Strong for:

- addon-wide UI integration
- multi-screen custom UI systems
- HUD progress bars
- server form replacements
- custom textures tied to gameplay systems

Primary files:

- `ui/_ui_defs.json`
- `ui/hud_screen.json`
- `ui/server_form.json`
- `ui/chest_server_form.json`
- `ui/chest_inventory_system.json`
- `ui/animated_bar.json`
- `textures/ui/*`
- `blocks.json`
- `manifest.json`

## `references/local-utils/json-ui-utils`

Strong for:

- topbar chat notifications
- reusable title-driven progress bars
- prefix routing
- string splitting
- preserve-state patterns
- tooltip cards
- tablist HUD composition

Primary files:

- `topbar_chat_notification_utils.json`
- `topbar_chat_notification_hud_patch.json`
- `topbar_chat_notification_chat_screen_patch.json`
- `progress_bar_utils.json`
- `title_progress_utils.json`
- `animated_bar_extra_example.json`
- `split_string_utils.json`
- `preserve_state_utils.json`
- `prefix_router_utils.json`
- `tooltip_card_utils.json`
- `tablist_hud_screen.json`

## `references/local-utils/integrated-sample`

Strong for:

- compact end-to-end pack structure
- `_ui_defs.json` registration
- HUD and chat coordination
- scoreboards
- server forms
- NPC screens
- shared template reuse

Primary files:

- `ui/_ui_defs.json`
- `ui/ui_common.json`
- `ui/hud_screen.json`
- `ui/chat_screen.json`
- `ui/scoreboards.json`
- `ui/server_form.json`
- `ui/form.json`
- `ui/npc.json`

## `references/upstreams/MCBVanillaResourcePack`

Optional local mirror of the upstream vanilla pack authority.

Use it for:

- `textures/ui/*`
- `textures/item_texture.json`
- `textures/terrain_texture.json`
- `ui/*.json`
- `_ui_defs.json`
- `_global_variables.json`

Upstream authority:

- <https://github.com/ZtechNetwork/MCBVanillaResourcePack>

## External sources

- Mojang `bedrock-samples`
  - <https://github.com/Mojang/bedrock-samples/tree/main/resource_pack/ui>
- Bedrock Wiki JSON UI docs
  - <https://wiki.bedrock.dev/json-ui/json-ui-documentation>
- Bedrock Wiki `best-practices`
  - compatibility and performance guidance for JSON UI structure
- `LeGend077/json-ui-examples`
  - pattern snippets for progress bars, toggles, sliders, scroll panels, and layout offsets
- `Refaltor77/EasyUIBuilder`
  - builder-oriented examples and generated JSON UI samples
- `Herobrine643928/Chest-UI`
  - chest and furnace server-form pack with Script API support
- Bedrock Wiki `json-ui-intro`
  - high-level mental model and terminology
- Bedrock Wiki `add-hud-elements`
  - reliable explanation of `root_panel` modification-based HUD insertion
- Bedrock Wiki `numerical-item-ids`
  - useful context when JSON UI examples or older systems refer to numeric item IDs for rendering behavior
- `Blockception/Minecraft-bedrock-json-schemas`
  - Bedrock-wide schema project with UI schema coverage
- `DJStompZone/MCBE-JSON-UI-Schemas`
  - focused JSON UI schema files
