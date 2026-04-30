# 66 — Layout Solver Go Migration Plan

The current solver is implemented in Node:

- `tools/_lib/solver.mjs`
- `tools/solve.mjs`
- `tools/run.mjs`

It is already the required path for layout-heavy JSON UI work. The next step is not to let the AI hand-write more JSON; the next step is to make the solver stricter and eventually move the deterministic core to Go.

## Why not rewrite everything at once?

The Node toolchain already validates IR, compiles Bedrock JSON UI, runs report generation, and is covered by `tests/run-all.mjs`. Replacing the full pipeline in one pass would risk regressions in working flows.

Use a staged migration:

```text
Stage 1: strengthen Node solver + validator
  center_group_x/y
  parent overflow audit
  static label fit audit
  solver log warnings in report.json

Stage 2: implement Go solver with identical input/output
  read applied IR JSON
  emit solved.json schema mcbe-jsonui-ai-kit/solved@1
  pass all existing Node solver tests

Stage 3: dual-run mode
  node tools/solve.mjs --engine=node
  node tools/solve.mjs --engine=go
  compare rects and logs

Stage 4: make Go the default when parity is proven
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

The Go solver must preserve these contracts:

- same `schemas/ir.schema.json` semantics
- same `solved.json` output schema
- no Bedrock-specific behavior guessed inside the solver
- no bindings, animations, or server form logic in the solver
- deterministic integer pixel rects
- exact tests for alignment, same size, equal gaps, group centering, symmetry, edge offsets, parent overflow, and label fit warnings

The Go implementation should focus on geometry only. JSON UI authoring remains a two-stage process: computed geometry first, Bedrock-specific hand finish second.

