# Source Catalog

This document lists the included source groups and what they are good for.

## `references/source-packs/modern-cloud-ui-reference`

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
- `ui/form/*.json`

## `references/source-packs/farm-ui-variants`

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

## `references/source-packs/rpg-server-ui-reference`

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
- texture paths referenced from UI JSON

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

Curated mirrors from portable resource-pack references.

Use these when the AI needs a compact concrete example without scanning the full reference archive.

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

Pinned revision: `references/official/bedrock-samples-ui.lock.json` (`v1.26.50.4`, commit `46ba6ea985fb`, upstream date 2026-09-16, `min_engine_version` `[1, 26, 50]`). The previous pin was `v1.26.10.4`; the differences are tracked in `docs/83-vanilla-ui-1.26.50-diff.md`. Verify the committed files with `node tools/sync-bedrock-samples-ui.mjs --check` before citing them.

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
- `ui_template_dialogs.json` (namespace `common_dialogs`, added 2026-10-03)
- `ui_template_buttons.json` (namespace `common_buttons`, added 2026-10-03)
- `npc_interact_screen.json` (namespace `npc_interact`, added 2026-10-03)

`node tools/vanilla-name-check.mjs <name>` reports whether a control, binding, variable, button id, renderer, or screen file occurs in these files (and in the full local mirror when `references/upstreams/bedrock-samples` exists). The folder's `README.md` explains the provenance rules.

The same revision is pinned a second time as `mojang-bedrock-samples` in `config/design-research-lock.json` (322 hash-verified files: 207 ui files plus `resource_pack/attachables`, `entity`, `animations`, `animation_controllers`, `render_controllers`, `models`, `textures/ui` metadata and the `@minecraft/server-ui` script metadata). Attachable, player-rig and render-controller names are therefore checked against the same commit as UI names; the ignored local mirror holds those folders too (`node tools/design-source-sync.mjs --source mojang-bedrock-samples --download`). The 2026-10-03 reference expansion is summarised in `docs/84-reference-expansion-and-evidence-first.md`.

## External sources

Sources added on 2026-10-03 (all commit-pinned in `config/design-research-lock.json`, summarised in `data/design-sources.json`):

- `MicrosoftDocs/minecraft-creator` (`microsoftdocs-minecraft-creator-reference`, CC-BY-4.0 docs / MIT samples)
  - <https://github.com/MicrosoftDocs/minecraft-creator>
  - JSON UI component reference, attachable/client-entity reference, geometry, render-controller and texture-set visual references, Molang query pages, attachables and custom-item tutorials, DDUI introduction; reference pages are `ai-usage: ai-assisted` and prove names only
- `Bedrock-OSS/bedrock-wiki` entities and visuals snapshot (`bedrock-wiki-entities-visuals`, per-page license)
  - <https://github.com/Bedrock-OSS/bedrock-wiki>
  - attachables (two construction methods), player geometry, render controllers, materials, texture atlases, overwriting assets, subpacks and every JSON UI page
- `Mojang/bedrock-schemas` (`mojang-bedrock-schemas-visual`, MIT)
  - <https://github.com/Mojang/bedrock-schemas>
  - official forms, schemas and TypeScript types for attachables, entities, models, render controllers and UI; carries the same typing errors as the creator reference
- `KawEduh-dv/Player-Model-Renderer-JSON-UI` (`kaweduh-player-model-renderer`, MIT)
  - <https://github.com/KawEduh-dv/Player-Model-Renderer-JSON-UI>
  - title-prefix route from a vanilla ActionForm into a custom panel with `live_player_renderer`, `paper_doll_renderer` and `name_tag_renderer`
- `GlitchyTurtle/avatar-addon` (`glitchyturtle-avatar-addon`, GPL-3.0, analysis-only)
  - <https://github.com/GlitchyTurtle/avatar-addon>
  - reusable form kit, cooldown HUD bars, dropdown/edit-box/tab texture metadata and a player-like client entity; structure only, no code or art reuse
- `ENIACJushi/TouHouLittleMaidBE` (`eniacjushi-touhou-little-maid`, MIT)
  - <https://github.com/ENIACJushi/TouHouLittleMaidBE>
  - held and worn attachables, render controllers, custom container screen, book screen and form parts
- `world-class-engineers/collect-everything-bedrock` (`world-class-engineers-collect-everything`, MIT)
  - <https://github.com/world-class-engineers/collect-everything-bedrock>
  - collection browser ActionForm with inventory-slot templates, `hover_text_renderer` and nine-slice metadata
- `Hawariii/minecraft-bedrock-ui-research` (`hawariii-bedrock-ui-research`, MIT)
  - <https://github.com/Hawariii/minecraft-bedrock-ui-research>
  - community binding/button-id/collection/control lists; the 2026-10-03 audit found 19/78 names, 41/47 collections and 8/19 "controls" absent from vanilla 1.26.50, so verify every name with `node tools/vanilla-name-check.mjs`
- `pipangry/StarLibV2` and `TheoristMC/JSON-UI-Dumper` are now also pinned (`pipangry-starlibv2`, `theoristmc-json-ui-dumper`) in addition to the entries below

Earlier entries:

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

## Private Design References

Private local references are intentionally not committed. Use their public analysis docs first, then inspect the ignored local mirror only when it exists on the current machine.

- `docs/50-advanced-ui-reference-analysis.md`
  - premium RPG/adventure UI, store, quest, equipment, battle pass, map, reward toast
- `docs/51-compact-crafting-pocket-ui-reference.md`
  - compact menu, chest/cooking panels, HUD toasts, split pocket inventory

Rules:

- do not publish original manifests, pack icons, unused textures, or source names
- keep public docs source-neutral
- copy only JSON UI files and texture files directly referenced by JSON UI into private mirrors
