---
name: mcbe-json-ui-texture-design
description: Select, specify, and generate original Minecraft Bedrock JSON UI textures from catalog evidence. Use for buttons, panels, icons, state sets, pixel-art style, palettes, dimensions, and same-stem nine-slice metadata; use a layout skill separately for control geometry.
---

# MCBE JSON UI Texture Design

Turn asset-catalog evidence into an original, implementation-ready texture set without copying private or restricted source art.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Contract

- Input: UI function, control role, required states, intended display size, stretch behavior, target palette/style, and redistribution boundary.
- Output: cited evidence summary, structured asset brief, image-generation prompt when requested, state/file matrix, and same-stem nine-slice contract when applicable.
- Success: every visual choice is tied to catalog evidence or labeled as a new design decision; files form a coherent state set; no private path, source-specific name, or identifiable original composition is exposed.

## Workflow

When selecting a style or palette, use [references/style-directions.md](references/style-directions.md) before the brief. Load one style card; retain catalog measurements separately from proposed colors and decoration.

For pixel asset sets, palette/cluster review, frame animation or atlas handoff, read [references/pixel-art-production.md](references/pixel-art-production.md) and select one production method. It adapts reviewed external workflows without loading or installing their complete Skills or tools.

If that method needs source-specific craft/export detail, `node tools/research-context.mjs context --topic pixel-craft` or `--topic asset-export` retrieves one reviewed topic. For a supplied indexed library, use `asset.learn` with `texture-state` or `nine-slice`; original art remains subject to its own reuse limits.

1. Read [references/asset-brief-contract.md](references/asset-brief-contract.md) before producing a brief or generation prompt.
2. Run registered `asset.catalog`, then query `asset.context` by role and state. If the local semantic catalog is unavailable, fall back to `asset.search` with role/state/shape/size terms and inspect several distinct results.
3. Record only abstract evidence: function, role, state behavior, dimensions, aspect ratio, alpha use, stretchability, nine-slice margins, palette characteristics, edge weight, corner treatment, and pixel density.
4. Separate reusable cross-source patterns from one-source styling. Do not infer a universal rule from one pack or one texture.
5. Produce the asset brief and state/file matrix before generating pixels. For resizable surfaces, define the PNG and same-stem JSON together.
6. Invoke `imagegen` only when the user explicitly asks to create or edit an image. A request for analysis, a prompt, a brief, or a plan does not authorize generation.
7. Validate dimensions, transparency, state completeness, naming, and nine-slice sidecars; then hand display-size decisions to `mcbe-json-ui-visual-design` or IR authoring.

## Boundaries

- Treat local asset-library files as analysis evidence unless redistribution permission is independently confirmed.
- Never include absolute paths, private source IDs, server names, creator watermarks, or source-specific filenames in public prompts or briefs.
- Create a new composition and style specification; do not request a pixel-for-pixel recreation of a catalog item.
- Do not stretch decorative corners or borders. Use verified or newly designed nine-slice margins for scalable surfaces.
- Do not claim an image is usable in Bedrock until the target RP contains it and its JSON UI reference is statically checked; runtime rendering remains a separate check.
