---
name: mcbe-json-ui-final-rp-inspection
description: Resolve, render, inspect, and compare a final Minecraft Bedrock resource-pack JSON UI screen locally, including cross-file inheritance, server-form fixtures, collection data, textures, states, and layout diagnostics. Use after UI integration when an IR-only preview is insufficient.
---

# MCBE JSON UI Final RP Inspection

Use this skill for final resource-pack evidence. It does not replace Bedrock runtime capture.

## Workflow

1. Read `references/local-render-and-mcp.md`.
2. Open the exact target RP and supply a fixture with every collection index and dynamic value used by the screen.
3. Require an available installed-vanilla profile with an available Minecraft font profile. Record its version and fingerprint, then run the pinned offline upstream compatibility fixtures.
4. Resolve and render default plus every relevant hover, pressed, selected, locked, and focus state. A state is not covered merely because its texture exists.
5. Calibrate the logical-to-screenshot transform for the target viewport, GUI scale, safe area, and Bedrock screenshot before comparing coordinates.
6. Inspect unresolved controls, textures, expressions, glyphs, baselines, alpha bounds, aspect warnings, and state geometry. Generate only evidence-backed, read-only patch proposals tied to the current project revision.
7. Report this as `final-pack static visual`; promote to `Bedrock runtime verified` only after the in-game state matrix and content log pass.

## Hard boundaries

- Target RP files take precedence over an optional vanilla mirror.
- Never hide a missing Minecraft font by silently substituting a system font. `FONT_UNAVAILABLE` blocks text-fit and baseline claims.
- Do not claim pixel accuracy or guess coordinates while the vanilla/font profile, device profile, or screenshot calibration is unresolved.
- Do not infer hover correctness from default-state output.
- Do not write previews or reports inside the target RP.
- A generated PNG with unresolved dependencies is diagnostic evidence, not a pass.
- External editor output is fixture evidence only. The Bedrock client is the final rendering and interaction authority.
