---
name: mcbe-json-ui-master
description: Comprehensive Minecraft Bedrock JSON UI master skill. Use when Codex must handle Bedrock JSON UI end to end across basics and mental models, pack structure, HUD, chat, title or actionbar driven UI, server form customization, bindings and string parsing logic, reusable patterns, addon integration, debugging, vanilla texture path lookup, source selection across local sample packs, local utility mirrors, official sample screens, community reference docs, and vanilla resource mirror, or schema and tooling workflows such as JSON UI editors, builders, and schema-based validation.
---

# MCBE JSON UI Master

Use this as the top-level skill for Bedrock JSON UI work.

## Workflow

1. Read `references/master-routing.md`.
   - If local packs, restricted local mirrors, community snippets, community chat notes, or sample archives are involved, also read `references/reference-governance.md` before reporting sources or copying patterns.
   - If layout, visual polish, size, text scale, alignment, or "make it look like this" is involved, also read `references/visual-fit-discipline.md` before editing.
   - If the task involves reorganizing UI files, naming modules, splitting large JSON UI files, planning nested folders, defining routers, or designing a clean RP folder layout, also read `references/ui-folder-architecture.md`.
   - If visual design direction is involved, also read `references/design-reference-atlas.md` and `references/diagrammatic-workflows.md`.
   - If the user wants a high-quality RPG/game UI, skill screen, HUD status cluster, custom hotbar, or polished texture-backed form, also read `references/high-polish-game-ui-reference.md`.
   - If the task is broad or the right reference is unclear, also read `references/reference-task-taxonomy.md` and `references/hierarchical-task-router.md` before opening examples.
   - If local restricted JSON UI references are relevant and present, read `references/local-json-ui-reference-packs.md` before opening raw restricted files.
   - If the task mentions phone/PDA/device forms, compact routed form suites, reusable button templates, polished shop/store forms, auction/crate/reward forms, battle command panels, database/storage UIs, routed special forms, HUD renderer relocation, or the `advanced-ui-set` reference set, read `references/advanced-ui-set-special-ui.md` before opening raw restricted files.
2. Classify the request by primary need:
   - planning or intake for a new UI
   - basics or mental model
   - structure
   - logic
   - HUD or chat
   - server form
   - reusable pattern
   - debugging
   - addon integration
   - vanilla asset lookup
   - external research routing
   - schema validation
   - tooling and editor workflow
3. Read only the matching specialized skill reference.
   - For planning or intake, read `../../docs/52-json-ui-intake-questionnaire.md`.
   - For layout-heavy planning, route geometry through `mcbe-json-ui-ir-authoring` and `mcbe-json-ui-tools-runner`.
4. Answer with file-level changes, exact JSON locations, and exact texture paths.
5. State whether a path, practice, or rule is:
   - confirmed from source
   - inferred from working samples
   - not verified

## Hard rules

- Never invent Bedrock texture paths.
- Never guess undocumented binding or property names if exact lookup is needed.
- Treat JSON UI as part of the full resource pack, not as isolated JSON files.
- Keep entry files thin: `_ui_defs.json` registers files, `server_form.json` routes forms, and `hud_screen.json` inserts HUD widgets.
- For non-trivial packs, use the planned nested architecture: `routes/<entry>/index.json`, `forms/<feature>/index.json`, `hud/<feature>/index.json`, and categorized `common/controls`, `common/visuals`, `common/motion`, `common/data`, `common/text`.
- Prefer included sample packs over abstract explanation for implementation patterns.
- Use `vanilla resource mirror` as the upstream vanilla asset authority.
- For layout-heavy UI work, treat IR/tools output as the geometry source of truth, then hand-finish Bedrock-specific bindings, factories, collections, animations, and screen modifications.
- For visual UI work, name the internal reference family and the target file role opened. Do not expose raw local reference paths, original archive names, author handles, or restricted source labels in public output.
- For broad UI work, classify by target screen, feature family, data source, and closest reference before opening source files.
- For visual design work, record design family, layout skeleton, state pattern, data source, closest reference, and patch target before editing.
- For `advanced-ui-set`-derived work, use only neutral paths and never expose original pack names, credits, comments, hidden marker text, or restricted texture paths in public output.
- Every edited label must have explicit `size`, and its `font_size` / `font_scale_factor` must fit the available height.
- For repeated buttons, slots, bars, or rows, keep one item size and one gap value unless a reference shows a deliberate exception.
