---
name: mcbe-json-ui-foundations
description: Explain and apply the core structure of Minecraft Bedrock JSON UI. Use when Codex needs to reason about `_ui_defs.json`, namespace layout, screen registration, modifications, factories, panel insertion, and the resource-pack file structure behind Bedrock JSON UI.
---

# MCBE JSON UI Foundations

Start from registration and structure before discussing behavior.

## Contract

- Input: pack root, target screen, namespace, and expected insertion point.
- Output: registration-to-control trace with exact files and unresolved links.
- Success: `_ui_defs`, namespace references, modifications, factories, and insertion ownership form a complete static path.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-foundations` entry. Use a registered structure checker only when its implementation is present; otherwise inspect the files directly.

## Workflow

1. Read `references/foundations-map.md`.
2. Identify the current layer:
   - `_ui_defs.json`
   - namespace
   - root_panel or hud_content insertion
   - factory registration
   - pack file layout
3. Answer with exact file paths and where the screen is registered.
4. If the problem is about values changing or parsing, switch to `logic`.
