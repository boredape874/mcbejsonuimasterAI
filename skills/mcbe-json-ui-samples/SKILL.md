---
name: mcbe-json-ui-samples
description: Mine working Minecraft Bedrock JSON UI packs into traceable patterns while preserving source tier, license, revision, and redistribution limits. Use for sample comparison or corpus-backed pattern extraction, not unsupported copying.
---

# MCBE JSON UI Samples

Extract the smallest reusable pattern from configured RP/BP evidence.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

For the registered public packs, libraries and tools (player-model form, collection browser, maid addon, avatar form kit, StarLib, the community name lists and the JSON UI dumper) read [community UI packs](references/community-ui-packs.md): it records what each pinned source shows, its license boundary and the names that failed the vanilla check. For an existing indexed asset library, use [local asset learning](references/local-asset-learning.md). Scan eligible text once, preserve actual coverage and hashes, then retrieve one need/role. This path does not require rebuilding the source library or loading the entire catalog into context.

## Contract

- Input: source ID or pack root, target screen or behavior, intended output visibility, and the pattern question.
- Output: source validation status, selected evidence files, dependency trace, extracted pattern, source tier, and redistribution decision.
- Success: the pattern remains traceable to its source and dependencies, private inputs stay local-only, and no unsupported promotion or redistribution occurs.

## Workflow

1. Read [references/source-evidence-workflow.md](references/source-evidence-workflow.md).
2. In `data/skill-tool-profiles.json`, find the record in `profiles` whose `skill` is `mcbe-json-ui-samples`; the file is not keyed by skill name.
3. If `tools/skill-doctor.mjs` exists, inspect the profile and every selected tool status first. Never execute a stage marked `planned` or unavailable.
4. For external research sources, inspect the source/revision/license record with an available registered tool or directly read the configured evidence. Download only selected pinned sources within the user's authorization and never execute their code. When all corpus stages are implemented and their inputs exist, use the fixed order: `sources.validate` -> `source.scan` -> `catalog.build` -> `design.search`.
5. Before opening a large checkout, use the available design or pattern search and open only the selected case's evidence paths. If no index exists, search the relevant source narrowly. A retrieved case is static pattern evidence, not runtime proof.
6. If the pipeline is unavailable, perform read-only analysis of already configured evidence and report that no corpus or catalog artifact was generated.
7. Route selected geometry to `mcbe-json-ui-visual-design` or `mcbe-json-ui-ir-authoring`; route RP/BP dependencies to `mcbe-json-ui-addon-integration`.

## Boundaries

When present, `tools/design-library.mjs context --style ID --role inventory` retrieves small source-backed pattern cards; `data/bedrock-source-patterns.json` and `docs/73-bedrock-source-review.md` hold the reviewed BP→RP→response traces. Verify the selected paths against `config/design-research-lock.json`; avoid opening the full corpus for a single pattern. New source snapshots do not replace older compatibility fixtures without a separate review.

- Development packs and local asset libraries are read-only inputs.
- `quarantine` sources are local search evidence only and never automatic recommendations.
- `local-only`, `metadata-only`, and `prohibited` content must not be copied into public output.
- A statically working sample is not automatically `gold`; runtime evidence is required for that tier.
