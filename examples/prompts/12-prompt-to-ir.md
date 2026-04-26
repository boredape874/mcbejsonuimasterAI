# Prompt: Prompt → IR

Use this template when the user describes a layout in words and wants pixel-correct positioning, alignment, symmetry, or equal spacing.

```text
Use the kit's tools layer (mcbe-json-ui-ir-authoring + mcbe-json-ui-tools-runner).

Goal: <one sentence describing the screen and its purpose>.

Hard requirements:
- <user's must-haves: dimensions, anchors, symmetry, etc.>
- pixels only (do not enable units.allowPercent unless I say so)
- declare a constraint for every alignment/symmetry/equal-spacing intent (do not hand-tune positions)

Workflow:
1. Author workspace/<screen_name>/ir.yaml.
2. Run: node tools/run.mjs workspace/<screen_name>/ir.yaml
3. Show me ir.yaml + workspace/<screen_name>/ui.json + the warnings array from report.json.
4. If anything fails (exit codes 5/6/7/9), fix ir.yaml (not ui.json) and rerun.

Out of scope for this turn (tell me afterward if needed):
- bindings, animations, Script API, vanilla texture lookups
```
