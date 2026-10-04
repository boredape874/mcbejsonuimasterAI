---
name: mcbe-json-ui-server-forms
description: Analyze and implement Bedrock JSON UI server forms, including title/factory routing, collection-backed buttons, client tabs and dropdown pagination, category and global search, hover states, close/search input, inline edit boxes, and typed BP response handling.
---

# MCBE JSON UI Server Forms

Treat a custom form as one BP/RP protocol, not as an isolated screen skin.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

For a chest-style menu, use `mcbe-json-ui-chest-gui` for fixed slots, page snapshots and inventory appendix mapping, then return here for the ActionForm factory contract. A native `chest_screen` inventory is owned by that chest skill rather than this ActionForm workflow.

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

For transparent form buttons over a HUD Geo scene, read the GeoUI skill's [hybrid player-form customizer](../mcbe-geo-ui/references/player-form-customizer.md). Keep collection ownership and caption indices separate; a scene that remains visible while an ActionForm is reopened does not prove the form itself stayed open.

For instant tabs/pages within one open ModalForm, read [dropdown pagination](references/dropdown-pagination.md) only when requested. Keep the state dropdown at `custom_form` index 0, preload all views, and keep its reader and page gates active. Resolve the author's `dropdown.radio_selected` in the actual source pack; it is not an established vanilla control. ActionForm-style content buttons inside a ModalForm need a separately verified hybrid adapter. The reference includes pinned similar implementations and original protocol/binding fragments; target-client interaction remains a required check.

## Required boundaries

- A search toggle cannot search categories whose data is absent from the active collection.
- `collection_name` belongs to the verified collection owner; `collection_index` belongs to the materialized item.
- A visual hover/pressed state is not click dispatch.
- Keep project-specific tokens, labels, namespaces, and hidden payload markers in the project contract, not in this Skill.
