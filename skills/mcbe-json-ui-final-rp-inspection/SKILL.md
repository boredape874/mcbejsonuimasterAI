---
name: mcbe-json-ui-final-rp-inspection
description: Resolve, render, inspect, and compare a final Minecraft Bedrock resource-pack JSON UI screen locally, including cross-file inheritance, server-form fixtures, collection data, textures, states, and layout diagnostics. Use after UI integration when an IR-only preview is insufficient.
---

# MCBE JSON UI Final RP Inspection

Use this skill for final resource-pack evidence. It does not replace Bedrock runtime capture.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Workflow

1. Read `references/local-render-and-mcp.md`.
2. Open the exact target RP and supply a fixture with every collection index and dynamic value used by the screen.
   Render the complete registered form root; a cropped control fragment is not form evidence.
3. Require an available installed-vanilla profile with an available Minecraft font profile. Record its version and fingerprint, then run the pinned offline upstream compatibility fixtures.
4. Resolve and render default plus every relevant hover, pressed, selected, locked, and focus state. A state is not covered merely because its texture exists.
   Wait for the requested state to settle and compare final hashes; do not capture the transition frame.
5. Calibrate the logical-to-screenshot transform for the target viewport, GUI scale, safe area, and Bedrock screenshot before comparing coordinates.
6. Inspect unresolved controls, textures, expressions, glyphs, baselines, alpha bounds, aspect warnings, and state geometry. Generate only evidence-backed, read-only patch proposals tied to the current project revision.
7. Require an evidence gate: registered full root, applied modifications, source-family fixture coverage, expected materialized controls, nonblank output alpha, and the requested pixel-inspection capability.
8. Bind screenshot comparison to nonempty required regions, match thresholds, calibration ID, project revision, and artifact hashes before issuing correction evidence.
9. Report this as `final-pack static visual`; promote to `Bedrock runtime verified` only after the in-game state matrix and content log pass.

## Hard boundaries

- Target RP files take precedence over an optional vanilla mirror.
- Never hide a missing Minecraft font by silently substituting a system font. `FONT_UNAVAILABLE` blocks text-fit and baseline claims.
- Do not claim pixel accuracy or guess coordinates while the vanilla/font profile, device profile, or screenshot calibration is unresolved.
- Do not infer hover correctness from default-state output.
- Do not write previews or reports inside the target RP.
- A generated PNG with unresolved dependencies is diagnostic evidence, not a pass.
- A fully transparent PNG, empty controls map, unavailable pixel metrics, generic fixture mismatch, unapplied modification, empty screenshot-region set, or placeholder device profile is diagnostic-only even when a tool reports `ok`.
- Target-RP font metadata and glyph pages override vanilla evidence. A vanilla font profile cannot prove target glyph page, baseline, or advance.
- An unindexed state request with more than one candidate host is ambiguous; require a target control or collection index rather than sampling the first stateful control.
- A stale preview process, reused port, or cache key that omits the source form can return old pixels. Restart on a fresh port or verify the serving revision and include source hashes in cache invalidation.
- External editor output is fixture evidence only. The Bedrock client is the final rendering and interaction authority.
- Engine-backed `custom` controls such as `live_player_renderer` and `paper_doll_renderer` require an explicit unavailable diagnostic when the offline renderer cannot execute them. A blank offline region neither proves the control is absent nor proves it renders correctly in Bedrock.
