---
name: mcbe-json-ui-chest-gui
description: Design and inspect Bedrock chest GUI, native container slots, chest-style ActionForm menus, and Minato Chest UI Editor projects. Use for slot mapping, tabs, scrolling, inventory/hotbar, item state protocols, and project import/export review.
---

# MCBE Chest GUI

Identify the interaction before selecting a layout. A native chest moves actual container items; a chest-style ActionForm returns a button selection. Keep those contracts separate even when the screenshots look alike.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Start with one mode

| Evidence or request | Read next |
| --- | --- |
| `chest_screen`, `container_items`, actual stacks, transfer/drop, player inventory | [Native container](references/native-container.md) |
| `ActionFormData`, `form_buttons`, `response.selection`, menu callbacks | [Chest form](references/action-form.md) |
| Minato project JSON, `formatVersion: 2`, export/import, browser editor issues | [Editor audit](references/editor-audit.md) |

If only a picture or “chest GUI” is available, establish whether the user needs real item movement or menu actions. Inspect the supplied project before asking. Do not infer the transport from 27/54 cells, item icons, or a double-chest background.

## Tools when this checkout is available

- `node tools/design-library.mjs chest-topics` lists seven small research cards; `chest --topic ID` reads only the selected card.
- `node tools/chest-project.mjs --input project.json --capacity 27 --json` checks a Minato v2 JSON project without loading its JavaScript. Capacity must come from the intended container; preview slot count is insufficient.
- `node tools/chest-contract.mjs --contract contract.json --json` validates an authored slot/response contract. Use `--page ID` only when detailed slot mapping is needed.
- `node tools/skill-context.mjs mcbe-json-ui-chest-gui --needs chest-project --json` selects the project inspector; use `chest-contract` or `chest-research` for the other needs.

Without this checkout, follow the selected reference manually and report the exact missing tool. Do not invent a command or treat an absent check as passed.

## Working contract

Record transport, target client, RP entry/route and fallback, real data owner, declared collection capacities, stable slot identities, and requested input devices. Keep the visible title separate from route/state payloads. Preserve original files and upstream attribution/reuse limits.

Use the visual-design/IR owner for measured geometry and the texture owner for artwork. Use server-forms for ActionForm factory details; use addon-integration for item movement, data mutation, and server validation. Verify the final integrated RP through final-rp-inspection when image/geometry claims are needed.

Return compact diagnostics and changed artifacts first. Separate project-shape checks, declared slot mapping, resolved RP references, editor appearance, and Bedrock interaction evidence. A valid authored contract does not prove that the actual RP/BP implements it.

For implementation tasks, completion requires the requested transport to work in Bedrock: route/fallback, first/middle/last and empty slots, cancel/close, state updates, and selected devices. Research and inspection can finish at their requested evidence level. Until runtime evidence exists, report `runtimeVerified: false`.
