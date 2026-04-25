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

## `references/local-examples`

Curated mirrors from a local resource-pack archive.

Use these when the AI needs a compact concrete example without scanning the full local archive.

### `references/local-examples/rpg-hud`

Strong for:

- title-driven RPG HUD bars
- preserved title payload routing
- multiple bar instances
- reusable animated bar wiring

Primary files:

- `ui/_ui_defs.json`
- `ui/hud_screen.json`
- `ui/rpg_hud.json`
- `ui/animated_bar.json`

### `references/local-examples/npc-dialogue`

Strong for:

- NPC-style `server_form.json` layout
- form title/body/button bindings
- BP Script API form source context

Primary files:

- `ui/_ui_defs.json`
- `ui/server_form.json`
- `BP/scripts/main.js`

### `references/local-examples/multi-animated-progress`

Strong for:

- multiple animated progress bars
- title payload preservation
- reusable bar component parameters

Primary files:

- `ui/_ui_defs.json`
- `ui/hud_screen.json`
- `ui/animated_bar.json`

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

## `references/official/bedrock-samples-ui`

Selected official Mojang `bedrock-samples` UI files.

Use for:

- confirming current official vanilla structure
- comparing local packs against official screen files
- validating binding and control names before patching

Primary files:

- `_ui_defs.json`
- `_global_variables.json`
- `hud_screen.json`
- `chat_screen.json`
- `server_form.json`
- `inventory_screen.json`
- `inventory_screen_pocket.json`
- `ui_common.json`
- `chest_screen.json`
- `furnace_screen.json`
- `trade_2_screen.json`
- `command_block_screen.json`

## External sources

- `boredape874/mcbe-json-ui-resource`
  - <https://github.com/boredape874/mcbe-json-ui-resource>
  - optional local mirror: `references/upstreams/mcbe-json-ui-resource/`
  - broad archive of JSON UI tutorials and sample UI packs
- `boredape874/minecraft-bedrock-json-ui-sample`
  - <https://github.com/boredape874/minecraft-bedrock-json-ui-sample>
  - optional local mirror: `references/upstreams/minecraft-bedrock-json-ui-sample/`
  - broad sample archive with RainbowPie UI, StarLib examples, binding dumps, custom NPC UI, and integrated HUD/chat examples
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
- `DreamlandMC/bedrock-auxgen`
  - Bedrock item AUX ID generation for plugin/UI item rendering workflows
- `TheoristMC/JSON-UI-Dumper`
  - discovery aid for vanilla JSON UI elements across stable and preview versions
- `pipangry/StarLibV2`
  - GPLv3 JSON UI form-library architecture reference
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
