# 66 — Layout Solver Go Migration Plan

The solver is now split between Node orchestration and a Go geometry core:

- `tools/_lib/solver.mjs`
- `tools/go/solver`
- `tools/_lib/go-solver.mjs`
- `tools/solve.mjs`
- `tools/run.mjs`

Node still owns YAML loading, schema validation, auto-sizing, compilation, validation reports, and fallback behavior. Go owns the deterministic fixed-point geometry solve when available.

## Why not rewrite everything at once?

The Node toolchain already validates IR, compiles Bedrock JSON UI, runs report generation, and is covered by `tests/run-all.mjs`. Replacing the full pipeline in one pass would risk regressions in working flows.

Use a staged migration:

```text
Stage 1: strengthen Node solver + validator
  center_group_x/y
  parent overflow audit
  static label fit audit
  solver log warnings in report.json

Stage 2: implement Go solver with identical input/output [done]
  read applied IR JSON
  emit solve result JSON
  pass all existing Node solver tests

Stage 3: dual-run mode [done]
  MCBEKIT_SOLVER=node node tools/solve.mjs ...
  MCBEKIT_SOLVER=go node tools/solve.mjs ...
  compare rects and logs

Stage 4: make Go the default when parity is proven [done as auto mode]
  MCBEKIT_SOLVER=auto is the default
  Go is used when available, Node is used as fallback
```

## Accuracy rule for AI agents

For layout-heavy work, the AI must not directly author final Bedrock JSON UI coordinates.

Required workflow:

```text
prompt/image/spec
  -> IR YAML
  -> tools/run.mjs
  -> solved.json + report.json
  -> hand-finish only bindings, animations, factories, and server contracts
```

If `report.json` contains a geometry warning, fix `ir.yaml` and rerun the tools unless the warning is an explicitly documented clipped viewport.

## Go target behavior

The Go solver preserves these contracts:

- same `schemas/ir.schema.json` semantics
- same `solved.json` output schema
- no Bedrock-specific behavior guessed inside the solver
- no bindings, animations, or server form logic in the solver
- deterministic pixel rects matching Node output
- exact tests for alignment, same size, equal gaps, group centering, symmetry, edge offsets, root rects, auto-sized controls, and Go/Node parity

The Go implementation should focus on geometry only. JSON UI authoring remains a two-stage process: computed geometry first, Bedrock-specific hand finish second.

## Current backend selection

```powershell
# default: Go when available, Node fallback
node tools/solve.mjs workspace/example/ir.yaml workspace/example/solved.json

# force Go
$env:MCBEKIT_SOLVER='go'; node tools/solve.mjs workspace/example/ir.yaml workspace/example/solved.json

# force Node fallback solver
$env:MCBEKIT_SOLVER='node'; node tools/solve.mjs workspace/example/ir.yaml workspace/example/solved.json
```

`solved.json` includes `"solver": "go"` or `"solver": "node"` so downstream tooling and debugging can see which backend produced the geometry.
