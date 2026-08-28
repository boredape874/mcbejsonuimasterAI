---
name: mcbe-json-ui-visual-design
description: Design and verify Minecraft Bedrock JSON UI proportions, positions, sizes, spacing, alignment, typography, nine-slice surfaces, and button states from measured evidence. Use for visual layout decisions; use a data-flow skill separately for bindings or protocols.
---

# MCBE JSON UI Visual Design

Turn a screenshot, working screen, or catalog recipe into explicit layout decisions before JSON UI is compiled.

## Contract

- Input: target screen and files, device profile, reference image or working UI evidence, allowed textures, and required text/state variants.
- Output: measured design basis, geometry and text constraints, chosen recipe IDs when available, IR handoff, previews, and unresolved items.
- Success: every important size and alignment is traceable to evidence or an explicit constraint; static results have no unintended clipping or overlap; runtime-only claims remain unverified until Bedrock testing.

## Workflow

1. Read [references/measured-layout-workflow.md](references/measured-layout-workflow.md).
2. Inspect the target screen, its inherited controls, referenced textures, and adjacent nine-slice metadata.
3. If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-visual-design` profile. Invoke a tool only when its command or script is present in the current checkout; otherwise perform the measurable parts directly and report the missing capability.
4. Prefer a measured catalog recipe when its role, source tier, and target profile match. Record `unresolved` instead of filling unknown dynamic values by intuition.
5. Express alignment, symmetry, repeated sizing, and equal gaps as IR constraints through `mcbe-json-ui-ir-authoring`.
6. Use `mcbe-json-ui-tools-runner` for the available solve, compile, render, diff, and validation stages. Treat the internal preview as a deterministic approximation, not a Bedrock emulator.
7. Report the evidence, numeric decisions, generated artifacts, validation results, and remaining Bedrock checks.

## Design rules

- Establish the root and content box before placing children.
- Use one spacing rule for a repeated row or grid unless the evidence shows a deliberate exception.
- Size labels from their available region and test the normal string, a 30% longer Korean string, and a long English string.
- Verify default, hover, pressed, and locked visuals when those states exist.
- Preserve image aspect ratio unless stretching is explicitly intended; use verified nine-slice metadata for resizable frames.
- Do not call a visual result exact when the source image has unknown crop, GUI scale, or viewport.
