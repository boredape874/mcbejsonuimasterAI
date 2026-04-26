# Simple Server Custom Form — Stage B example

This folder mirrors the working pack at `요청/` (Korean: "request") at the root of the user's workspace, kept in-repo as a documented template.

It demonstrates the **two-stage workflow** described in `docs/46-tools-output-to-handcrafted-ui.md`:

1. `ir.yaml` is compiled with `node tools/run.mjs ir.yaml` to produce `ui.json` + `solved.json` (coordinates only).
2. `RP/ui/ssc_form.json` is the **hand-finished** JSON UI applying:
   - vanilla nineslice backgrounds (`dialog_background_opaque_dark`, `Black`, `White`)
   - 3-state buttons (`default_control` / `hover_control` / `pressed_control`) with `sound_name: ui.click`
   - extends `common.button`, `common.cancel_button`
   - bindings limited to confirmed names (`#title_text`, `#form_text`)
3. `RP/ui/server_form.json` uses **modification-only** insertion — no wholesale replacement of `long_form` — and gates visibility by title prefix `customUI_SimpleServer_`.
4. `BP/scripts/main.js` calls `new ActionFormData().title("customUI_SimpleServer_Main")…` so the prefix activates the override only for our form.

See `요청/README.md` (in the user's workspace root) for the full table of best-practice mappings to `docs/14`, `docs/19`, `docs/40`.

## Re-create from scratch

```
node tools/run.mjs examples/handcrafted/simple_server_custom_form/ir.yaml
# inspect solved.json for the canonical rects, then hand-edit RP/ui/ssc_form.json
node tools/validate.mjs examples/handcrafted/simple_server_custom_form/RP/ui/ssc_form.json
```
