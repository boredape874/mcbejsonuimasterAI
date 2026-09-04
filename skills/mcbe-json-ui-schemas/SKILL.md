---
name: mcbe-json-ui-schemas
description: Validate and reason about Minecraft Bedrock JSON UI using schema sources. Use when Codex must compare or use Blockception, DJStompZone, or Bugrock JSON UI schema files, configure VSCode `json.schemas`, inspect schema coverage for `ui`, `_ui_defs`, `_global_variables`, or sprite UI metadata, or explain what schema validation can and cannot guarantee for Bedrock JSON UI.
---

# MCBE JSON UI Schemas

Use this when schema validation is the main concern.

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
