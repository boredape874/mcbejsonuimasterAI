# V2 Offline Evaluation Fixtures

`offline/tasks.json` is the fixed structural and visual task manifest. Fixtures cover long Korean, long English, unbroken tokens, normalized JSON UI colors, and stable default/hover/pressed button geometry.

Run `node evals/validate-examples.mjs` for the deterministic example-pack gate. It checks JSON and JavaScript syntax, `_ui_defs`, texture and nine-slice resolution, PNG headers, explicit label sizes, button states, normalized colors, license evidence, and visible-control-to-IR traceability.
