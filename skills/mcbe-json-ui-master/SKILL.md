---
name: mcbe-json-ui-master
description: Route broad or end-to-end Minecraft Bedrock JSON UI work to the smallest applicable specialist skill. Use when a request crosses layout, data flow, forms, HUD, assets, pack integration, and validation, or when ownership is unclear.
---

# MCBE JSON UI Master

Use this only when the request is broad, mixed, or has no clear owner. Exact layout, binding, form, HUD, asset, lookup, or debugging requests go directly to one specialist without loading this router. Start with at most one supporting skill and one reference.

## Route by primary need

| Need | Skill |
| --- | --- |
| proportions, position, size, spacing, typography, visual states | `mcbe-json-ui-visual-design` |
| texture appearance, semantic role, state sets, palettes, nine-slice briefs | `mcbe-json-ui-texture-design` |
| pixel geometry and IR constraints | `mcbe-json-ui-ir-authoring` |
| solve, compile, render, diff, validate | `mcbe-json-ui-tools-runner` |
| render or inspect the final integrated RP locally | `mcbe-json-ui-final-rp-inspection` |
| `_ui_defs`, namespaces, insertion, factories | `mcbe-json-ui-foundations` |
| bindings, expressions, string protocols | `mcbe-json-ui-logic` |
| HUD, chat, title, actionbar, scoreboard | `mcbe-json-ui-hud-and-chat` |
| `server_form.json`, title routing, button collections | `mcbe-json-ui-server-forms` |
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

## Route contract

- Input: target pack or files, requested behavior, reference material, and runtime constraints that are actually available.
- Output: `mode`, one `primarySkill`, at most one follow-on execution skill, one initial reference, intended evidence, and the validation boundary.
- Success: the work names exact RP/BP files, does not invent properties or assets, and distinguishes static validation from Bedrock runtime proof.

When routing data is available, validate structured intent with `node tools/route-task.mjs`; raw prompt classification is advisory and must not auto-execute at low confidence. Unknown or ambiguous ownership fails closed. Escalation is one-way `quick → standard → deep`, at most twice, without repeating the same command and input hash.

## Boundaries

- This repository's core router is Minecraft Bedrock Edition only.
- Keep `_ui_defs.json`, `server_form.json`, and `hud_screen.json` focused on registration or insertion; place feature bodies in dedicated files.
- For layout, treat solved IR as geometry source of truth and fix geometry in IR rather than compiled JSON.
- Route any pixel-accuracy, final-state, or screenshot-matching claim for an integrated RP through `mcbe-json-ui-final-rp-inspection`. That workflow must resolve a Minecraft vanilla/font profile and a calibrated target-device profile before it may recommend coordinates.
- Verify exact binding, property, and texture names from repository evidence; mark unresolved values instead of guessing.
- Treat external editors as compatibility fixtures and design evidence only. Bedrock screenshots and content logs remain the runtime authority.
- Preserve restricted local source names and paths outside public output.
