# Tools Output → Handcrafted UI Workflow

> **Authority order (binding):** `docs/*.md` > `references/source-packs/*` > `tools/*` output.
>
> Tools (`tools/run.mjs`, `tools/validate.mjs`, etc.) produce **coordinate truth and structural sanity** only. They cannot judge whether a Bedrock client will actually load the file. The MD docs (especially `docs/14`, `docs/19`, `docs/26`, `docs/40`, `docs/45`, this doc) and the `references/source-packs/*` files are the **authoritative source** for the final shipped JSON.
>
> When tool output and a documented pattern disagree, **the documented pattern wins**. If you cannot find a documented pattern for the construct you are about to ship, stop and document it first — do not invent.

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
| Scope | Modification-only insertion when possible. For `server_form.json` specifically, **wholesale-replace `main_screen_content`** with prefix-gated `#visible` panels — see `docs/26` "`Type not specified` inside a modification" — because cross-namespace `@` does not work inside `modifications.value`. |
| Routing | Use a stable hidden title prefix (e.g. `customUI_<PackName>_`). Gate every replacement child by a view-binding on `#title_text` that matches the reference pattern in `docs/26` and `docs/40`. |
| Buttons | Provide `default_control` / `hover_control` / `pressed_control`. Set `sound_name: ui.click`. Reuse `common.button` / `common.cancel_button` via `@` extends when shape allows. |
| Backgrounds | Prefer vanilla nineslice textures (`dialog_background_opaque_dark`, `panel_top_dark`, `Black`, `White`) with `alpha`. Do not invent texture paths. (`docs/14` "verified vanilla assets") |
| Bindings | Only use names confirmed in `docs/19` / `docs/34`. Minimize binding count. |
| Variables | Expose tunables as `$variable` so PMMP / ScriptAPI / future themes can override without editing the screen file. |
| Entry point | Expose a single root `main_screen_content` (or similarly-named) panel. The router file inserts only that one node. |
| Reference cross-check | **Before declaring done**, open the closest matching file in `references/source-packs/*` and confirm your structure matches its conventions. If it does not, either change yours to match or document why in this doc. |

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
4. ✅ Routing matches a real reference: cross-checked against `references/source-packs/modern-cloud-ui-reference/ui/server_form.json` or `references/source-packs/rpg-server-ui-reference/ui/server_form.json` (or another named in `docs/40`).
5. ✅ No `@cross_namespace.base` reference appears inside any `modifications[].value[]` tree (`docs/26`).
6. ✅ No invented texture paths (cross-checked against `references/official/bedrock-samples-ui` or vanilla index).
7. ✅ README in the working pack explains both stages and how to re-run them.

## Why this doc binds the AI

`tools/validate.mjs ok=true` only proves: the JSON parses, the schema fields are valid, no obvious anchor/font/binding-shape errors. It does **not** prove:

- the file will actually render in-game
- the texture path exists in the active resource pack stack
- a `@`-base reference will resolve at runtime
- a Bedrock parser quirk will not reject the construct

Those four classes of failure are only caught by:

1. matching against a documented pattern in `docs/*.md`, **and**
2. matching against a working file in `references/source-packs/*`.

That is why this doc declares MD + references as the authoritative source. The tool layer is a measurement device, not a verifier.
