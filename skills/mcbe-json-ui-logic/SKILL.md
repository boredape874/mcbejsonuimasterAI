---
name: mcbe-json-ui-logic
description: Explain and implement Bedrock JSON UI logic rules. Use when Codex must analyze bindings, preserved text, string slicing, printf-style `%.s` text formatting, fixed-width payloads, first-line extraction, chat locate-message parsing, actionbar or title driven protocols, visibility expressions, value extraction, and condition-based UI behavior in Minecraft Bedrock JSON UI.
---

# MCBE JSON UI Logic

Use this skill when the main problem is not structure but data flow.

## Contract

- Input: source control/property, payload examples, target value, and the controls that consume it.
- Output: source-to-derived-value binding trace, exact string protocol, and failure cases.
- Success: property ownership and transformation order are evidenced and unresolved binding names are not guessed.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-logic` entry. Use a registered inspector only when its command exists; otherwise trace bindings directly from the JSON UI and sender source.

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
