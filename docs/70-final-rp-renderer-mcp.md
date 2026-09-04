# Final-RP renderer, MCP, and evidence contract

The final-RP engine reads the installed resource-pack graph instead of treating compiled IR JSON as the final screen. The original preview remains a geometry debugger.

## Components

- `tools/_lib/final-rp-engine.mjs`: the v2 entrypoint used by the CLI and MCP.
- `tools/_lib/final-rp-v2/`: `_ui_defs`, namespaces, cross-file inheritance, globals and instance variables, server-form collections, interaction states, anchors, installed Minecraft bitmap fonts, target-first textures, nine-slice rendering, alpha bounds, and validation.
- `tools/final-rp-render-legacy.mjs`: the retained v1 diagnostic path, invoked only with `--engine legacy` or `npm run final-rp:render:legacy`.
- `tools/_lib/screenshot-compare.mjs`: reference measurement and screenshot-to-UI coordinate comparison.
- `tools/_lib/final-rp-v2/`: installed-vanilla/font profiles, Minecraft glyph requirements, calibrated device transforms, target-first texture decoding, display-list rendering, and state comparison primitives.
- `tools/mcp-server.mjs`: read-only stdio MCP exposing the fourteen `mcbe_ui_*` tools.
- `tools/inspector-server.mjs`: `127.0.0.1` inspector using the same backend.

The MCP schema exposes fourteen tools backed by the same v2 engine as the CLI and inspector. `mcbe_ui_calibrate_renderer`, `mcbe_ui_measure_text`, and `mcbe_ui_validate_upstream_compatibility` are evidence gates, not optional simulated results. A missing local dependency or font profile blocks the affected evidence.

## Required v2 sequence

1. Open the exact target RP and retain its project revision.
2. Create or load an installed-vanilla profile whose `status` is `available`; require the nested Minecraft font profile to be `available` and record version plus fingerprint.
3. Run `node tools/upstream-compat.mjs --strict --captures workspace/upstream-captures`. Every required fixture must be `baseline-verified` or a reviewed, hash-bound `local-capture-verified` observation. Optional `pending-local` fixtures remain unresolved and do not become runtime truth.
4. Resolve the screen using a complete fixture and explicit device profile.
5. Render default and every relevant hover, pressed, selected, locked, and focus state. Compare state hashes, geometry, alpha bounds, and texture-family consistency.
6. Calibrate logical UI coordinates to the actual Bedrock screenshot for its viewport, GUI scale, safe area, and crop. Use at least three non-collinear correspondences and retain confidence/residual.
7. Measure text only with the Minecraft font profile. Missing atlas metadata or glyph pages produce `FONT_UNAVAILABLE` and block fit/baseline conclusions.
8. Validate layout/state textures, compare the screenshot, and issue read-only patch proposals only from server-issued evidence IDs tied to the same project revision.

Do not claim pixel accuracy or guess coordinates while the vanilla profile, font profile, device profile, or calibration is unresolved.

## v2 CLI

The default CLI renders one resolved final-RP state with the v2 engine and writes a PNG plus JSON report. Installed vanilla and its bitmap font assets are discovered locally when `--vanilla-root` is omitted:

```powershell
npm run final-rp:render -- <rp-root> --fixture <fixture.json> --vanilla-root <vanilla-root> --out workspace/final-rp/preview.png --viewport 480x270
```

Use `--states default,hover,pressed` for a contact sheet, or repeat with explicit `--hover` and `--pressed` indexes for each interactive family. The CLI report contains the installed profile fingerprint, unresolved records, state hash, declared rects, alpha bounds, baselines, distortion and clipping results. It still does not execute Bedrock or turn a local render into runtime proof.

Use `--engine legacy` only for regression comparison. Legacy output cannot replace v2 evidence.

Within one CLI/MCP/inspector process, installed-vanilla indexes, Minecraft font profiles, texture decodes, and nine-slice sidecars are cached with file revision stamps. A changed `_ui_defs`, indexed UI file, font asset, texture, or sidecar invalidates the affected cache. A measured development-pack warm open was about 29 ms after an approximately 1.34 s cold open on the development machine; this is a local benchmark, not a guaranteed cross-machine limit.

## Known fidelity boundary

The renderer reports, rather than hides, unsupported expressions and missing font assets. Bedrock's default glyph pipeline is not replaced with an unreported system font. Until the required font evidence is available, glyph bounds and baselines remain unresolved rather than approximate proof.

The inspector and MCP never write into the source RP. Patch proposals are read-only records, identify source pointer and property origin, require current evidence and project revision, and may move a value by at most two UI units per screenshot iteration.

## Evidence labels

- `geometry`: IR solve and constraint validation.
- `final pack structure`: final `_ui_defs`, namespace, route, fixture, and texture resolution.
- `final-pack static visual`: final-RP PNG and state reports with relevant dependencies resolved.
- `Bedrock runtime verified`: imported in-game state matrix, element comparison within tolerance, and clean content log.

Do not collapse these labels into a single pass flag.
