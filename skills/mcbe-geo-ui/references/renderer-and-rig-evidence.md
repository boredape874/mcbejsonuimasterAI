# Renderer and rig evidence

Reviewed 2026-10-03 against the pinned Mojang `bedrock-samples` revision (`references/official/bedrock-samples-ui.lock.json`, `v1.26.50.4`, commit `46ba6ea985fb`; 207 vanilla ui files in the local mirror), the official creator docs (`microsoftdocs-minecraft-creator-reference`), the Bedrock Wiki snapshot (`bedrock-wiki-entities-visuals`) and the MIT example addon `kaweduh-player-model-renderer`, all pinned in `config/design-research-lock.json`. Nothing here is runtime-verified. Paths written as `wiki:docs/...` are files inside the pinned Wiki source, not this repository.

## Which vanilla screens project a model (confirmed from pinned samples)

| Renderer | Vanilla files | Control name | `property_bag` | Bindings on the control |
| --- | --- | --- | --- | --- |
| `live_player_renderer` | `inventory_screen.json`, `inventory_screen_pocket.json` | `player_renderer` | `#look_at_cursor: true` | none; wrapped by `player_renderer_panel` inside `player_armor_panel` |
| `hud_player_renderer` | `hud_screen.json` | `hud_player` | none | `#paper_doll_visible` → `#visible` |
| `paper_doll_renderer` | `pause_screen.json`, `start_screen.json`, `persona_SDL.json`, `skin_pack_pdp.json`, `expanded_skin_pack_screen.json`, `persona_popups.json`, `persona_cast_character_screen.json`, `day_one_experience_screen.json`, `store_promo_timeline_screen.json` | `paper_doll`, `skin_model`, `appearance_model`, `skin_model_renderer`, `persona_classic_skin_paper_doll` | `#skin_rotation` plus indexed animation entries | `#paper_doll_skin`, `#skin_index`, `#preview_skin`, `#legacy_skin`, `#skin_animations`, `#is_paper_doll_visible`, `#classic_skin_index`, `#is_skin_retrieval_finished` |
| `actor_portrait_renderer` | `npc_interact_screen.json` | `skin_model` | none | collection `skins_collection`, `#skin_index` |
| `equipment_preview_renderer` | `smithing_table_2_screen.json`, `smithing_table_2_screen_pocket.json` | `smithing_preview_renderer` | none | `#item_id_aux`, `#item_custom_color`, `#armor_trim_pattern`, `#armor_trim_material` |
| `name_tag_renderer` | `pause_screen.json`, `start_screen.json`, `day_one_experience_screen.json` | `paper_doll_name_tag`, `no_network_message`, `import_time` | `#playername`, `#x_padding` | `#playername`, `#playername_visible`, `#no_network_message_visible` |

The three control bodies the skill most often copies share one shape: `type: custom`, the `renderer`, `animation_reset_name: screen_animation_reset` and the four `@common.screen_*_size_animation_*` entries. The inventory player renderer adds `layer: 8` and centre anchors; the NPC portrait adds `size: ["100%", "100%"]`, `enable_scissor_test: true` and the `skins_collection` binding; the HUD paper doll adds only the `#paper_doll_visible` binding. Confirm any other property with `node tools/vanilla-name-check.mjs <name>` before using it.

`paper_doll_renderer` is the only renderer in the pinned files that takes `$` variables on the control (`$skin_model_animations|default`, `$skin_model_layer|default`, `$preset_appearance_alpha|default`, `$paper_doll_offset|default`, `$skin_model_anims|default` and others in `persona_SDL.json`). Those are vanilla variable names, so re-check them after every sync.

## Player rig (confirmed from pinned samples)

`models/entity/humanoid.custom.geo.json` (format 1.21.0, `geometry.humanoid.custom`): `root` → `waist` → `body` → `head` (`hat`), `cape`, `leftArm` (`leftSleeve`, `leftItem`), `rightArm` (`rightSleeve`, `rightItem` with locator `lead_hold`), `jacket`; `root` → `leftLeg` (`leftPants`), `rightLeg` (`rightPants`). `entity/player.entity.json` maps `default` to `geometry.humanoid.custom` and `cape` to `geometry.cape`, uses materials `entity_alphatest`, `player_animated` and `player_spectator`, and declares `enable_attachables: true`.

Community-documented rig notes (Bedrock Wiki `wiki:docs/visuals/player-geometry.md`, `wiki:docs/entities/holding-items.md`; not verified): the Alex variant uses 3-wide arms with different arm and item pivots, so a projected pose must be checked on both rigs; an entity needs a `rightItem` bone to hold an item, and several geometry variants can hide the held item.

## Geometry features relevant to projected UI (confirmed from official docs, not verified at runtime)

| Feature | Page | Notes |
| --- | --- | --- |
| `item_display_transforms` with contexts `gui`, `firstperson_righthand`, `firstperson_lefthand`, `thirdperson_righthand`, `thirdperson_lefthand`, `ground`, `fixed`, `head`, `embedded`, `shelf` | `VisualReference/geometry.v1.21.0.md` L37-41 | each context has `rotation`, `translation`, `scale`, `rotation_pivot`, `scale_pivot`; only `gui` has `fit_to_frame` (default `true`) |
| per-face `uv_rotation` (0/90/180/270) | `geometry.v1.21.0.md` L118 | format 1.21.0 geometry |
| bone `binding` resolution: Molang binding → same-named parent bone → local `parent` → owner root | `geometry.v1.21.0.md` L68-70 | binding needs format ≥ 1.16.0 |
| `query.is_in_ui` returns 1.0 while the entity renders as part of the UI | `QueryFunctions/query_is_in_ui.md` | scope per renderer not documented |
| `query.bone_orientation_trs` (`.t/.r/.s`, ≥ 1.20.60), `query.bone_aabb` (`.min/.max`), `query.camera_rotation` / `query.rotation_to_camera` (axis 0 = x, 1 = y) | the respective `query_*.md` pages | bone-position-driven effects |
| `bones.inflate` / `bones.reset` dead from 1.16.0; `poly_mesh` deprecated | `geometry.v1.8.0.md` L23-32 | migrate to per-cube `inflate` |

## A minimal player-model form (source-observed, MIT)

`kaweduh-player-model-renderer` (`RP/custom_ui/custom_server_form.json`, `RP/ui/server_form.json`, `BP/scripts/main.js`):

- namespace `custom_server_form` with three controls: `player_identity` (`name_tag_renderer`), `player_model` (`live_player_renderer`), `player_paper_doll_model` (`paper_doll_renderer`) over `textures/ui/dialog_background_hollow_3` and `textures/ui/Black`;
- `server_form.json` keeps the vanilla namespace and replaces only `long_form`: a `regular_long_form@common_dialogs.main_panel_no_buttons` for every ActionForm whose `#title_text` does not start with the four-character marker, and the custom panel for titles that do;
- the behavior pack sends a plain `ActionFormData` from `afterEvents.itemUse`; the model is display only and the buttons remain vanilla form buttons;
- the title carries the marker plus the player name; `('%.4s' * #title_text)` stores the prefix in `#form_prefix`, `(#form_prefix = 'pmrd')` drives `#visible`, and `(#title_text - #form_prefix)` feeds `#playername` into `name_tag_renderer` (`property_bag` `#x_padding: 4`), so the form title is the only script-to-UI channel in this pattern;
- the same `live_player_renderer` is declared twice: a 32×32 renderer inside a 32×32 `clips_children: true` panel with `#look_at_cursor: false` gives a static head-and-torso portrait, and a `size: ["40%", "100%"]`, `offset: [0, "-12%"]`, `#look_at_cursor: true` renderer inside a 196×196 panel gives the cursor-following full model (the source comments say width sets the model scale and height sets the framing);
- `paper_doll_renderer` uses the same panel shell without a `property_bag`; all three renderer controls carry the four `@common.screen_*_size_animation_{push,pop}` anims so the model shrinks away with the form instead of lingering over the world (source comment, runtime not verified).

This is the smallest registered example of "title prefix routes a vanilla form to a custom panel with a live renderer". It proves structure, not runtime behavior on the target client; the pack's `wiki.*` lang keys are not shipped, so a reuse must add its own `texts/*.lang`.

## Labels and commands

- "confirmed from pinned samples": the control, binding or bone exists at the pinned revision.
- "confirmed from official docs": written on the cited page; reference pages dated 02/11/2025 are `ai-usage: ai-assisted`, so treat them as name evidence only.
- "community-documented" and "source-observed": Wiki text or an example pack; never runtime proof.

With the local mirror present the same checker resolves `geometry.humanoid.custom`, `minecraft:player`, `controller.render.player.first_person`, `animation.player.first_person.base_pose` and material short names, and `query.is_in_ui` / `query.bone_orientation_trs` resolve against the 323 queries documented for 1.26.50.4 (`data/molang-queries-1.26.50.json`).

```sh
node tools/vanilla-name-check.mjs live_player_renderer paper_doll_renderer actor_portrait_renderer "#paper_doll_visible" "#look_at_cursor" geometry.humanoid.custom query.is_in_ui
node tools/design-library.mjs patterns --source kaweduh-player-model-renderer
node tools/design-library.mjs patterns --source microsoftdocs-minecraft-creator-reference --max-chars 8000
node tools/geoui-inspect.mjs --input PROJECT.geoui.json --json
```
