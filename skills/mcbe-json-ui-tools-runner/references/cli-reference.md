# CLI quick reference

| Command | Required args | Output |
| --- | --- | --- |
| `node tools/setup.mjs` | — | `.agent/state/setup-state.json` |
| `node tools/doctor.mjs [--quick|--fix|--verbose]` | — | console |
| `node tools/init-project.mjs <name>` | snake_case name | `workspace/<name>/ir.yaml` |
| `node tools/ir-validate.mjs <ir.yaml>` | path | console |
| `node tools/solve.mjs <ir.yaml> <solved.json>` | in, out | `<solved.json>` |
| `node tools/compile.mjs <solved.json> <ui.json>` | in, out | `<ui.json>` |
| `node tools/validate.mjs <ui.json> [<solved.json>]` | in [, in] | sibling `report.json` |
| `node tools/run.mjs <ir.yaml> [--out <dir>]` | in [, dir] | `solved.json`, `ui.json`, `report.json` |
| `node tools/build-vanilla-index.mjs [--force]` | — | `vanilla-index/{screens,textures}.json` |
| `node tools/render.mjs <ui.json> <preview.png>` (optional) | in, out | png + sibling `coords.json` |
| `node tools/diff.mjs <a.png> <b.png>` (optional) | a, b | console + sibling `diff.png` |
