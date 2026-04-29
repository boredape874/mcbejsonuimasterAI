---
name: mcbe-json-ui-schemas
description: Validate and reason about Minecraft Bedrock JSON UI using schema sources. Use when Codex must compare or use Blockception and DJStompZone schema files, configure VSCode `json.schemas`, inspect schema coverage for `ui`, `_ui_defs`, or `_global_variables`, or explain what schema validation can and cannot guarantee for Bedrock JSON UI.
---

# MCBE JSON UI Schemas

Use this when schema validation is the main concern.

## Workflow

1. Read `references/schema-map.md`.
2. Decide whether the task is:
   - schema source selection
   - VSCode setup
   - schema coverage lookup
   - limitation explanation
3. Prefer DJStompZone for focused JSON UI schema files.
4. Prefer Blockception for broader Bedrock editor integration and schema ecosystem context.

## Hard rules

- Treat schemas as validation aids, not runtime truth.
- Prefer runtime examples and community reference docs when explaining behavior.
- Prefer schema files when the question is about allowed structure or editor setup.
