---
name: mcbe-json-ui-tools-runner
description: Use to execute the kit's deterministic Node CLI under tools/* (ir-validate, solve, compile, validate, run, build-vanilla-index, init-project, render, diff). Knows the call order, expected exit codes, output files, and how to react to failures by editing the IR rather than the compiled JSON UI.
---

# MCBE JSON UI Tools Runner

Use this skill when the IR is ready (or being iterated) and you need to compile it and validate the result.

## Pipeline (default)

```
node tools/run.mjs workspace/<name>/ir.yaml
```

This runs ir-validate → solve → compile → validate and writes:

- `workspace/<name>/solved.json` — absolute pixel rects + solver log
- `workspace/<name>/ui.json`     — compiled Bedrock JSON UI
- `workspace/<name>/report.json` — validator output

The validator uses both `ui.json` and `solved.json`. Warnings about parent overflow, static label clipping, or solver constraint errors must be reviewed before hand-finishing the JSON UI.

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
node tools/render.mjs workspace/<name>/ui.json workspace/<name>/preview.png
node tools/diff.mjs   target.png workspace/<name>/preview.png
```

`render.mjs` and `diff.mjs` require the optional native dependencies (`@napi-rs/canvas`, `pixelmatch`, `pngjs`). If missing, fall back to numeric review of `solved.json` instead of raster comparison.

## Hard rules

- Never edit `ui.json` to fix layout. Edit `ir.yaml` and recompile.
- Never bypass `tools/run.mjs` to "save time" when the user expects a validated result.
- Always report `report.json` warnings to the user, even if `ok=true`; geometry warnings are treated as layout defects unless intentionally documented.
- For non-layout work (bindings, animations, Script API), hand off to the knowledge layer skills and only then patch `ui.json` as a separate, surgical edit.

## References

- `references/cli-reference.md`
- `../../docs/42-tools-reference.md`
