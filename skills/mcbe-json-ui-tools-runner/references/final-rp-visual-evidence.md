# Final RP visual evidence

Use this reference when generated JSON UI is copied, adapted, or integrated into a real resource pack, especially through `server_form.json`.

## Capability boundary

`preview.texture` flattens the compiled IR artifact and is evidence for approximate geometry and supported texture states only. The final-RP resolver and renderer inspect the target pack graph, cross-file inheritance, fixtures, target-first textures, and supported states. Neither renderer executes the Bedrock client, live bindings, collections, or input dispatch.

If the preview input is a workspace `ui.json` rather than the final RP screen file, explicitly record that they are different artifacts. Never use the workspace preview to certify the final RP composition.

## Required evidence ladder

For an integrated RP screen, gather and label evidence independently:

- `geometry`: IR validation, solved rectangles, constraint tolerances, clipping report.
- `approximatePreview`: preview report, contact sheet, unresolved textures, unsupported properties and controls.
- `packStructure`: final RP file path, `_ui_defs.json`, route/entry file, namespace references, texture existence, and nine-slice sidecars.
- `runtime`: Bedrock screenshots and content-log excerpt.

An empty or missing evidence level is not a pass. Record it as `not run` or `unresolved`.

Before a final-RP comparison can support pixel-level or text-fit findings, also require:

- an available installed vanilla profile and available Minecraft font profile;
- a pinned offline upstream compatibility report whose required fixtures are committed `baseline-verified` or reviewed `local-capture-verified`; `pending-local` is unresolved;
- explicit viewport, GUI scale, safe area, and logical size;
- a project-bound screenshot calibration with enough non-collinear correspondences;
- default plus every relevant interaction-state render.

If font, vanilla, or device evidence is unresolved, stop at diagnostics. Never use a system font or guessed coordinates to close the gap.

## Texture-root rule

Run preview against an artifact whose location allows every custom `textures/...` reference to resolve to the intended RP root. If that cannot be arranged, treat each unresolved texture as a blocking preview diagnostic. Do not accept placeholder rectangles as visual evidence and do not substitute a similarly named texture.

Record the preview input file and effective RP root in the report. A renderer that cannot accept or prove the intended RP root must be described as lacking final-pack texture resolution.

## Server-form runtime matrix

Capture the actual Bedrock screen at the target GUI scale:

- default state with no focused control;
- hover/focus for each distinct button family;
- pressed state when it is observable;
- selected and disabled states when present;
- at least one state with live collection/binding data.

For visual comparison, crop each screenshot to the same screen bounds and compare control centers, sizes, gaps, texture family, and state transitions. A state texture that resolves but belongs to a different visual family is still a defect.

Also inspect the content log for `[UI][error]`, unknown properties, missing controls, missing textures, and binding or collection failures.

Create patch proposals only from server-issued validation or screenshot-comparison evidence tied to the current project revision. Each proposal must identify the source file, JSON pointer, old value, new value, property origin, and expected residual. Keep proposals read-only and change source IR when it owns the geometry.

Exports from external editors and builders are compatibility fixtures only. They can exercise anchors, imports, nine-slice metadata, and serialization, but cannot calibrate the renderer or establish runtime correctness.

## Reporting language

- With geometry and pack checks only: `static validation only`.
- With approximation PNGs but unresolved final RP behavior: `approximate preview completed; runtime unverified`.
- With a dependency-complete final-RP state matrix but no Bedrock capture: `final-pack static visual; runtime unverified`.
- Claim final visual/state correctness only after the calibrated runtime matrix and content-log check pass.
