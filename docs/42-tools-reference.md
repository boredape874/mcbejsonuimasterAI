# 42 — Tools Reference

Authoritative input/output for every Node CLI under `tools/`.

All tools:

- read inputs only from inside the repository
- write outputs only inside the repository
- never call sudo, never modify global state
- emit human-readable logs, or JSON logs when `MCBEKIT_LOG=json` is set

## tools/setup.mjs

Idempotent self-bootstrap. Used by AI on first open of the repo.

| Step | Effect |
| --- | --- |
| Node check | exits 2 if `< 18.17` |
| `npm install` | retries with `--omit=optional` on failure |
| `workspace/`, `vanilla-index/cache/`, `.agent/state/` | created |
| `tools/build-vanilla-index.mjs` | run if upstream mirror is present |
| `.agent/state/setup-state.json` | written |

Exit codes: `0` ok, `1` unexpected, `2` Node too old, `3` npm install failed.

## tools/doctor.mjs `[--quick] [--fix] [--verbose]`

Health checks. `--quick` is intended for the start of any non-trivial AI task.

| Mode | Behavior |
| --- | --- |
| default | full check, exit 4 on failures |
| `--quick` | fewer checks, always exit 0 |
| `--fix` | runs whitelisted remediation (`npm install`, `tools/setup.mjs`, `tools/build-vanilla-index.mjs`) |
| `--verbose` | prints full result list |

## tools/init-project.mjs `<name>`

Creates `workspace/<name>/ir.yaml` from a starter template. Refuses to overwrite an existing IR.

## tools/ir-validate.mjs `<ir.yaml>`

- JSON Schema validation against `schemas/ir.schema.json`.
- Cross-reference checks (parent ids, constraint ids).
- Solver-stage unit policy enforcement. `root.size` and element `size` values must be numeric pixels for `tools/run.mjs`; dynamic Bedrock units are added after solving.

Exit codes: `5` schema error, `6` cross-ref error, `64` usage.

## tools/solve.mjs `<ir.yaml> <solved.json>`

Computes the absolute pixel root rect, computes child rects relative to that root, then iterates declared constraints to a fixed point (≤ 32 iterations). The default solver mode is `auto`: use the Go solver when `go` is available, otherwise fall back to the Node solver. Force a backend with `MCBEKIT_SOLVER=go` or `MCBEKIT_SOLVER=node`.

Supported constraints include alignment, equal sizing, equal gaps, pair symmetry, whole-group centering (`center_group_x/y`), and edge equality/offset. Emits `solved.json` with:

```json
{
  "schema": "mcbe-jsonui-ai-kit/solved@1",
  "namespace": "...", "screen": "...",
  "base_resolution": [w, h],
  "solver": "go",
  "converged": true,
  "iterations": 3,
  "rects": { "id": { "x": …, "y": …, "w": …, "h": … } },
  "log":   [ { "op": "symmetric_x", "ids": ["a","b"] }, … ],
  "elements": [...], "root": {...}
}
```

Exit codes: `7` non-converged (still writes file), other shared codes as above.

## tools/go/solver

Go implementation of the deterministic layout solver. It receives the normalized IR JSON on stdin and writes the solve result JSON on stdout. It is intentionally limited to geometry: YAML parsing, schema validation, auto-sizing, compilation, and report generation remain in Node.

## tools/compile.mjs `<solved.json> <ui.json>`

Converts solved IR back into a Bedrock JSON UI file. `root_panel` is full screen by default, or uses the solved `root` rect when the IR overrides root size/anchor/pos. Each element becomes one named control with `anchor_from = anchor_to = <element.anchor>` and `offset` derived from the solved rect. Children are wired via `controls: [{ "name@ns.name": {} }]` arrays.

Exit code `8` if input is not a solved IR file.

## tools/validate.mjs `<ui.json> [<solved.json>]`

Structural sanity checks on the compiled JSON UI: namespace, root_panel, types, anchor enums, control reference shapes. When a `solved.json` path is provided, it also audits geometry risk: parent overflow, non-positive sizes, static label height/width, and solver constraint errors. Writes a sibling `report.json`.

Exit code `9` on validation failure.

## tools/run.mjs `<ir.yaml> [--out <dir>]`

Runs ir-validate → solve → compile → validate. Default output directory is the IR's directory. Writes `solved.json`, `ui.json`, `report.json`. Exits with the failing step's code; treats `7` (non-converged) as a warning and continues.

## tools/build-vanilla-index.mjs `[--force]`

Walks `references/upstreams/MCBVanillaResourcePack/ui/` and `references/official/bedrock-samples-ui/ui/` (if present) and builds:

- `vanilla-index/screens.json` — screen name → list of `{source, path}`
- `vanilla-index/textures.json` — texture key → list of `{source, path}`

Both are gitignored.

## tools/render.mjs (optional) `<ui.json> [<solved.json>] [--no-image]`

Always writes a sibling `coords.json` mapping control name to final pixel rect from `solved.json`. With `@napi-rs/canvas` installed, also writes sibling `preview.png`. **Not** a substitute for in-game testing.

## tools/diff.mjs (optional) `<a.png> <b.png>`

Requires `pixelmatch` + `pngjs`. Region-aware diff with `--ignore-aa`, `--scale`, `--regions` flags. Writes a sibling `diff.png` and prints summary stats.
