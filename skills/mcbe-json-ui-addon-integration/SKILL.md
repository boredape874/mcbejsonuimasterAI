---
name: mcbe-json-ui-addon-integration
description: Analyze Minecraft Bedrock JSON UI as part of a full addon or resource-pack stack. Use when Codex must connect UI files to custom textures, fonts, blocks, entities, attachables, animations, or broader addon asset structure rather than treating JSON UI as isolated files.
---

# MCBE JSON UI Addon Integration

Use this when the UI depends on the wider pack.

## Contract

- Input: target UI file, RP/BP roots, referenced assets, and the state or protocol owner.
- Output: a UI-to-asset-or-script dependency trace and the smallest owned file set to change.
- Success: every changed reference resolves, static data stays in RP, dynamic authority stays in BP or Script API, and runtime-only behavior is labeled unverified.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-addon-integration` entry. Run a registered checker only after confirming its command exists; otherwise trace the pack directly and report the missing check.

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

- RPG Server UI Reference is the main included addon-integration source.
- Farm UI Variants is secondary and broader.
