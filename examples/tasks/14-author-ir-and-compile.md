# Task: Author IR and run the kit pipeline end-to-end

## Goal

Take a written layout brief and produce a validated, layout-only Bedrock JSON UI screen using the kit's tools layer.

## Recommended skills

- `mcbe-json-ui-self-bootstrap` (only if `.agent/state/setup-state.json` is missing)
- `mcbe-json-ui-ir-authoring`
- `mcbe-json-ui-tools-runner`

## Steps

1. Verify or perform self-bootstrap (`tools/setup.mjs`).
2. Pick a snake_case `<screen_name>`.
3. Run `node tools/init-project.mjs <screen_name>` to scaffold `workspace/<screen_name>/ir.yaml`.
4. Edit `ir.yaml` per the brief:
   - elements with px `pos`/`size`
   - constraints for every symmetry / alignment / equal-spacing / equal-sizing intent
5. Run `node tools/run.mjs workspace/<screen_name>/ir.yaml`.
6. Open `workspace/<screen_name>/report.json`. If `ok=false`, fix `ir.yaml` (never `ui.json`) and rerun.
7. Hand back to the user:
   - `workspace/<screen_name>/ir.yaml`
   - `workspace/<screen_name>/ui.json`
   - report warnings (if any)
   - explicit note about which knowledge-layer skill should run next if bindings/animation are needed (`mcbe-json-ui-logic`, `mcbe-json-ui-hud-and-chat`, `docs/17/19/33–36`)

## Files to inspect first

- `docs/41-ir-spec.md`
- `docs/42-tools-reference.md`
- `examples/ir/centered_modal.yaml` (canonical small example)

## Expected result shape

```
workspace/<screen_name>/
  ir.yaml
  solved.json
  ui.json
  report.json
```
