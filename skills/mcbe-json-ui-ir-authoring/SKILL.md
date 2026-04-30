---
name: mcbe-json-ui-ir-authoring
description: Use when the user asks for layout, positioning, alignment, symmetry, equal spacing, or pixel-correct sizing of Bedrock JSON UI elements. Translates the user's intent (prompt or annotated image) into the IR YAML described in docs/41-ir-spec.md and schemas/ir.schema.json. Pairs with mcbe-json-ui-tools-runner to compile the IR into JSON UI.
---

# MCBE JSON UI IR Authoring

Use this skill when **the user's primary need is correct layout** — positions, sizes, alignment, symmetry, gaps. For dynamic bindings, animations, or Script API wiring, use the knowledge layer skills (`mcbe-json-ui-logic`, `mcbe-json-ui-hud-and-chat`, etc.) instead, then patch the compiled `ui.json` directly.

For new UI planning where the user has not supplied a complete spec, read `../../docs/52-json-ui-intake-questionnaire.md` first, then translate the chosen layout constraints into IR.

## When to choose IR vs raw JSON

| User said | Use IR |
| --- | --- |
| "build a HUD/panel/form like this image" | Yes |
| "center this", "make these symmetric", "equal spacing", "align these" | Yes |
| "fix the layout / nothing lines up" | Yes |
| "add a binding", "wire it to my PMMP form", "animate this on focus" | No — edit `ui.json` directly using knowledge layer |
| "explain why this isn't loading" | No — knowledge layer first |

If unsure, ask the user one short question.

## Workflow

1. Identify the **target screen** name (snake_case).
2. Decompose the requested layout into **elements** (panel/image/label/button/stack_h/stack_v/scroll).
3. Choose `base_resolution` (default `[1920, 1080]`) and `gui_scale` (default `3`).
4. For `root` and each element, declare **px-only** `pos` and `size`. If the final Bedrock JSON must use `%`/`%c`/`fill`, solve with equivalent pixels first and add those dynamic units during the hand-finish JSON patch.
5. Add **constraints** for every intent the user expressed or that is visually obvious:
   - left/right or top/bottom pair → `symmetric_x` / `symmetric_y`
   - row/column of repeating items → `same_size` + `equal_gap_x` / `equal_gap_y`
   - centered row/cluster → `center_group_x` / `center_group_y` after equal-gap and same-size constraints
   - any "aligned with" intent → `align_x` / `align_y`
   - exact edge match → `edge_eq`
   - exact offset between edges → `edge_offset` with `delta`
6. Save as `workspace/<screen>/ir.yaml`.
7. Hand off to `mcbe-json-ui-tools-runner` (or directly call `node tools/run.mjs`).

## Hard rules

- Pixels in IR. Never put `%`, `%c`, `%cm`, `fill`, or `default` into solver-stage `size` values; add dynamic Bedrock units only after `solved.json` is stable.
- Every visible pair/row/group with implied symmetry or alignment **must** declare a constraint. Do not rely on hand-tuned `pos` values.
- Every centered row or card cluster **must** declare `center_group_x` or `center_group_y`; do not eyeball the group's first `pos`.
- Constraint ids must reference existing `elements`. No floating ids.
- Do not edit the compiled `ui.json` to fix layout. Edit `ir.yaml` and recompile.
- Bindings, animations, and Script API are out of scope for IR. Add them to the compiled `ui.json` afterward as a separate patch.
- The solved layout from `solved.json` or compiled `ui.json` is the geometry source of truth. Do not reinterpret or approximate positions/sizes during the hand-finish phase.
- Treat `report.json` geometry warnings as layout failures unless the IR intentionally defines a clipped viewport.

## Output expectations

Hand back:

- the path to `workspace/<screen>/ir.yaml`
- a one-paragraph explanation of which constraints were declared and why
- a note on which knowledge-layer skill should run **next** if bindings/animation are also needed

## References

- `references/intent-to-constraint.md`
- `../../docs/41-ir-spec.md`
- `../../schemas/ir.schema.json`
