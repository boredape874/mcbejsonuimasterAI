---
name: mcbe-json-ui-reference
description: Look up exact Minecraft Bedrock JSON UI control types, properties, bindings, catalog records, and vanilla evidence. Use when an answer must cite a verified name or path instead of inferring from memory.
---

# MCBE JSON UI Reference

Resolve one exact lookup from the smallest authoritative local source.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Contract

- Input: the exact property, control, binding, recipe, screen, texture, or atlas question and the target file context.
- Output: the verified value, evidence path and revision or tier, scope limitations, and an explicit unresolved result when evidence is absent.
- Success: every exact name or path is traceable to a current schema, working sample, catalog record, or vanilla source; inference is never presented as confirmation.

## Workflow

1. Read [references/catalog-lookup.md](references/catalog-lookup.md) and select only the evidence class needed. When the question cites a Microsoft creator table, the official schemas, the Bedrock Wiki documentation page or the community UI research repository, read [references/official-docs-cross-check.md](references/official-docs-cross-check.md) for the 2026-10-03 audit of those tables against the spec and vanilla 1.26.50 (documented-but-absent names, untrusted types, community names not found in vanilla).
2. Read the `mcbe-json-ui-reference` entry in `data/skill-tool-profiles.json` when present.
3. If `tools/skill-doctor.mjs` exists, use it to inspect the profile before invoking a registered tool. A tool or profile marked `planned` or unavailable must not be executed, even if a same-named script exists.
4. Search the verified local source directly when no implemented lookup tool is available.
5. Return `confirmed`, `sample-observed`, `inferred`, or `unresolved` with the evidence location.

## Boundaries

- Schema acceptance is not Bedrock runtime proof.
- A vanilla index proves upstream existence, not ownership by the target RP.
- Catalog matches carry their source tier and redistribution restriction.
- Do not invent a near-looking property, binding, control, or texture path.
