---
name: mcbe-json-ui-master
description: Route broad or end-to-end Minecraft Bedrock JSON UI work to the smallest applicable specialist skill. Use when a request crosses layout, data flow, forms, HUD, assets, pack integration, and validation, or when ownership is unclear.
---

# MCBE JSON UI Master

Use this skill as a short router. Once the request is classified, read only the selected specialist skill and the references it explicitly requires.

## Route by primary need

| Need | Skill |
| --- | --- |
| proportions, position, size, spacing, typography, visual states | `mcbe-json-ui-visual-design` |
| pixel geometry and IR constraints | `mcbe-json-ui-ir-authoring` |
| solve, compile, render, diff, validate | `mcbe-json-ui-tools-runner` |
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

## Contract

- Input: target pack or files, requested behavior, reference material, and runtime constraints that are actually available.
- Output: selected specialist skill or skills, owned file layer, intended evidence, and validation boundary.
- Success: the work names exact RP/BP files, does not invent properties or assets, and distinguishes static validation from Bedrock runtime proof.

If `data/skill-tool-profiles.json` exists, inspect the `mcbe-json-ui-master` entry only to discover registered orchestration commands. Never assume a listed command exists: confirm its path or package script before invoking it. The router itself does not require a tool call.

## Boundaries

- This repository's core router is Minecraft Bedrock Edition only.
- Keep `_ui_defs.json`, `server_form.json`, and `hud_screen.json` focused on registration or insertion; place feature bodies in dedicated files.
- For layout, treat solved IR as geometry source of truth and fix geometry in IR rather than compiled JSON.
- Verify exact binding, property, and texture names from repository evidence; mark unresolved values instead of guessing.
- Preserve restricted local source names and paths outside public output.
