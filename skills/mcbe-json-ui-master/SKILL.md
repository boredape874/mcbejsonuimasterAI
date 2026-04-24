---
name: mcbe-json-ui-master
description: Comprehensive Minecraft Bedrock JSON UI master skill. Use when Codex must handle Bedrock JSON UI end to end across pack structure, HUD, chat, title or actionbar driven UI, server form customization, bindings and string parsing logic, reusable patterns, addon integration, debugging, and verified vanilla texture path lookup.
---

# MCBE JSON UI Master

Use this as the top-level skill for Bedrock JSON UI work.

## Workflow

1. Read `references/master-routing.md`.
2. Decide whether the task is mainly:
   - structure
   - logic
   - HUD or chat
   - server form
   - reusable pattern
   - debugging
   - addon integration
   - vanilla asset lookup
3. Read only the matching specialized skill reference.
4. Answer with file-level changes, exact JSON locations, and exact texture paths.

## Hard rules

- Never invent Bedrock texture paths.
- Never guess undocumented binding or property names if exact lookup is needed.
- Treat JSON UI as part of the full resource pack, not as isolated JSON files.
- Prefer included sample packs over abstract explanation.
