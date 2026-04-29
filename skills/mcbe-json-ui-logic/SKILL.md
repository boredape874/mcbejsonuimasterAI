---
name: mcbe-json-ui-logic
description: Explain and implement Bedrock JSON UI logic rules. Use when Codex must analyze bindings, preserved text, string slicing, printf-style `%.s` text formatting, fixed-width payloads, first-line extraction, actionbar or title driven protocols, visibility expressions, value extraction, and condition-based UI behavior in Minecraft Bedrock JSON UI.
---

# MCBE JSON UI Logic

Use this skill when the main problem is not structure but data flow.

## Workflow

1. Read `references/logic-map.md`.
2. Identify the logic type:
   - binding relay
   - string prefix filtering
   - fixed-width substring parsing
   - title or actionbar protocol
   - visibility condition
3. Explain which control owns the source property and where the derived value is used.
4. If exact property names are needed, escalate to `vanilla-assets` only for textures, otherwise answer from source evidence.

## Output rules

- Use short JSON snippets only when needed.
- State the protocol string exactly when one exists.
- Distinguish view-binding derived values from direct `binding_name` values.
