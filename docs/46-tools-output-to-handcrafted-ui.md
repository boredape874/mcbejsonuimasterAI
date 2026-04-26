# Tools Output → Handcrafted UI Workflow

When the user says "참고만 해서 다시 만들어달라" / "skills 기반으로 마감해 달라" / wants a production-ready resource pack file, **the compiler output is a coordinate truth, not the final artifact**. The AI must hand-finish the JSON UI applying the rules in `docs/14`, `docs/19`, `docs/40`, and `skills/mcbe-json-ui-vanilla-presets`.

## Two-stage authoring

```
Stage A — tools layer
  ir.yaml  →  tools/run.mjs  →  solved.json (rects)  +  ui.json (layout-only JSON UI)

Stage B — handcrafted finish (this doc)
  Read solved.json for sizes/offsets.
  Read skills/ + docs/ for patterns.
  Write the final RP/ui/<screen>.json by hand,
  embedding the same coordinates but with vanilla-quality skin/bindings/sounds.
```

## Required best practices on the handcrafted file

| Concern | Requirement |
|---|---|
| Scope | Modification-only insertion into vanilla files. Never replace `long_form`, `hud_screen`, `chat_screen` wholesale. (`docs/14`) |
| Routing | Use a stable hidden title prefix (e.g. `customUI_<PackName>_`). Insert via a single `view`-binding visibility gate. (`docs/40`) |
| Buttons | Provide `default_control` / `hover_control` / `pressed_control`. Set `sound_name: ui.click`. Reuse `common.button` / `common.cancel_button` via `@` extends when shape allows. |
| Backgrounds | Prefer vanilla nineslice textures (`dialog_background_opaque_dark`, `panel_top_dark`, `Black`, `White`) with `alpha`. Do not invent texture paths. (`docs/14` "verified vanilla assets") |
| Bindings | Only use names confirmed in `docs/19` / `docs/34`. Minimize binding count. |
| Variables | Expose tunables as `$variable` so PMMP / ScriptAPI / future themes can override without editing the screen file. |
| Entry point | Expose a single root `main_screen_content` (or similarly-named) panel. The router file inserts only that one node. |

## When Stage B is *not* needed

- Internal smoke / preview screens (use the compiler output as-is).
- Pure layout-debug iterations.
- Tests in `examples/ir/` and `tests/run-all.mjs` (compiler output is the assertion target).

## Example pair shipped with this repo

`examples/handcrafted/simple_server_custom_form/` (mirrors the `요청/` working pack):

- `ir.yaml` — Stage A source (compiles into ui.json).
- `RP/ui/<screen>.json` — Stage B handcrafted finish.
- `RP/ui/server_form.json` — modification-based router with title prefix.
- `BP/scripts/main.js` — uses the title prefix when calling `ActionFormData.title()`.

## Validation

The handcrafted file is JSON UI, not IR. Validate it directly:

```
node tools/validate.mjs ./요청/RP/ui/ssc_form.json
```

The validator will check anchors, font sizes, layer counts, and binding shapes against `data/jsonui-spec.json`, regardless of whether the file was machine-generated or hand-written.

## AI checklist before declaring "done"

1. ✅ `report.json.ok === true` for the IR.
2. ✅ Hand-finished file passes `tools/validate.mjs` (no errors, warnings reviewed).
3. ✅ All buttons in the handcrafted file have 3-state controls + `sound_name`.
4. ✅ Routing is modification-based with a hidden title prefix.
5. ✅ No invented texture paths (cross-checked against `references/official/bedrock-samples-ui` or vanilla index).
6. ✅ README in the working pack explains both stages and how to re-run them.
