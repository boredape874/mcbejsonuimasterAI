# Render controller and material evidence

Reviewed 2026-10-03 against the pinned Mojang `bedrock-samples` revision (`v1.26.50.4`, commit `46ba6ea985fb`), the official creator docs (`microsoftdocs-minecraft-creator-reference`), the official schemas (`mojang-bedrock-schemas-visual`) and the Bedrock Wiki snapshot (`bedrock-wiki-entities-visuals`), all pinned in `config/design-research-lock.json`. The local mirror under `references/upstreams/bedrock-samples/resource_pack` carries no `materials/` folder, so material definitions are documented-name evidence only. Paths written as `wiki:docs/...` are files inside the pinned Wiki source, not this repository.

## Render controller keys (confirmed from official docs; types not trusted)

`VisualReference/render_controller.v1.8.0.md` (ai-assisted page) lists: `arrays.geometries|materials|textures` (`Array.<name>` → list), `geometry`, `materials` (array of `{ "<bone pattern>": "<material or Molang>" }`), `textures`, `part_visibility` (array of `{ "<bone pattern>": "<Molang>" }`), `filter_lighting`, `ignore_lighting`, `light_color_multiplier`, `rebuild_animation_matrices`, `uv_anim.offset|scale`, `is_hurt_color`, `on_fire_color`, `overlay_color` (each `r/g/b/a` Molang; the official example keeps the current value with `this`). Bone patterns `*`, `foo*`, `*foo*` apply in declaration order (`creator/Documents/molang/practical-molang.md` L256-272). The schema repository types every numeric array as `string[]` and declares `part_visibility` as an object, so do not build a strict validator from it.

## Vanilla patterns (confirmed from pinned samples)

| Controller | Shape |
| --- | --- |
| `controller.render.item_default` | `geometry.default`; `materials: [{"*": "variable.is_enchanted ? material.enchanted : material.default"}]`; `textures: ["texture.default", "texture.enchanted"]` |
| `controller.render.armor` | same material split; `textures: ["variable.has_trim ? variable.trim_path : Texture.default", "Texture.enchanted"]`; `armor.leather` has no trim branch; `armor.v2` switches baby geometry with `variable.use_baby_geo` |
| `controller.render.bow` / `.crossbow` | `arrays.textures.array.bow_texture_frames` and `arrays.geometries.array.bow_geo_frames` listed in the same order as the attachable's `textures`/`geometry` keys, both indexed by `query.get_animation_frame` |
| `controller.render.player.first_person` | `part_visibility` hides every bone with `{"*": false}` and re-enables `rightArm`, `rightSleeve`, `leftArm`, `leftSleeve` from `query.get_equipped_item_name(0, 1)`, `query.get_equipped_item_name('off_hand')` and `query.item_is_charged` |
| `controller.render.shield` | supports `variable.is_patterned` pattern material/texture, but `shield.entity.json` references `controller.render.item_default`; a patterned shield must change the attachable's `render_controllers` explicitly |
| `controller.render.item_sprite` | flat 8×8 depth-0 geometry (`item_sprite.geo.json`, format 1.21.0) with `filter_lighting: true` |

`variable.is_enchanted`, `variable.has_trim`, `variable.trim_path`, `variable.use_baby_geo` and `variable.is_patterned` are set outside these files (engine-provided, not verified); do not rename them.

Materials used by the 55 pinned attachables: `armor`/`armor_enchanted` ×42, `armor_leather`/`armor_leather_enchanted` ×8, `entity_alphatest`/`entity_alphatest_glint` ×4, `elytra`/`elytra_glint` ×1. `player.entity.json` uses `entity_alphatest`, `player_animated`, `player_spectator`.

## Armor queries and dye selection (confirmed from official docs)

- Slot indices for `query.has_armor_slot`, `query.armor_material_slot`, `query.armor_color_slot`, `query.armor_texture_slot`: 0 head, 1 chest, 2 legs, 3 feet; index 4 (body) is accepted only by `armor_color_slot` and `armor_texture_slot`.
- The vanilla chest controller documented in `Animations/AnimationRenderController.md` L85-128 picks per-bone materials with `array.armor_material[query.armor_material_slot(1)]`, toggles `part_visibility` with `query.has_armor_slot(1)`, tints with `query.armor_color_slot(1, 0..3)` and adds `texture.enchanted` as the second texture layer.
- The dyeable custom chestplate in `AddCustomItems.md` L806-864 computes `variable.is_dyed` in `scripts.pre_animation` and the controller selects `variable.is_dyed ? Material.dyed : Material.default`; compute state in `pre_animation`, keep controllers to short ternaries.
- Entity properties with `client_sync: true` are read with `q.property('ns:name')` to index geometry/texture arrays (`behaviorrendercontrollers.md` L97-128).
- `material-files.md` lists the vanilla entity materials (`entity`, `entity_alphatest`, `entity_alphatest_glint`, `entity_alphablend`, `entity_emissive_alpha`, `entity_change_color` and others) and warns (L12-13) that custom materials may be unstable or deprecated; `entity.material` itself is not creator-accessible (L180).

## Texture sets (confirmed from official docs, not verified)

`TextureSetsIntroduction.md` L143-167 and `texture_set.v1.21.30.md`: layers `color` (required), `normal` XOR `heightmap`, `metalness_emissive_roughness` XOR `metalness_emissive_roughness_subsurface`; a set may only reference images in its own pack; higher-priority packs neither merge nor override its image references; duplicate images resolve `.tga` > `.png` > `.jpg` > `.jpeg`, and the page says the same precedence applies to actor texture references.

## Community caveats (Bedrock Wiki, community-documented, pre-RenderDragon in part)

- Texture layering draws array entries bottom → top and the Wiki says it needs the `villager_v2_masked` material (`wiki:docs/entities/render-controllers.md` L134-145, L241); a controller may reference several textures but one geometry (L282-306).
- Since 1.16.100 a custom material written as `prefix:name:base` raises a Content Log error; the Wiki workaround restates every inherited value under `prefix:name:` (`wiki:docs/visuals/materials.md` L193-217).
- UV flipbooks need a material with the `USE_UV_ANIM` define plus `uv_anim.offset/scale` driven by `q.life_time` (`wiki:docs/visuals/animated-entity-texture.md` L43-106); `is_hurt_color` / `on_fire_color` overrides are documented in `wiki:docs/visuals/death-animations.md` L119-170.
- `wiki:docs/visuals/materials.md` and `wiki:docs/visuals/material-creations.md` describe themselves as outdated and risky; keep every claim from them "not verified" until the target client confirms it.

## Labels and commands

- "confirmed from pinned samples": the controller or material name exists at the pinned revision.
- "confirmed from official docs": written on the cited page; ai-assisted reference pages prove names, not types.
- "community-documented": Wiki text without a per-page license; structure and names only.

```sh
node tools/design-library.mjs patterns --source mojang-bedrock-samples --max-chars 8000
node tools/design-library.mjs patterns --source bedrock-wiki-entities-visuals --max-chars 8000
node tools/material-audit.mjs --rp RP --mode classic --json
```
