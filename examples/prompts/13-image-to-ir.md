# Prompt: Image → IR (with iteration)

Use this template when the user provides a target image and wants the kit to converge on a matching layout.

```text
Use the kit's tools layer (mcbe-json-ui-ir-authoring + mcbe-json-ui-tools-runner).

Target image: <path-or-attachment>
Approximate base resolution: <e.g. 1920x1080>  (ask me if unsure)
Approximate gui_scale: <e.g. 3>                 (ask me if unsure)

Workflow:
1. Read the image and produce a first-cut workspace/<screen_name>/ir.yaml. For every visually obvious symmetry / alignment / equal-spacing pair, declare a constraint instead of hand-tuning positions.
2. Run: node tools/run.mjs workspace/<screen_name>/ir.yaml
3. (If render is available) node tools/render.mjs workspace/<screen_name>/ui.json workspace/<screen_name>/solved.json
4. (If diff is available)   node tools/diff.mjs <target> workspace/<screen_name>/preview.png
5. Show me a delta plan: which IR fields will change, which constraints will be added/relaxed.
6. Apply the plan, rerun the pipeline, repeat until I say stop or differences are < 4 px.

Notes:
- pixels only by default
- never edit ui.json directly to fix layout
- bindings/animation/Script API are a separate follow-up
```
