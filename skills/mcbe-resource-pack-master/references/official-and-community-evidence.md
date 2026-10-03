# Pack stacking rules from official and community sources

Reviewed 2026-10-03. Sources: `microsoftdocs-minecraft-creator-reference` (CC-BY-4.0 docs, MIT samples) and `bedrock-wiki-entities-visuals` (per-page license; most cited pages NOASSERTION), both pinned in `config/design-research-lock.json`. Read the pinned cards with `node tools/design-library.mjs patterns --source <id>`. None of this is runtime-verified. Paths written as `wiki:docs/...` are files inside the pinned Wiki source, not this repository.

## Which files replace and which merge (community-documented)

Bedrock Wiki `wiki:docs/concepts/overwriting-assets.md` L37-89:

| Asset | Stacking behavior |
| --- | --- |
| textures, sounds, functions | replaced by path |
| BP/RP entities, animations, models, animation controllers, render controllers | the whole file is replaced by identifier |
| every UI file, lang files, `item_texture.json`, `terrain_texture.json`, `flipbook_textures.json`, sound definition files | merged |

Consequence for ownership: a JSON UI modification merges with the packs below it, but a client entity or attachable with the same identifier replaces the lower definition entirely. Record which pack owns `player.entity.json` before adding a player override.

## Duplicate identifiers and engine versions (confirmed from official docs)

- When several client definitions share an identifier, only the one whose `min_engine_version` equals or is closest below the top resource pack's engine version is parsed (`ClientEntityDocumentationIntroduction.md` L64-68). This is the documented way to ship old and new visuals in one stack.
- Versioned Molang changes (ternary association 1.18.10, `&&`/`||` precedence 1.18.20, `block_property` removal 1.20.50, and later rows up to 1.20.70) are selected per expression by the manifest `min_engine_version` of the pack that contains it; packs in one stack can run under different rules at once (`molang/syntax-guide.md` L323-345).
- Texture sets: `color` required, `normal` XOR `heightmap`, MER XOR MERS, same-pack image references only, no cross-pack merge, duplicate images resolve `.tga` > `.png` > `.jpg` > `.jpeg` (`TextureSetsIntroduction.md` L143-167).
- From format 1.26.0, `pre_animation` and `initialize` accept multi-line `{}` scopes in client entity and attachable scripts (`actor_resource_definition.v1.26.0.md`; not verified).

## Flags and limits worth checking before a player override (community-documented, not verified)

- `enable_attachables` gates whether attachables attach to a client entity; `hide_armor` hides worn armor (`wiki:docs/entities/entity-intro-rp.md` L350-367).
- The Wiki states the player client entity must keep `min_engine_version` no higher than 1.13.0 to support persona skins (`entity-intro-rp.md` L46-47). Treat this as a risk to confirm on the target client, not a rule.
- Subpacks: `memory_tier` selects a subpack by device memory and the default subpack is the lowest tier (`wiki:docs/concepts/subpacks.md` L55-98).
- Texture atlases: padding must be at least 2^(n-1) for `num_mip_levels` n; `tint_color` and `overlay_color` blend differently; `atlas.items` also holds equipment-slot placeholders and trimmed armor (`wiki:docs/concepts/texture-atlases.md` L40-60, L109-117, L252-266).
- Equipment checks without overriding `player.json`: `hasitem` selectors with `location=slot.armor.head` and `q.equipped_item_any_tag('slot.armor.head', ...)` (`wiki:docs/items/equipped-item-commands.md` L28, L146-152).

## Labels

- "confirmed from official docs": the rule is written on the cited page; it still does not prove the client's behavior.
- "community-documented": Wiki text without a per-page license; cite structure and names only, never copy code blocks.
