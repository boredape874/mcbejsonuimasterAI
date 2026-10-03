# Tools Output → Handcrafted UI Workflow

> **Choose authority by claim:** see [source priority](04-source-priority.md). Official documentation and pinned samples establish names and versioned examples; the target client and Content Log establish runtime behavior.
>
> Tools (`tools/run.mjs`, `tools/validate.mjs`, etc.) produce solved coordinates and structural checks within their supported scope. Local docs and `references/source-packs/*` provide implementation patterns. Neither alone proves that the target client loads, renders and accepts input correctly.
>
> When tool output and a documented pattern disagree, inspect the original versioned source and reproduce the relevant behavior. Record unresolved claims; do not promote a local workaround into a universal engine rule.

When the user says "참고만 해서 다시 만들어달라" / "skills 기반으로 마감해 달라" / wants a production-ready resource pack file, **the compiler output is a coordinate truth, not the final artifact**. The AI must hand-finish the JSON UI applying the rules in `docs/14`, `docs/19`, `docs/26`, `docs/40`, and `skills/mcbe-json-ui-vanilla-presets`.

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
| Scope | Preserve the target vanilla screen shell and use a verified inner-content change. Check file path, registration and target-array ownership before a modification. A local insertion failure does not establish a ban on cross-namespace inheritance; see `docs/26-common-failure-modes.md`. |
| Routing | Use a stable hidden title prefix (e.g. `customUI_<PackName>_`). Gate every replacement child by a view-binding on `#title_text` that matches the reference pattern in `docs/26` and `docs/40`. |
| Buttons | Provide `default_control` / `hover_control` / `pressed_control`. Set `sound_name: ui.click`. Reuse `common.button` / `common.close_button` via `@` extends when shape allows (confirmed from official bedrock-samples v1.26.50.4: the vanilla close button is `common.close_button`, driven by `$close_button_to_button_id`; `common.cancel_button` does not exist). |
| Backgrounds | Prefer vanilla nineslice textures (`dialog_background_opaque_dark`, `panel_top_dark`, `Black`, `White`) with `alpha`. Do not invent texture paths. (`docs/14` "verified vanilla assets") |
| Bindings | Only use names confirmed in `docs/19` / `docs/34`. Minimize binding count. |
| Variables | Expose tunables as `$variable` so Script API, server payload adapters, or future themes can override without editing the screen file. |
| Entry point | Expose a single root `main_screen_content` (or similarly-named) panel. The router file inserts only that one node. |
| Reference cross-check | **Before declaring done**, open the closest matching file in `references/source-packs/*` and confirm your structure matches its conventions. If it does not, either change yours to match or document why in this doc. |

## When Stage B is *not* needed

- Internal smoke / preview screens (use the compiler output as-is).
- Pure layout-debug iterations.
- Tests in `examples/ir/` and `tests/run-all.mjs` (compiler output is the assertion target).

## Reference pairs (READ-ONLY, do not copy wholesale)

For Stage B patterns, study these versioned references and verify their assumptions against the target pack/client:

- `references/source-packs/modern-cloud-ui-reference/ui/server_form.json` — `customUI_*` title-prefix factory routing, `form_filter_text` + `form_type` view bindings, `main_screen_content` wholesale-replace pattern.
- `references/source-packs/rpg-server-ui-reference/ui/server_form.json` — compact RPG menu routing via `menu.*` markers.

Do not import these into the kit as `examples/`; they are upstream references. Each project should hand-author its own RP files using docs + references as the spec.

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
4. ✅ Routing matches a real reference: cross-checked against `references/source-packs/modern-cloud-ui-reference/ui/server_form.json` or `references/source-packs/rpg-server-ui-reference/ui/server_form.json` (or another named in `docs/40`).
5. ✅ Modification targets and inherited bases resolve from the actual registered pack stack; unsupported renderer cases remain explicit and the target client is checked (`docs/26`).
6. ✅ No invented texture paths (cross-checked against `references/official/bedrock-samples-ui` or vanilla index).
7. ✅ README in the working pack explains both stages and how to re-run them.

## Why this doc binds the AI

`tools/validate.mjs ok=true` only proves: the JSON parses, the schema fields are valid, no obvious anchor/font/binding-shape errors. It does **not** prove:

- the file will actually render in-game
- the texture path exists in the active resource pack stack
- a `@`-base reference will resolve at runtime
- a Bedrock parser quirk will not reject the construct

Use documented patterns and source files to diagnose these failures, then check the final pack's dependency graph and the target client. Runtime claims require actual screenshots, input results and a fresh Content Log. Report static, local-render and Bedrock runtime evidence separately.
