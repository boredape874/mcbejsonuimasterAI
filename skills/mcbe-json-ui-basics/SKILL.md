---
name: mcbe-json-ui-basics
description: Explain the fundamentals of Minecraft Bedrock JSON UI in practical addon terms. Use when Codex must teach or reason about what a resource pack is, how JSON UI files are loaded, what `_ui_defs.json` and screen files do, how screens differ from templates, how Bedrock layout works across device sizes, or when a task is beginner-oriented and needs a correct mental model before implementation.
---

# MCBE JSON UI Basics

Use this skill when the task first needs the Bedrock mental model.

## Workflow

1. Read `references/basics-map.md`.
2. Explain Bedrock JSON UI in resource-pack terms, not generic web UI terms.
3. Prefer practical rules over fake certainty.
4. State clearly when a rule is a hard requirement, a common pattern, or only a convenient authoring habit.

## Hard rules

- Do not claim Bedrock has one fixed screen size.
- Do not describe JSON UI files as isolated from the rest of the resource pack.
- Do not treat schema validation as proof that the UI will render correctly.
- If the user moves from basics into a concrete implementation, route to `mcbe-json-ui-master` or the narrower specialized skill.
