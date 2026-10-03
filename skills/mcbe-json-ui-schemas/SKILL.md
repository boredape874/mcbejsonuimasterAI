---
name: mcbe-json-ui-schemas
description: Validate and reason about Minecraft Bedrock JSON UI using schema sources. Use when Codex must compare or use Blockception, DJStompZone, or Bugrock JSON UI schema files, configure VSCode `json.schemas`, inspect schema coverage for `ui`, `_ui_defs`, `_global_variables`, or sprite UI metadata, or explain what schema validation can and cannot guarantee for Bedrock JSON UI.
---

# MCBE JSON UI Schemas

Use this when schema validation is the main concern.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Contract

- Input: file class, target schema source, validator/editor context, and the behavior being checked.
- Output: applicable schema and configuration, validation findings, and schema coverage limits.
- Success: structural findings are reproducible and no schema result is presented as Bedrock runtime proof.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-schemas` entry. Run a registered validator only after confirming it exists and name any file class the available schemas do not cover.

## Workflow

1. Read `references/schema-map.md`.
2. Decide whether the task is:
   - schema source selection
   - VSCode setup
   - schema coverage lookup
   - limitation explanation
3. Prefer DJStompZone for focused JSON UI schema files.
4. Prefer Blockception for broader Bedrock editor integration and schema ecosystem context.
5. Prefer Bugrock JSON UI Schemas when a task needs direct hosted schema URLs, sprite UI schema coverage, or a compact screen/type/property catalogue.

## Hard rules

- Treat schemas as validation aids, not runtime truth.
- Prefer runtime examples and Bedrock Wiki when explaining behavior.
- Prefer schema files when the question is about allowed structure or editor setup.
