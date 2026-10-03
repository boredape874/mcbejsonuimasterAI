---
name: mcbe-json-ui-addon-integration
description: Analyze Minecraft Bedrock JSON UI as part of a full addon or resource-pack stack. Use when Codex must connect UI files to custom textures, fonts, blocks, entities, attachables, animations, or broader addon asset structure rather than treating JSON UI as isolated files.
---

# MCBE JSON UI Addon Integration

Use this when the UI depends on the wider pack.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

Equipped model UI uses `mcbe-attachables-ui`; player-renderer geometry UI uses `mcbe-geo-ui`; materials/outlines/PBR use `mcbe-resource-pack-rendering`. For broad non-UI addon ownership use `mcbe-resource-pack-master`. When available, `node tools/attachable-inspect.mjs --rp RP --bp BP --json` inspects the resource graph; it does not execute the input/state path.

## Contract

- Input: target UI file, RP/BP roots, referenced assets, and the state or protocol owner.
- Output: a UI-to-asset-or-script dependency trace and the smallest owned file set to change.
- Success: every changed reference resolves, static data stays in RP, dynamic authority stays in BP or Script API, and runtime-only behavior is labeled unverified.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-addon-integration` entry. Run a registered checker only after confirming its command exists; otherwise trace the pack directly and report the missing check.

## Workflow

1. Read `references/addon-map.md`.
2. When one addon must expose multiple server-form layouts and texture skins through title prefixes, read `references/prefix-skinned-form-addon.md` and treat its count, source, and runtime gates as a project-specific contract.
3. Identify the non-UI dependency:
   - textures
   - font
   - blocks
   - attachables
   - entity visuals
   - form payload, scoreboard, or Script API state
4. Explain how the UI depends on that layer.
5. Record when dynamic data is snapshotted and what event refreshes it. A form-open payload is not a live subscription; cross-category search cannot include products never supplied to the client-side data owner.
6. Verify the exact installed RP/BP path, manifest UUID/version/dependencies, pack priority, and changed-file fingerprint; exclude duplicate packs with the same identity before treating stale visuals as a code failure. Resolve assets target-RP-first.
7. When more than one RP is active, map ordered ownership of vanilla screen overrides, namespaces, global variables, protocol prefixes, atlas keys, font pages, and textures. Validate the stack in both source and installed order; a single-pack parse cannot close a stack collision.
8. When a new aggregate pack copies earlier `server_form.json` routes or imports earlier BP handlers, activate the aggregate pack alone. Assert that superseded RP/BP UUIDs are absent from the target world's active lists while unrelated packs are preserved; otherwise the same route modification and event subscription can run once per active version and render duplicate screens.
9. Fingerprint copied compatibility UI and BP modules against their current source packs after every regeneration so the installed aggregate cannot silently contain stale earlier layouts.
10. If the task is only about UI structure, switch back to the narrower skill.

## Focus

- RPG Server UI Reference is the main included addon-integration source.
- Farm UI Variants is secondary and broader.
- Dynamic values stay owned by BP/Script API, scoreboard, or server form data. RP bindings may display or transform supplied state but must not be described as authoritative game state.
