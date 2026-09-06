---
name: mcbe-json-ui-server-forms
description: Analyze and implement Bedrock JSON UI server forms, including title/factory routing, collection-backed buttons, category and global search, hover states, close/search input, inline edit boxes, and typed BP response handling.
---

# MCBE JSON UI Server Forms

Treat a custom form as one BP/RP protocol, not as an isolated screen skin.

## Contract

- Input: `server_form.json`, routed UI files, exact title/body/buttons or modal fields, sender code, and target input devices.
- Output: sender -> title route -> factory -> collection/index -> event -> response trace, changed files, and interaction evidence.
- Success: route/fallback is valid, displayed and callback indices agree, collection ownership is valid, search uses the intended data scope, and close/input behavior is tested or marked pending.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-server-forms` entry. Static contract checks do not prove that Bedrock dispatches clicks or typed values.

## Workflow

1. Read `references/server-form-map.md`.
2. Write the complete BP/RP contract before editing: form kind, exact title token, fallback, ordered semantic ids, field types, cancel behavior, and search scope.
3. Trace `main_screen_content`/route -> qualified factory control -> collection owner -> per-item index -> verified button mapping.
4. Validate sender/receiver order and marker cleanup, then test mouse, controller, touch, close/cancel, search, and typed submission in Bedrock.

## Required boundaries

- A search toggle cannot search categories whose data is absent from the active collection.
- `collection_name` belongs to the verified collection owner; `collection_index` belongs to the materialized item.
- A visual hover/pressed state is not click dispatch.
- Keep project-specific tokens, labels, namespaces, and hidden payload markers in the project contract, not in this Skill.
