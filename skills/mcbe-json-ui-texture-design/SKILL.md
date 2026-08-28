---
name: mcbe-json-ui-texture-design
description: Select, specify, and generate original Minecraft Bedrock JSON UI textures from catalog evidence. Use for buttons, panels, icons, state sets, pixel-art style, palettes, dimensions, and same-stem nine-slice metadata; use a layout skill separately for control geometry.
---

# MCBE JSON UI Texture Design

Turn asset-catalog evidence into an original, implementation-ready texture set without copying private or restricted source art.

## Contract

- Input: UI function, control role, required states, intended display size, stretch behavior, target palette/style, and redistribution boundary.
- Output: cited evidence summary, structured asset brief, image-generation prompt when requested, state/file matrix, and same-stem nine-slice contract when applicable.
- Success: every visual choice is tied to catalog evidence or labeled as a new design decision; files form a coherent state set; no private path, source-specific name, or identifiable original composition is exposed.

## Workflow

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
