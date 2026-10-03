---
name: mcbe-json-ui-master
description: Route broad or end-to-end Minecraft Bedrock JSON UI work to the smallest applicable specialist skill. Use when a request crosses layout, data flow, forms, HUD, assets, pack integration, and validation, or when ownership is unclear.
---

# MCBE JSON UI Master

Use this only when the request is broad, mixed, or has no clear owner. Exact layout, binding, form, HUD, asset, lookup, or debugging requests go directly to one specialist without loading this router. Keep one primary owner, then expand the ordered supporting route one Skill and one reference at a time.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

For broad resource-pack/addon work use `mcbe-resource-pack-master`. Equipped model UI belongs to `mcbe-attachables-ui`; camera/player geometry UI belongs to `mcbe-geo-ui`; materials, outlines and texture sets belong to `mcbe-resource-pack-rendering`. Preserve the requested surface when a feature spans them.

## Route by primary need

| Need | Skill |
| --- | --- |
| proportions, position, size, spacing, typography, visual states | `mcbe-json-ui-visual-design` |
| style selection, game UI hierarchy/input, cartoon/fantasy/clean/Cozy pixels | `mcbe-json-ui-visual-design` |
| texture appearance, semantic role, state sets, palettes, nine-slice briefs | `mcbe-json-ui-texture-design` |
| pixel geometry and IR constraints | `mcbe-json-ui-ir-authoring` |
| solve, compile, render, diff, validate | `mcbe-json-ui-tools-runner` |
| render or inspect the final integrated RP locally | `mcbe-json-ui-final-rp-inspection` |
| `_ui_defs`, namespaces, insertion, factories | `mcbe-json-ui-foundations` |
| bindings, expressions, string protocols | `mcbe-json-ui-logic` |
| HUD, chat, title, actionbar, scoreboard | `mcbe-json-ui-hud-and-chat` |
| `server_form.json`, title routing, button collections | `mcbe-json-ui-server-forms` |
| native chest slots, chest-style forms, Minato editor projects | `mcbe-json-ui-chest-gui` |
| known reusable implementations | `mcbe-json-ui-patterns` |
| exact property, binding, catalog, or vanilla evidence | `mcbe-json-ui-reference` |
| mine working packs with source and redistribution evidence | `mcbe-json-ui-samples` |
| vanilla textures, atlases, screen names | `mcbe-json-ui-vanilla-assets` |
| RP/BP, scripts, fonts, textures, addon dependencies | `mcbe-json-ui-addon-integration` |
| non-rendering or incorrect runtime behavior | `mcbe-json-ui-debugging` |
| source authority or external evidence | `mcbe-json-ui-research` |
| schema coverage or editor validation | `mcbe-json-ui-schemas` |

Use `mcbe-json-ui-basics` for teaching and `mcbe-json-ui-tooling` only when the editor or authoring workflow itself is the subject.

If the selected specialist and its routed reference still do not cover a legacy deep-corpus lookup, read [references/master-routing.md](references/master-routing.md). Do not open that catalog for ordinary exact-owner work.

For a screenshot, Content Log, or report that mixes several symptoms, read [references/recurring-failure-routing.md](references/recurring-failure-routing.md) first. Route by the earliest broken owner in the chain, not by the most visible artifact. This keeps layout edits from masking registration, collection, state, asset, or data-authority failures.

When a server form mixes control-reference, collection/search, marker, hover/focus, or input failures, keep `mcbe-json-ui-server-forms` as the primary contract owner and use `mcbe-json-ui-debugging` as the follow-on. Add `mcbe-json-ui-addon-integration` only when the data sender, asset pack, or installed-pack identity is part of the failure.

## Route contract

- Input: target pack or files, requested behavior, reference material, and runtime constraints that are actually available.
- Output: `mode`, one `primarySkill`, compatibility `followOnSkill`, ordered `nextRoutes`, one initial reference, intended evidence, and the validation boundary. Do not load all `nextRoutes` together.
- Success: the work names exact RP/BP files, does not invent properties or assets, and distinguishes static validation from Bedrock runtime proof.
- Every routed specialist applies the same evidence-first order (target pack → pinned official samples and `node tools/vanilla-name-check.mjs` → registered sources via `node tools/design-library.mjs sources --source ID` → skill references last, labelled "inferred from skill guidance"). Routing to a skill never replaces that research.

When routing data is available, validate structured intent with `node tools/route-task.mjs`; raw prompt classification is advisory and must not auto-execute at low confidence. Unknown or ambiguous ownership fails closed. Escalation is one-way `quick → standard → deep`, at most twice, without repeating the same command and input hash.

Use `surface: "json-ui"` (or omit it) for JSON UI. The pack router also accepts `resource-pack`, `addon`, `attachables-ui` and `geo-ui`. `supportingKinds` lists specialist tasks in execution order; `nextRoutes` returns `{skill, references}` entries in that order and `followOnSkill` remains the first entry for older callers. Load only the next relevant entry. Unsupported surfaces and unknown kinds must be resolved before execution.

## Boundaries

- This repository's core router is Minecraft Bedrock Edition only.
- Keep `_ui_defs.json`, `server_form.json`, and `hud_screen.json` focused on registration or insertion; place feature bodies in dedicated files.
- For layout, treat solved IR as geometry source of truth and fix geometry in IR rather than compiled JSON.
- Route any pixel-accuracy, final-state, or screenshot-matching claim for an integrated RP through `mcbe-json-ui-final-rp-inspection`. That workflow must resolve a Minecraft vanilla/font profile and a calibrated target-device profile before it may recommend coordinates.
- Verify exact binding, property, and texture names from repository evidence; mark unresolved values instead of guessing.
- Do not treat a search icon, hover texture, animation, or static preview as proof that its input, state transition, or full data scope works in Bedrock.
- Treat external editors as compatibility fixtures and design evidence only. Bedrock screenshots and content logs remain the runtime authority.
- Preserve restricted local source names and paths outside public output.
