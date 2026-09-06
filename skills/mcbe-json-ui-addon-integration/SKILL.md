---
name: mcbe-json-ui-addon-integration
description: Analyze Minecraft Bedrock JSON UI as part of a full addon or resource-pack stack. Use when Codex must connect UI files to custom textures, fonts, blocks, entities, attachables, animations, or broader addon asset structure rather than treating JSON UI as isolated files.
---

# MCBE JSON UI Addon Integration

Use this when the UI depends on the wider pack.

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
8. If the task is only about UI structure, switch back to the narrower skill.

## Focus

- RPG Server UI Reference is the main included addon-integration source.
- Farm UI Variants is secondary and broader.
- Dynamic values stay owned by BP/Script API, scoreboard, or server form data. RP bindings may display or transform supplied state but must not be described as authoritative game state.
