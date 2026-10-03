---
name: mcbe-json-ui-foundations
description: Explain and apply the core structure of Minecraft Bedrock JSON UI. Use when Codex needs to reason about `_ui_defs.json`, namespace layout, screen registration, modifications, factories, panel insertion, and the resource-pack file structure behind Bedrock JSON UI.
---

# MCBE JSON UI Foundations

Start from registration and structure before discussing behavior.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

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
