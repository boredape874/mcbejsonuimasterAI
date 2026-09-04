---
name: mcbe-json-ui-tools-runner
description: Use to execute the kit's deterministic Node CLI under tools/* (ir-validate, solve, compile, validate, run, build-vanilla-index, init-project, render, diff). Knows the call order, expected exit codes, output files, and how to react to failures by editing the IR rather than the compiled JSON UI.
---

# MCBE JSON UI Tools Runner

Use this skill when the IR is ready (or being iterated) and you need to compile it and validate the result.

## Contract

- Input: repository root and IR path, plus target image only when visual diff is requested.
- Output: solved geometry, compiled JSON UI, validation report, and available preview/diff artifacts.
- Success: the deterministic pipeline exits successfully, warnings are reviewed, and optional raster dependencies or unsupported stages are reported explicitly.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-tools-runner` entry and prefer its registered command IDs. Before execution, confirm the referenced script or package script exists; the checked-in commands below remain the fallback source of truth.

## Pipeline (default)

```
node tools/run.mjs workspace/<name>/ir.yaml
```

This runs ir-validate → solve → compile → validate and writes:

- `workspace/<name>/solved.json` — absolute pixel rects + solver log
- `workspace/<name>/ui.json`     — compiled Bedrock JSON UI
- `workspace/<name>/report.json` — validator output

The validator uses both `ui.json` and `solved.json`. Warnings about parent overflow, static label clipping/width risk, or solver constraint errors must be reviewed before hand-finishing the JSON UI.

`tools/solve.mjs` uses `MCBEKIT_SOLVER=auto` by default: Go solver when `go` is available, Node fallback otherwise. Force a backend with `MCBEKIT_SOLVER=go` or `MCBEKIT_SOLVER=node` when debugging parity.

## Step-by-step (for debugging)

```
node tools/ir-validate.mjs workspace/<name>/ir.yaml
node tools/solve.mjs        workspace/<name>/ir.yaml workspace/<name>/solved.json
node tools/compile.mjs      workspace/<name>/solved.json workspace/<name>/ui.json
node tools/validate.mjs     workspace/<name>/ui.json    workspace/<name>/solved.json
```

## Exit codes (fail fast)

| Code | Meaning | Reaction |
| --- | --- | --- |
| 0 | success | continue |
| 5 | IR schema invalid | fix `ir.yaml` per error path |
| 6 | IR cross-reference error (unknown id, etc.) | fix `ir.yaml` |
| 7 | solver did not converge | inspect `solved.json.log`, relax conflicting constraint, do **not** delete user-declared ones silently |
| 8 | bad solved input | rerun pipeline from solve |
| 9 | validate failed | inspect `report.json`, fix root cause in `ir.yaml` |
| 64 | wrong CLI usage | fix the command |

## Optional render + diff (image input loop)

```
node tools/render.mjs workspace/<name>/ui.json workspace/<name>/solved.json
node tools/diff.mjs   target.png workspace/<name>/preview.png
```

`render.mjs` writes `coords.json` and, when optional canvas dependencies are installed, `preview.png` next to `ui.json`. `render.mjs` and `diff.mjs` require the optional native dependencies (`@napi-rs/canvas`, `pixelmatch`, `pngjs`) for raster output/comparison. If missing, fall back to numeric review of `solved.json` and `coords.json`.

This renderer is an **IR/standalone-control approximation**. It resolves controls found in the one JSON file and texture files discoverable by walking upward from that file. It does not currently resolve a complete RP namespace graph, `server_form.json` routing, cross-file inheritance, collection data, bindings, or Bedrock focus/hover dispatch. Therefore its PNG cannot prove that the final installed RP screen or its button states render correctly.

For a screen integrated into an RP, hand off final rendering to `mcbe-json-ui-final-rp-inspection`, read [references/final-rp-visual-evidence.md](references/final-rp-visual-evidence.md), and keep these evidence levels separate:

1. IR geometry: solved rectangles and constraint report.
2. Approximate preview: only the controls, textures, and states the preview report says it resolved.
3. Final RP structure: validation of the installed screen, routes, referenced namespaces, and texture roots.
4. Bedrock runtime: screenshots of the actual default and interacted states plus the content log.

## Hard rules

- Never edit `ui.json` to fix layout. Edit `ir.yaml` and recompile.
- Never bypass `tools/run.mjs` to "save time" when the user expects a validated result.
- Always report `report.json` warnings to the user, even if `ok=true`; geometry warnings are treated as layout defects unless intentionally documented.
- Do not report a screen as visually validated from the IR preview when the implemented RP screen differs from the compiled `ui.json`, or when `preview-report.json` contains unresolved textures, unsupported controls/properties, or diagnostics.
- Do not claim pixel accuracy or recommend final coordinates until an installed vanilla/font profile, pinned upstream compatibility result, target device profile, and screenshot calibration are all available.
- For server-form UI, a runtime screenshot is required before claiming correct hover, pressed, focus, collection, binding, inherited texture, or final placement behavior. Without it, say `static validation only`.
- For non-layout work (bindings, animations, Script API), hand off to the knowledge layer skills and only then patch `ui.json` as a separate, surgical edit.

## References

- `references/cli-reference.md`
- `references/final-rp-visual-evidence.md`
- `docs/42-tools-reference.md`
