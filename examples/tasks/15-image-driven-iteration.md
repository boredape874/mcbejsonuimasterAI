# Task: Image-driven iteration loop

## Goal

Given a target image, converge the IR until the rendered preview is visually close enough.

## Recommended skills

- `mcbe-json-ui-ir-authoring`
- `mcbe-json-ui-tools-runner`

## Prereqs

- `tools/setup.mjs` succeeded.
- Optional native deps (`@napi-rs/canvas`, `pixelmatch`, `pngjs`) installed; otherwise the loop falls back to numeric review of `solved.json`.

## Steps

1. Ask the user (only if not provided): base resolution, gui_scale, where on the screen the layout sits, whether parent-relative units (`%`/`%c`) are required.
2. Author a first-cut `workspace/<name>/ir.yaml`. For every visually obvious symmetry / alignment / equal spacing in the target image, declare a constraint.
3. Run `node tools/run.mjs workspace/<name>/ir.yaml`.
4. (Optional) `node tools/render.mjs workspace/<name>/ui.json workspace/<name>/solved.json`.
5. (Optional) `node tools/diff.mjs <target> workspace/<name>/preview.png` and read the region report.
6. Propose a delta plan (which IR fields and constraints will change). Show it to the user before editing.
7. Apply the delta, rerun, repeat until: user accepts, or per-region difference < 4 px.

## Stop conditions

- User says stop.
- `solved.json.converged === false` two times in a row → stop and report the conflicting constraint pair.
- Optional native deps unavailable → switch to numeric review of `solved.json` and ask user for sign-off.

## Out of scope

- Color, font, texture authenticity. The kit's renderer is approximate.
- Bindings, animations, Script API.
