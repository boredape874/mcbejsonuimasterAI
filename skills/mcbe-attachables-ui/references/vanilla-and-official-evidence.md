# Vanilla and official attachable evidence

Reviewed 2026-10-03 against the Mojang `bedrock-samples` revision pinned in `references/official/bedrock-samples-ui.lock.json` (`v1.26.50.4`, commit `46ba6ea985fb`), the official creator docs pinned as `microsoftdocs-minecraft-creator-reference`, the official schemas pinned as `mojang-bedrock-schemas-visual`, and the Bedrock Wiki snapshot pinned as `bedrock-wiki-entities-visuals` (all in `config/design-research-lock.json`). Every row below carries its label; nothing here is runtime-verified.

Reproduce the vanilla rows with the local mirror (`references/upstreams/bedrock-samples/resource_pack`, or `node tools/design-source-sync.mjs --source mojang-bedrock-samples --download`) and the pinned cards with `node tools/design-library.mjs patterns --source mojang-bedrock-samples`. Paths written as `wiki:docs/...` are files inside the pinned Bedrock Wiki source, and `creator/...` paths are files inside the pinned creator docs source, not files of this repository.

## Vanilla attachable anatomy (confirmed from pinned samples)

55 files under `resource_pack/attachables` at the pinned revision:

| Observation | Count / value |
| --- | --- |
| `format_version` | `1.10.0` ×29, `1.8.0` ×25, `1.10` ×1 (`trident.entity.json`) |
| `description` keys present everywhere | `identifier`, `materials`, `textures`, `geometry`, `render_controllers` |
| `description.scripts` | 54 files; keys `parent_setup` ×50, `animate` ×30, `pre_animation` ×4, `initialize` ×1 (`shield.entity.json`) |
| `description.animations` | 30 files; `offset` ×25 on the `.player` armor variants, `wield*` on held items |
| `description.item` | 25 files, all `.player.json` armor variants: `{ "<item id>": "query.owner_identifier == 'minecraft:player'" }` |
| materials | `armor` / `armor_enchanted` ×42, `armor_leather` / `armor_leather_enchanted` ×8, `entity_alphatest` / `entity_alphatest_glint` ×4, `elytra` / `elytra_glint` ×1 |
| render controllers | `controller.render.armor` ×51, `controller.render.item_default` ×2 (shield, trident), `controller.render.bow`, `controller.render.crossbow` |
| `parent_setup` values | `variable.helmet_layer_visible = 0.0;` ×13, `variable.chest_layer_visible = 0.0;` ×13, `variable.boot_layer_visible = 0.0;` ×12, `variable.leg_layer_visible = 0.0;` ×12 |

Structural rules that follow from the files (confirmed from pinned samples, runtime not verified):

- Armor ships as a pair: `diamond_helmet.json` (format 1.8.0, identifier equals the item id, no `item` key) and `diamond_helmet.player.json` (format 1.10.0, identifier `minecraft:diamond_helmet.player`, explicit `item` selector, `animations.offset` → `animation.armor.helmet.offset`). Match pairs by `identifier` and `item`, never by file name (`turtle_shell_helmet.json` declares `minecraft:turtle_helmet`).
- Every armor variant hides its own vanilla layer in `parent_setup`; `player.entity.json` initialises those variables in `pre_animation` and its third-person render controller reads them through `part_visibility`.
- Held items switch perspective in two ways: an `animate` condition object (`{"wield_first_person_pull": "query.main_hand_item_use_duration > 0.0f && c.is_first_person"}` in `bow.json` and `crossbow.entity.json`) or an animation controller state machine (`controller.animation.shield.wield`, `controller.animation.trident.wield`).
- `shield.entity.json` declares hand-specific first-person position and rotation variables in `scripts.initialize`, resolves which hand blocks in `pre_animation` with `query.blocking` and `query.is_item_name_any('slot.weapon.offhand', 'minecraft:shield')`, and `animation.shield.wield_third_person` flips position and scale sign on `c.item_slot == 'main_hand'`.
- Charge-state items register extra `geometry` and `textures` keys (`bow_pulling_0..2`, `crossbow_arrow`, `crossbow_rocket`); the render controller arrays list those keys in the same order and index both with `query.get_animation_frame`; `variable.charge_amount` is computed in `pre_animation` from `query.main_hand_item_max_duration`, `query.main_hand_item_use_duration` and `query.frame_alpha`.
- `elytra.json` is a single file with `controller.animation.elytra.default` plus five state animations and hides only the chest layer.

## Player rig and client entity (confirmed from pinned samples)

`models/entity/humanoid.custom.geo.json` (format 1.21.0, `geometry.humanoid.custom`): `root` → `waist` → `body` → `head` (`hat`), `cape`, `leftArm` (`leftSleeve`, `leftItem`), `rightArm` (`rightSleeve`, `rightItem` with locator `lead_hold`), `jacket`; `root` → `leftLeg` (`leftPants`), `rightLeg` (`rightPants`).

`models/entity/player_armor.json` (format 1.8.0, legacy colon inheritance): `geometry.player.armor.base` → `armor1` / `armor2` → `geometry.player.armor.helmet`, `.chestplate`, `.boots`, `.leggings`. Use the names as references; author new geometry in the `minecraft:geometry` array form.

`entity/player.entity.json` (format 1.26.0): `enable_attachables: true`; five render controllers selected by `variable.is_first_person`, `variable.map_face_icon` and `query.is_spectator` (`controller.render.player.first_person`, `.third_person`, `.first_person_spectator`, `.third_person_spectator`, `.map`); `controller.render.player.first_person` hides every part by default and re-enables arms/sleeves from `query.get_equipped_item_name(0, 1)` and `query.item_is_charged`.

## Slot to bone mapping and context variables

| Claim | Label | Evidence |
| --- | --- | --- |
| `query.item_slot_to_bone_name(<slot>)` returns the bone the owner mapped to that slot | confirmed from official docs | `creator/Reference/Content/MolangReference/.../query_item_slot_to_bone_name.md` |
| `main_hand` → `rightItem`, `off_hand` → `leftItem` on a right-handed rig; a literal `rightItem` binding locks the item to one hand | confirmed from official docs | `creator/Documents/attachables.md` L158-160 |
| Shield, trident and crossbow geometry bind with `q.item_slot_to_bone_name(c.item_slot)`; the bow geometry attaches by bone name `rightitem` with no `binding` | confirmed from pinned samples | `models/entity/shield.geo.json`, `trident.geo.json`, `crossbow.geo.json`, `bow.geo.json` |
| Spyglass switches its binding target to `head` while `q.main_hand_item_use_duration > 0.0f` | confirmed from pinned samples | `models/entity/spyglass.geo.json` |
| Binding resolution order: Molang `binding`, then a same-named bone in the parent entity, then local `parent`, then the owner root | confirmed from official docs | `creator/Reference/Content/VisualReference/geometry.v1.21.0.md` L68-70 |
| `context.is_first_person` is exposed to animations, entities and render controllers; `context.item_slot` to models; `context.owning_entity` to attachables; `context.player_offhand_arm_height` to models | community-documented | Bedrock Wiki `wiki:docs/concepts/molang.md` context table |
| `variable.charge_amount` is "used in attachables"; `variable.is_holding_left/right`, `variable.player_arm_height`, `variable.is_paperdoll`, `variable.is_first_person` exist as engine defaults | community-documented | Bedrock Wiki `wiki:docs/concepts/molang.md` default variable table |
| Bound bones receive a fixed negative Y offset that the Wiki guide animations cancel; cause unknown | community-documented, not verified | Bedrock Wiki `wiki:docs/items/attachables.md` L225 |
| Attachable locators reported broken as of 1.21.1 | community-documented, not verified | Bedrock Wiki `wiki:docs/visuals/animation-effects.md` L187 |

## Official description and scripts keys

`actor_resource_definition.v1.10.0.md` and `.v1.26.0.md` document the shared client entity/attachable schema. The dedicated `attachable.md` page omits several of these keys and types `item` as a string only, which the official wrench tutorial contradicts (object selector), so use the shared pages as the key list:

| Key | Type documented | Notes |
| --- | --- | --- |
| `item` | Object / String / Molang | object form `{ "<item id>": "<selector>" }` is the vanilla and tutorial form |
| `render_controllers` | Array of strings / Array of objects / Molang | object entries carry a Molang condition |
| `enable_attachables` | Boolean | allows child attachables; `scripts.hide_held_items` overrides it |
| `hide_armor`, `held_item_ignores_lighting`, `queryable_geometry`, `particle_emitters` | documented on the shared page only | absent from `attachable.md` |
| `scripts.initialize`, `scripts.pre_animation` | Array of strings | from format 1.26.0 a multi-line `{}` brace scope is accepted (official note, not verified) |
| `scripts.hide_held_items` | Molang | 1.26.0 page only; hides held items when non-zero |
| `scripts.scale`, `scale[xX]`, `scale[yY]`, `scale[zZ]` | Molang | per-axis scale |
| `scripts.variables` | map `variable.<name>: "public"` | readable by other mobs through `->` (entity context; attachable context not verified) |
| `scripts.should_update_bones_and_effects_offscreen`, `should_update_effects_offscreen` | Molang | non-zero keeps updating off screen |
| `min_engine_version` | Version (string) on the shared page, Integer on `attachable.md` | accept both when validating; copy the vanilla string form |

The official schema repository (`mojang-bedrock-schemas-visual`, `schemas:schemas/rp/attachables/*.schema.json`) encodes `materials`/`textures`/`geometry` maps incorrectly as name-regex string properties, so a strict JSON Schema validator built from it rejects vanilla files. Use it as a key checklist only.

## Version gates stated by the sources

| Gate | Label | Evidence |
| --- | --- | --- |
| `minecraft:wearable` needs item format ≥ 1.20.30; slots `slot.armor.head/chest/legs/feet/body`, `slot.weapon.mainhand/offhand`; armor slots force max stack 1 | confirmed from official docs (behavior not verified) | `ItemComponents/minecraft_wearable.md`, `AddCustomItems.md` L185-188 |
| armor trims need ≥ 1.20.60 on item and attachable; `minecraft:dyeable` ≥ 1.21.30 | confirmed from official docs | `AddCustomItems.md` L494, L685 |
| geometry bone `binding` needs geometry format ≥ 1.16.0 | official (geometry.v1.16.0 page) and Wiki | `geometry.v1.16.0.md`, Wiki `wiki:docs/items/attachables.md` |
| `bones.inflate` / `bones.reset` stop working from 1.16.0; use per-cube `inflate` | confirmed from official docs | `geometry.v1.8.0.md` L23-32 |
| `query.bone_orientation_trs` needs ≥ 1.20.60; `query.is_local_player` ≥ 1.19.60; `query.get_equipped_item_name` is deprecated in favour of `query.is_item_name_any` | confirmed from official docs | the respective `query_*.md` pages |
| Wiki format census: attachable 1.10.0 recommended, geometry 1.8.0/1.12.0 except 1.16.0 for binding | community-documented | Wiki `wiki:docs/guide/format-version.md` L63-82 |
| Wiki custom armor recipe: four icons + three worn textures, `item_texture.json` atlas entry, `enable_attachables` on the target entity | community-documented | Wiki `wiki:docs/items/custom-armor.md` |

## Two construction methods (community-documented)

- Method 1, skeleton copy: copy the player bones into the attachable geometry, parent the model cube to `rightItem`, and delete the player cubes before use; the Wiki text says its prepared file has no cubes, but the shipped `method_one/steve_head.geo.json` still carries body, head, arm and leg cubes with a comment telling the reader to remove them. The Wiki states the method is limited to one mob and one slot.
- Method 2, bone binding: one root bone with `binding: "q.item_slot_to_bone_name(context.item_slot)"`, geometry format ≥ 1.16.0, first/third-person animations switched in `scripts.animate` with `context.is_first_person`, and the `enchanted` material/texture pair kept so the glint survives. This is the vanilla shield/trident/crossbow shape.

Do not copy the Wiki example coordinates or the Mojang numbers; measure the pose on the project's own rig and keep the pinned revision in the report.

## Registered addon examples (source-observed, structure only)

| Source | What it shows | Caveats |
| --- | --- | --- |
| `microsoft-custom-items` (MIT, revision `5e04b6f7`) | `description.item` as `{ "<id>": "query.is_owner_identifier_any('minecraft:player')" }` (wrench, journal) next to identifier-only kits; both perspective spellings `context.is_first_person == 1.0` / `== 0.0` (1.20.30) and `c.is_first_person` / `!c.is_first_person` (1.10.0); armor that reuses vanilla `geometry.player.armor.chestplate/helmet/boots` and `geometry.humanoid.armor.leggings` with `controller.render.armor` and `parent_setup` layer variables; root-bone fixed rotation as the base hand pose; crown geometry binding every top-level bone | the wrench hold animations key bone `steve_head` while `wrench.geo.json` declares `bb_main`; `my_helm`/`my_feet` reuse `variable.chest_layer_visible`; `demo:my_chest` does not match the BP id `demo:chestplate`. Label these copy-paste defects, never canonical names |
| `geyser-integrated-pack` (MIT, revision in the lock) | owner-scoped armor for armor stands: identifier `minecraft:<item>.armor_stand`, `item` selector `q.owner_identifier == 'minecraft:armor_stand'`, `enable_attachables: true` on the owner entity; attachable geometry mirrors the owner bone chain as cube-less bones with identical names and pivots, cubes only on leaf bones, `inflate` for layer separation; `q.` / `v.` and `query.` / `variable.` spellings side by side; spyglass binding switches between `head`, `main_hand` and `off_hand` with `q.is_item_name_any('slot.weapon.mainhand', 0, 'minecraft:spyglass')` | the sparse checkout ships no render controllers, textures or ui files, so `controller.render.armor` and the vanilla `animation.elytra.*` names resolve from the pinned samples; the pack's own documentation states offhand spyglass use is not possible for Bedrock players, so do not describe it as working |
| `kaweduh-player-model-renderer` (MIT) | JSON UI projection without an attachable: `live_player_renderer`, `paper_doll_renderer`, `name_tag_renderer` inside a server form; see the geo-ui skill's renderer evidence | display only; buttons stay vanilla form buttons |
| `eniacjushi-touhou-little-maid` (code MIT, assets CC BY-NC-SA 4.0) | held items (camera, gohei) split perspective with `c.is_first_person` / `!c.is_first_person` entries in `scripts.animate` and copy the context into `v.is_first_person` in both `initialize` and `pre_animation` so a render controller's `part_visibility` can read it; a head-bound reticle bone (`"binding": "'head'"`) shown only in first person while using the item; held geometries bind the root bone with the literal `"binding": "'rightitem'"` and a child `item` bone; worn headwear uses `controller.render.armor`, `variable.helmet_layer_visible = 0.0;`, materials `warden` / `armor_enchanted` and bones named `root` → `head` without a binding expression | JSON structure only (assets are non-commercial); a literal `'rightitem'` binding locks the item to one hand, which the official docs name as the reason vanilla uses the query form; bone-name case differs between files (`rightitem` vs `rightItem`) while the binding string stays lowercase, and the attachable identifiers use a namespace (`tlmsi:`) different from the pack's, so pair item ids through the BP |

`q.is_item_name_any` takes `(slot, index, names...)` in these sources and in `shield.entity.json` (`'slot.weapon.offhand', 'minecraft:shield'` with the index omitted); copy the vanilla argument shape for the slot you target. Geometry format 1.8.0 (`geometry.<name>` top-level key, `texturewidth`) and 1.12.0+ (`minecraft:geometry` array, `texture_width`) coexist inside one pack and inside the vanilla sample itself (`player_armor.json` versus `humanoid.custom.geo.json`), so validators and references must accept both shapes.

## Labels and commands

- "confirmed from pinned samples": the file exists at the pinned revision; cite the path and revision.
- "confirmed from official docs": the key or rule is written on the cited page; the reference pages dated 02/11/2025 are `ai-usage: ai-assisted` and carry typos and empty enum tables, so they prove that a name exists, not its type or behavior.
- "community-documented": Bedrock Wiki text without a per-page license; cite structure and names only.
- "not verified": runtime behavior that only the target client and a fresh Content Log can establish.

With the local mirror present, `node tools/vanilla-name-check.mjs` also resolves pack identifiers: `minecraft:diamond_helmet.player` (attachable), `minecraft:player` (client entity), `geometry.humanoid.custom`, `animation.bow.wield`, `controller.animation.shield.wield`, `controller.render.armor` and material short names such as `armor_enchanted`; `query.*` / `q.*` names resolve against the 323 queries documented for 1.26.50.4 in `data/molang-queries-1.26.50.json` (every query the vanilla pack uses is documented there). Check identifiers this way before writing them into a pack or a card.

```sh
node tools/vanilla-name-check.mjs minecraft:diamond_helmet.player geometry.player.armor.helmet controller.render.armor q.item_slot_to_bone_name
node tools/design-library.mjs sources --source mojang-bedrock-samples
node tools/design-library.mjs patterns --source mojang-bedrock-samples --max-chars 8000
node tools/design-library.mjs patterns --source microsoftdocs-minecraft-creator-reference --max-chars 8000
node tools/design-library.mjs patterns --source bedrock-wiki-entities-visuals --max-chars 8000
node tools/attachable-inspect.mjs --rp RP --bp BP --vanilla references/upstreams/bedrock-samples/resource_pack --json
```
