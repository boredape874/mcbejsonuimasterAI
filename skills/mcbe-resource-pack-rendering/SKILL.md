---
name: mcbe-resource-pack-rendering
description: Design and diagnose Minecraft Bedrock material, transparency, outline and PBR texture-set behavior for resource packs, attachables and GeoUI. Use for render appearance and graphics-mode compatibility; use the asset graph owner for missing geometry or animation links.
---

# MCBE Resource Pack Rendering

Choose the actual rendering path before editing appearance: JSON UI texture/control, entity/attachable material, block material instance, or PBR texture set. Their similarly named settings are not interchangeable.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: the Mojang `bedrock-samples` revision recorded in `references/official/bedrock-samples-ui.lock.json` (UI files committed under `references/official/bedrock-samples-ui`; `resource_pack/attachables`, `resource_pack/entity`, `resource_pack/animations`, `resource_pack/render_controllers`, `resource_pack/models` and `materials` through the local mirror under `references/upstreams/bedrock-samples` or the hash-verified cache from `node tools/design-source-sync.mjs --source mojang-bedrock-samples --download`), then the structural checker `node tools/material-audit.mjs --rp RP --mode vibrant --json`.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

- Alpha, material aliases or custom `.material`: [Materials](references/materials.md).
- Border, silhouette or glow-like outline: [Outlines](references/outlines.md).
- Classic/Vibrant Visuals/RTX and texture maps: [Texture sets](references/texture-sets.md).
- Render controller keys, the vanilla item/armor/bow controller shapes, armor slot query indices, texture-set validity rules and the Wiki material caveats with their evidence labels: [render controller and material evidence](references/render-controller-and-material-evidence.md).
- Hair showing an entire color atlas, missing GeoUI materials or exposed background edges: [hybrid customizer rendering](../mcbe-geo-ui/references/player-form-customizer.md#hair-color-and-materials). Read its evidence limits before treating the latest material or background extension as a runtime fix.

Record the intended client, graphics mode, asset graph, reference image and viewing conditions. Use one palette role and texel-density rule across an asset family; inspect transparency over both light and dark game backgrounds. Use the visual-design/texture-design specialist for UI composition or original pixel artwork.

With this checkout, `node tools/material-audit.mjs --rp <RP> --mode classic --json` checks material inheritance and texture-set structure. Select `vibrant` or `rtx` only when that is the actual target. `--report NEW_FILE` keeps full diagnostics while stdout remains bounded. It does not decode images, execute shaders or prove outlines in-game. Use `attachable-inspect` for the connected asset graph.

Confirm the rendered result and fresh Content Log in each requested graphics mode. A shader key present in an old source is not evidence that the current client uses it. Research-only tasks can report the source-supported recommendation and pending client checks.
