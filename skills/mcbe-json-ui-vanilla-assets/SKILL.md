---
name: mcbe-json-ui-vanilla-assets
description: Verify vanilla Minecraft Bedrock texture and icon paths for JSON UI. Use when Codex must confirm `textures/ui/*`, item icon atlas entries, block icon atlas entries, or vanilla screen file names and avoid hallucinating nonexistent vanilla asset names. Use ZtechNetwork/MCBVanillaResourcePack as the upstream asset authority.
---

# MCBE JSON UI Vanilla Assets

Use this when the task needs a confirmed vanilla texture path or current vanilla screen file lookup.

## Workflow

1. Read `references/vanilla-map.md`.
2. Use the Ztech upstream repo as the canonical vanilla asset source.
3. Search the correct upstream location:
   - `textures/ui/`
   - `textures/item_texture.json`
   - `textures/terrain_texture.json`
   - `ui/`
4. Return only verified paths or verified file names.
5. If the path is not found, say it is not verified and recommend shipping a custom texture instead of guessing.

## Hard rules

- Never invent Bedrock texture paths.
- Do not treat old handwritten icon notes as stronger than the upstream pack tree.
