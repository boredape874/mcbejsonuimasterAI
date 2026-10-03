---
name: mcbe-json-ui-patterns
description: Reuse proven Bedrock JSON UI patterns from included sample packs and local utility mirrors. Use when Codex must build or adapt animated progress bars, topbar notifications, scoreboards, chest or pocket containers, quick-container utilities, desktop/touch HUD menus, reusable presets, custom chat panels, static start-screen backgrounds, tablist overlays, text-slicing snippets, or similar recurring Minecraft Bedrock JSON UI patterns.
---

# MCBE JSON UI Patterns

Prefer adapting proven included patterns over inventing a new one.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Contract

- Input: target feature, screen family, data source, and allowed source tiers.
- Output: selected pattern and evidence, minimum structure to adapt, and target-specific substitutions.
- Success: namespace, assets, bindings, protocol, and dependencies are adapted rather than copied blindly.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-patterns` entry. Search the catalog with a registered command only when the command exists; otherwise use the maintained pattern map and label the evidence tier.

## Workflow

1. Read `references/pattern-map.md`.
2. Match the request to the closest pattern.
3. If the local sample packs do not provide a clean minimal example, use the mirrored external examples.
4. Prefer the local utility mirrors when the task is specifically topbar, title-driven bar, split-string, preserve-state, or tablist related.
5. Copy the minimum viable structure.
6. Adjust namespace, texture paths, bindings, and protocol strings to the target pack.

## Pattern priority

1. progress bar
2. topbar or tablist utility
3. scoreboard
4. server form shell
5. custom chest or container
6. custom chat panel
7. large toolkit architecture
