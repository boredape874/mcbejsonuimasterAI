---
name: mcbe-geo-ui
description: Design and inspect Bedrock geometry UI through live_player_renderer or NPC actor_portrait_renderer, including GeouiStudio projects, hybrid server-form customizers, animated book interfaces, scene state and native input. Use for projected models in UI; held equipment belongs to attachables.
---

# Geometry UI

First identify the renderer and its entity. Player-renderer HUDs and NPC portrait books have different state, input and pack ownership. Geometry supplies the projected visuals; native JSON UI or a declared script input supplies interaction.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: the Mojang `bedrock-samples` revision recorded in `references/official/bedrock-samples-ui.lock.json` (UI files committed under `references/official/bedrock-samples-ui`; `resource_pack/attachables`, `resource_pack/entity`, `resource_pack/animations`, `resource_pack/render_controllers`, `resource_pack/models` and `materials` through the local mirror under `references/upstreams/bedrock-samples` or the hash-verified cache from `node tools/design-source-sync.mjs --source mojang-bedrock-samples --download`), then the structural checker `node tools/attachable-inspect.mjs --rp RP --bp BP --vanilla VANILLA_RP --json` and `node tools/geoui-inspect.mjs --input PROJECT.geoui.json --json`.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

- For NPC dialogue books, sticker collections or `actor_portrait_renderer`, read [NPC portrait UI](references/npc-portrait-ui.md). Do not add a player override or ActionForm merely because the interface looks like a menu.

- For `.geoui.json` save/load, missing media, IDs or export configuration, read [native project inspection](references/project-inspection.md) and run `node tools/geoui-inspect.mjs --input PROJECT.geoui.json --json`.
- For generated geometry, atlas, materials or renderer ownership, read [GeouiStudio contract](references/geoui-contract.md).
- For pack integration, coordinate calibration or verification, read [integration and acceptance](references/integration-and-acceptance.md).
- For a persistent HUD Geo scene with transparent ActionForm hitboxes, native form captions, or a WASD/Jump/Sneak color picker, read [hybrid player-form customizer](references/player-form-customizer.md). It separates the implemented prototype from pending client checks, including aspect coverage, actorless previews and UV sampling.
- For which vanilla screens project a model (renderer, control, `property_bag` and binding names at the pinned revision), the player rig bones, geometry `item_display_transforms` and the minimal MIT player-model form example, read [renderer and rig evidence](references/renderer-and-rig-evidence.md).
- For state, multiplayer, closing or reconnect behavior, select `docs/81-geometry-ui-state-and-lifecycle.md` from the repository. Check the actual entity/viewer context before choosing ordinary properties or per-viewer overrides; the upstream generator is not evidence that it uses the newer override API.

Trace layers → geometry/texture pages → transforms/materials/render controllers → the actual client entity → the selected JSON UI renderer. Trace BP state independently through properties, dialogue text or the verified source transport. Preserve original editor data and final RP/BP ownership.

When this repository is available, `node tools/attachable-inspect.mjs --rp RP --bp BP --vanilla VANILLA_RP --json` checks the attachable/client-entity resource graph. Use `--report NEW_FILE` for all edges. It does not execute GeouiStudio, simulate Molang or prove screen coverage. If the tool is absent, give the manual trace and mark the automated check unavailable.

The project inspector and pack graph inspect different artifacts. A saved project can pass its supported structural checks while recipes, external property producers or exported files remain unverified. Read `ok`, `complete`, diagnostics and omitted counts separately; keep the original project unchanged.

For a design/review request, produce the proposed file graph, state/input contract and unresolved checks. For implementation, add measured screenshots, target-device interaction evidence and a fresh Content Log before claiming the requested runtime behavior works. Keep `runtimeVerified: false` until that evidence exists.
