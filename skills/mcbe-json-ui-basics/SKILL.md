---
name: mcbe-json-ui-basics
description: Explain the fundamentals of Minecraft Bedrock JSON UI in practical addon terms. Use when Codex must teach or reason about what a resource pack is, how JSON UI files are loaded, what `_ui_defs.json` and screen files do, how screens differ from templates, how Bedrock layout works across device sizes, or when a task is beginner-oriented and needs a correct mental model before implementation.
---

# MCBE JSON UI Basics

Use this skill when the task first needs the Bedrock mental model.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Contract

- Input: the user's current understanding and the concrete pack or screen question.
- Output: a Bedrock-specific explanation tied to actual RP files and a clear next specialist when implementation begins.
- Success: requirements, common patterns, and runtime-dependent behavior are not conflated.

If `data/skill-tool-profiles.json` exists, the `mcbe-json-ui-basics` entry may identify read-only lookup helpers. Explanation does not require a tool; do not invoke commands that are absent from the checkout.

## Workflow

1. Read `references/basics-map.md`.
2. Explain Bedrock JSON UI in resource-pack terms, not generic web UI terms.
3. Prefer practical rules over fake certainty.
4. State clearly when a rule is a hard requirement, a common pattern, or only a convenient authoring habit.

## Hard rules

- Do not claim Bedrock has one fixed screen size.
- Do not describe JSON UI files as isolated from the rest of the resource pack.
- Do not treat schema validation as proof that the UI will render correctly.
- If the user moves from basics into a concrete implementation, route to `mcbe-json-ui-master` or the narrower specialized skill.
