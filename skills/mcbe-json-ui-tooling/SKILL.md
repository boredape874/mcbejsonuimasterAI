---
name: mcbe-json-ui-tooling
description: Use tools and tool-generated references for Minecraft Bedrock JSON UI work. Use when Codex must reason about visual JSON UI editing, builder-generated UI examples, chest-like form tooling, AUX ID generation, vanilla JSON UI dumping, dynamic-form-library-style form libraries, or practical authoring workflows from bedrock-json-ui-editor, builder-sample, container-form-sample, bedrock-auxgen, JSON-UI-Dumper, and dynamic-form-library.
---

# MCBE JSON UI Tooling

Use this when the main need is understanding or borrowing a tool workflow.

## Contract

- Input: authoring task, candidate tool, expected artifact, and the target pack constraints.
- Output: the useful workflow or generated structure, translated into direct JSON UI terms with limitations.
- Success: external tooling remains a research aid, generated output is inspected, and runtime validity is not inferred from editor rendering.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-tooling` entry. A registry entry is not installation proof; confirm the executable or script before invoking it.

## Workflow

1. Read `references/tooling-map.md`.
2. Decide whether the task is mainly:
   - visual editing
   - builder-generated examples
   - chest-like form tooling
   - AUX or item ID tooling
   - vanilla UI dumping
   - form-library architecture
3. Read only the matching source set.
4. Translate the tool-specific structure back into direct JSON UI edits when answering.

## Hard rules

- Do not assume a tool output is automatically optimal runtime JSON.
- Use tool examples as authoring references, not as a replacement for Bedrock runtime validation.
