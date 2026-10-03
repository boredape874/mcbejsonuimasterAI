---
name: mcbe-attachables-ui
description: Build or inspect Bedrock item-attached UI, held or worn overlay models, equipment links, slot bindings and first/third-person animation graphs. Use for attachables; route player-renderer Geo UI separately.
---

# Attachables UI

Choose this surface when the display belongs to an equipped item. An attachable remains a projected model; it does not supply pixel-fixed HUD layout or clickable JSON UI controls.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: the Mojang `bedrock-samples` revision recorded in `references/official/bedrock-samples-ui.lock.json` (UI files committed under `references/official/bedrock-samples-ui`; `resource_pack/attachables`, `resource_pack/entity`, `resource_pack/animations`, `resource_pack/render_controllers`, `resource_pack/models` and `materials` through the local mirror under `references/upstreams/bedrock-samples` or the hash-verified cache from `node tools/design-source-sync.mjs --source mojang-bedrock-samples --download`), then the structural checker `node tools/attachable-inspect.mjs --rp RP --bp BP --vanilla VANILLA_RP --json`.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Read the relevant mode

- Item/geometry/texture references or invisible models: [pack graph](references/pack-graph.md).
- First/third person, offhand, input or state changes: [perspective and state](references/perspective-and-state.md).
- Creating a held/worn display, selecting its rig or diagnosing flat panels: [authoring recipes](references/authoring-recipes.md).
- Equipment replacement, delayed input and multiplayer cleanup: [input and lifecycle](references/input-and-lifecycle.md).
- Learning from an unfamiliar addon or deciding whether a model is UI: [local surface review](references/local-surface-review.md).
- Exact vanilla file anatomy (55 pinned attachables, player rig, slot-to-bone mapping, context variables), the official description/scripts key list, version gates and the Wiki construction methods, each with its evidence label: [vanilla and official evidence](references/vanilla-and-official-evidence.md).
- `live_player_renderer`, `player.entity.json` or GeouiStudio scenes: use `mcbe-geo-ui`.

Resolve item identifier/explicit `item` selector → attachable → geometry/material/texture aliases → render controller and animation/controller before changing a pose. Retain the source pack and authored geometry. A design-only request ends with the design and inspection result; it does not authorize modifying a pack or launching the game.

When this repository is available:

```sh
node tools/attachable-inspect.mjs --rp RP --bp BP --vanilla VANILLA_RP --json
```

BP and vanilla are optional. Omitted sources leave evidence gaps; they do not establish that a missing dependency is provided by the engine. Default stdout is bounded to 6000 characters. `--report NEW_FILE` creates a complete graph without overwriting a file. Without this checkout, trace the same graph manually and report that the checker was unavailable.

Preserve an occupied equipment slot unless replacing it is authorized. Runtime checks cover both hands, perspectives, GUI/profile settings, other viewers, close/disable/rejoin and the current Content Log. Report structural results separately from the actual appearance and interaction. A static report always has `runtimeVerified: false`.
