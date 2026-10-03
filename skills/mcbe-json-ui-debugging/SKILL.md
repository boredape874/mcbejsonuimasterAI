---
name: mcbe-json-ui-debugging
description: Diagnose Bedrock JSON UI failures. Use when a screen or server form does not render, a control reference or property is rejected, a hover/input state is wrong, bindings or protocol text leak, or static checks disagree with Bedrock runtime.
---

# MCBE JSON UI Debugging

Diagnose from the exact failing control path outward. Do not patch the visible symptom before identifying the owning layer.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Contract

- Input: failing screen, entry files, related UI/BP sender files, exact reproduction, Content Log, and target device/input method.
- Output: evidence-ranked root cause, smallest owning-layer fix, exact checks run, and runtime checks still pending.
- Success: registration, control resolution, collection ownership, bindings, visual state, input, assets, and runtime evidence are separated.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-debugging` entry. Confirm diagnostic commands exist before running them; unavailable checks stay unavailable.

## Workflow

1. Read `references/debugging-map.md` and classify the first target `[UI]` failure by its full control path.
2. Trace `_ui_defs.json` -> namespace -> route/factory -> inherited control -> collection/binding -> input mapping.
3. Compare the failing construct with the closest verified local or vanilla example; never invent a property or event name.
4. Fix the owning layer, re-run focused static checks, then request or inspect Bedrock interaction and a clean target Content Log.

## Required boundaries

- A parsed file or successful static preview is not Bedrock runtime proof.
- Separate unrelated Sound, Animation, and Script noise from the target UI failure.
- Preserve unresolved bindings and states as diagnostics; do not guess their values.
- Keep project-specific title tokens, namespaces, objectives, and hidden markers out of general rules.
