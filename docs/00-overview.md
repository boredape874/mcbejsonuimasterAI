# Overview

This repository is a Codex skill pack for mastering Minecraft Bedrock JSON UI in real server and addon workflows.

It is built around four principles:

1. Prefer working Bedrock resource-pack samples over abstract explanation
2. Treat JSON UI as part of the full RP and addon structure
3. Validate vanilla paths against upstream sources instead of memory
4. Answer in file-level terms that a PMMP or Bedrock developer can edit immediately
5. Keep AI context small by routing to one topic and one or two exact references
6. Route broad UI requests through `docs/55-reference-task-taxonomy.md`, `docs/57-hierarchical-task-router.md`, `data/reference-task-index.json`, and `data/reference-hierarchy.json`
7. Use IR/tools as the geometry source of truth for layout-heavy UI, then hand-finish Bedrock-specific behavior
8. Treat restricted local JSON UI packs as neutral pattern references, documented through `docs/56-local-json-ui-reference-pack-analysis.md`
9. Route visual design through `docs/58-design-reference-atlas.md`, `docs/59-diagrammatic-workflows.md`, and `data/design-reference-index.json`

It also now includes a beginner-safe layer so the AI can explain:

- what a Bedrock resource pack is
- what `_ui_defs.json` actually does
- why screens and templates differ
- why Bedrock does not have one fixed runtime screen size
- how to ask the right planning questions before building a new UI

## Covered areas

- `_ui_defs.json`
- namespaces and modifications
- HUD
- `chat_screen.json`
- title and actionbar driven UI
- server form replacement
- chest and pocket container UI
- animated bars
- scoreboards
- tooltip and common presets
- bindings, variables, and string parsing
- texture and addon integration
- beginner-friendly JSON UI planning and intake
- IR/tools based layout planning
- hierarchical target/feature/data-source routing
- design-family and layout-skeleton routing
- restricted local reference pack pattern extraction without source branding
- basics and mental models
- local utility mirrors for topbar, title bars, and tablist patterns
- token-efficient routing for large packs

## Main problem this repository solves

Most JSON UI references fail in one of these ways:

- they explain properties but not working structure
- they isolate JSON from the rest of the resource pack
- they do not show server driven text protocols
- they guess vanilla texture paths
- they do not separate official source, working sample, and inference

This repository fixes that by combining local sample packs, verified sample screens, community reference docs rules, and Ztech vanilla asset verification.
