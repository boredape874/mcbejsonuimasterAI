---
name: mcbe-json-ui-samples
description: Mine working Minecraft Bedrock JSON UI packs into traceable patterns while preserving source tier, license, revision, and redistribution limits. Use for sample comparison or corpus-backed pattern extraction, not unsupported copying.
---

# MCBE JSON UI Samples

Extract the smallest reusable pattern from configured RP/BP evidence.

## Contract

- Input: source ID or pack root, target screen or behavior, intended output visibility, and the pattern question.
- Output: source validation status, selected evidence files, dependency trace, extracted pattern, source tier, and redistribution decision.
- Success: the pattern remains traceable to its source and dependencies, private inputs stay local-only, and no unsupported promotion or redistribution occurs.

## Workflow

1. Read [references/source-evidence-workflow.md](references/source-evidence-workflow.md).
2. Read the `mcbe-json-ui-samples` entry in `data/skill-tool-profiles.json` when present.
3. If `tools/skill-doctor.mjs` exists, inspect the profile and every selected tool status first. Never execute a stage marked `planned` or unavailable.
4. When all stages are implemented and their inputs exist, use the fixed order: `sources.validate` -> `source.scan` -> `catalog.build` -> `design.search`.
5. If the pipeline is unavailable, perform read-only analysis of already configured evidence and report that no corpus or catalog artifact was generated.
6. Route selected geometry to `mcbe-json-ui-visual-design` or `mcbe-json-ui-ir-authoring`; route RP/BP dependencies to `mcbe-json-ui-addon-integration`.

## Boundaries

- Development packs and local asset libraries are read-only inputs.
- `quarantine` sources are local search evidence only and never automatic recommendations.
- `local-only`, `metadata-only`, and `prohibited` content must not be copied into public output.
- A statically working sample is not automatically `gold`; runtime evidence is required for that tier.
