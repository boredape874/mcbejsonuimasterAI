---
name: mcbe-json-ui-tooling
description: Use tools and tool-generated references for Minecraft Bedrock JSON UI work. Use when Codex must reason about visual JSON UI editing, builder-generated UI examples, chest-like form tooling, or practical authoring workflows from bedrock-json-ui-editor, EasyUIBuilder, and Chest-UI.
---

# MCBE JSON UI Tooling

Use this when the main need is understanding or borrowing a tool workflow.

## Workflow

1. Read `references/tooling-map.md`.
2. Decide whether the task is mainly:
   - visual editing
   - builder-generated examples
   - chest-like form tooling
3. Read only the matching source set.
4. Translate the tool-specific structure back into direct JSON UI edits when answering.

## Hard rules

- Do not assume a tool output is automatically optimal runtime JSON.
- Use tool examples as authoring references, not as a replacement for Bedrock runtime validation.
