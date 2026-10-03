---
name: mcbe-json-ui-visual-design
description: Design Minecraft Bedrock game UI, select cartoon pixel, fantasy RPG, clean pixel or Cozy 16x16 styles, and verify layout, typography, surfaces and input states. Use for visual direction and game interface critique; use a data-flow skill for bindings.
---

# MCBE JSON UI Visual Design

Turn a screenshot, working screen, or catalog recipe into explicit layout decisions before JSON UI is compiled.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

For text, input, controller focus or touch accessibility research, retrieve `node tools/research-context.mjs context --topic game-ui-input` when this checkout is available. Apply the selected source to the requested interface and verify the actual interaction; avoid loading unrelated research topics.

## Contract

- Input: target screen and files, device profile, reference image or working UI evidence, allowed textures, and required text/state variants.
- Output: measured design basis, geometry and text constraints, chosen recipe IDs when available, IR handoff, previews, and unresolved items.
- Success: every important size and alignment is traceable to evidence or an explicit constraint; static results have no unintended clipping or overlap; runtime-only claims remain unverified until Bedrock testing.

## Workflow

For style selection or game UI design, first read [references/style-selection.md](references/style-selection.md). It provides a small context query and a portable fallback. Read [references/design-skill-adapters.md](references/design-skill-adapters.md) only when a reviewed external design method helps the specific decision.

For a direction or brief only, return the selected style and relevant game UI decisions here. Continue into the numbered measurement/implementation workflow only when actual layout, assets or validation are requested.

When choosing a pixel-art production method, query `design.library methods`, then `method --method ID --style ID` from the checkout. The method is an optional authored adaptation; keep layout decisions here and hand actual asset work to `mcbe-json-ui-texture-design`.

1. Read [references/measured-layout-workflow.md](references/measured-layout-workflow.md).
2. Inspect the target screen, its inherited controls, referenced textures, adjacent nine-slice metadata, and available vanilla/font/device profiles.
3. If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-visual-design` profile. Invoke a tool only when its command or script is present in the current checkout; otherwise perform the measurable parts directly and report the missing capability.
4. Prefer a measured catalog recipe when its role, source tier, and target profile match. Record `unresolved` instead of filling unknown dynamic values by intuition.
5. Express alignment, symmetry, repeated sizing, and equal gaps as IR constraints through `mcbe-json-ui-ir-authoring`.
6. Use `mcbe-json-ui-tools-runner` for solve, compile, preview, diff, and validation. For an integrated RP, hand off state rendering, installed-profile checks, screenshot calibration, and evidence-backed patch proposals to `mcbe-json-ui-final-rp-inspection`.
7. Inspect every generated preview report. Unresolved texture roots, unsupported controls/properties, or diagnostics invalidate the affected visual claim; placeholder rectangles are not acceptable evidence.
8. Report the evidence, numeric decisions, generated artifacts, validation results, and remaining Bedrock checks.

## Design rules

- Establish the root and content box before placing children.
- For a set of reference screens, define a structural signature for each screen before styling: major regions, fixed versus dynamic collections, scroll owner, card topology, header shape, and action placement. Assert that the intended distinct screens have distinct signatures; a palette, texture, or title swap alone is not a new layout.
- Share a shell or component only where the references actually share it. If one reference changes the hierarchy or silhouette (for example, a centered modal header versus an angled brand header), give it a dedicated control composition instead of forcing the shared template.
- Distinguish baked artwork from live controls before measuring. If a socket, separator, label, or button surface is already present in the background, do not stack a second full surface over it without a deliberate mask or cutout.
- Use one spacing rule for a repeated row or grid unless the evidence shows a deliberate exception.
- Size labels from their available region and test the normal string, a 30% longer Korean string, and a long English string.
- Verify default, hover, pressed, and locked visuals when those states exist.
- Compare state textures by visual family as well as file existence. Hover and pressed art must preserve the control's intended silhouette, scale, padding, and style unless a deliberate change is documented.
- Preserve image aspect ratio unless stretching is explicitly intended; use verified nine-slice metadata for resizable frames.
- Do not call a visual result exact or guess coordinates when its Minecraft font/vanilla profile, viewport, GUI scale, safe area, crop, or screenshot calibration is unresolved.
- Do not claim final server-form placement or state correctness without screenshots from the actual Bedrock screen. Static pack checks and the standalone preview are insufficient for collection-driven and inherited controls.
- Treat a full-width black line, unexplained strip, or clipped band as an ownership/clip diagnostic. Inspect inherited scroll viewport backgrounds, fill children, clipping bounds, and baked texture pixels before changing offsets.
- Reserve non-overlapping regions for price, quantity, icon, name, and discount text. Compare rendered alpha bounds, not only declared rectangles; transparent padding can make an icon cover text even when boxes appear separate.
- Treat external editor output as fixture evidence, not the visual or runtime authority.
