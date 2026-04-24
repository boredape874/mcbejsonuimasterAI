---
name: mcbe-json-ui-addon-integration
description: Analyze Minecraft Bedrock JSON UI as part of a full addon or resource-pack stack. Use when Codex must connect UI files to custom textures, fonts, blocks, entities, attachables, animations, or broader addon asset structure rather than treating JSON UI as isolated files.
---

# MCBE JSON UI Addon Integration

Use this when the UI depends on the wider pack.

## Workflow

1. Read `references/addon-map.md`.
2. Identify the non-UI dependency:
   - textures
   - font
   - blocks
   - attachables
   - entity visuals
3. Explain how the UI depends on that layer.
4. If the task is only about UI structure, switch back to the narrower skill.

## Focus

- `custom-crops-reference` is the main included addon-integration source.
- `bunnyfarm` is secondary and broader.
