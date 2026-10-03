---
name: mcbe-json-ui-tooling
description: Use tools and tool-generated references for Minecraft Bedrock JSON UI work. Use when Codex must reason about visual JSON UI editing, builder-generated UI examples, chest-like form tooling, AUX ID generation, vanilla JSON UI dumping, dynamic-form-library-style form libraries, or practical authoring workflows from bedrock-json-ui-editor, builder-sample, container-form-sample, bedrock-auxgen, JSON-UI-Dumper, and dynamic-form-library.
---

# MCBE JSON UI Tooling

Use this when the main need is understanding or borrowing a tool workflow.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

For Minato Chest UI Editor projects, route to `mcbe-json-ui-chest-gui` and its editor-audit reference. The local `chest-project` inspector checks saved JSON; editor preview and exported RP behavior remain separate evidence.

## Contract

- Input: authoring task, candidate tool, expected artifact, and the target pack constraints.
- Output: the useful workflow or generated structure, translated into direct JSON UI terms with limitations.
- Success: external tooling remains a research aid, generated output is inspected, and runtime validity is not inferred from editor rendering.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-tooling` entry. A registry entry is not installation proof; confirm the executable or script before invoking it.

## Workflow

For visual editing together with Codex, read `references/json-ui-studio.md` first. The local Studio provides RP screen/layer selection, source edits, watched preview, image import and an App Server chat; use the existing renderer and shared selection rather than requesting full UI trees repeatedly.

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
