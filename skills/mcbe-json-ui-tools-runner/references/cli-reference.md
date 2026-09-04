# CLI quick reference

| Command | Required args | Output |
| --- | --- | --- |
| `node tools/setup.mjs` | — | `.agent/state/setup-state.json` |
| `node tools/doctor.mjs [--quick|--fix|--verbose]` | — | console |
| `node tools/init-project.mjs --list-templates` | - | template catalog |
| `node tools/init-project.mjs <name> [--template minimal\|rpg_hud\|rpg_menu]` | snake_case name | `workspace/<name>/ir.yaml` |
| `node tools/ir-validate.mjs <ir.yaml>` | path | console |
| `node tools/solve.mjs <ir.yaml> <solved.json>` | in, out | `<solved.json>`; Go solver by default when available, Node fallback |
| `node tools/compile.mjs <solved.json> <ui.json>` | in, out | `<ui.json>` |
| `node tools/validate.mjs <ui.json> [<solved.json>]` | in [, in] | sibling `report.json` |
| `node tools/run.mjs <ir.yaml> [--out <dir>]` | in [, dir] | `solved.json`, `ui.json`, `report.json` |
| `node tools/build-vanilla-index.mjs [--force]` | — | `vanilla-index/{screens,textures}.json` |
| `node tools/render.mjs <ui.json> [<solved.json>] [--no-image]` (optional) | ui [, solved] | sibling `coords.json` and optional `preview.png` |
| `node tools/diff.mjs <a.png> <b.png>` (optional) | a, b | console + sibling `diff.png` |
| `node tools/validate-pack.mjs <pack> [--strict-warnings] [--report <path>]` | resource-pack path | console and optional `pack-report@1` JSON |
| `node tools/audit.mjs [--report <path>]` | - | repository integrity report |
| `npm run check` | - | repository audit and complete test suite |
