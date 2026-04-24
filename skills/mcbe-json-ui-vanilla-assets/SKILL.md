---
name: mcbe-json-ui-vanilla-assets
description: Verify vanilla Minecraft Bedrock texture and icon paths for JSON UI. Use when Codex must confirm `textures/ui/*`, `textures/items/*`, or `textures/blocks/*` paths and avoid hallucinating nonexistent vanilla asset names in Bedrock JSON UI or related form UI work.
---

# MCBE JSON UI Vanilla Assets

Use this when the task needs a confirmed vanilla texture path.

## Workflow

1. Read `references/vanilla-map.md`.
2. Search the included vanilla reference markdown for the requested icon or texture category.
3. Return only verified paths.
4. If the path is not found, say it is not verified and recommend a custom texture instead of guessing.

## Hard rule

- Never invent Bedrock texture paths.
