---
name: mcbe-json-ui-patterns
description: Reuse proven Bedrock JSON UI patterns from included sample packs and local utility mirrors. Use when Codex must build or adapt animated progress bars, topbar notifications, scoreboards, chest or pocket containers, reusable presets, custom chat panels, static start-screen backgrounds, tablist overlays, text-slicing snippets, or similar recurring Minecraft Bedrock JSON UI patterns.
---

# MCBE JSON UI Patterns

Prefer adapting proven included patterns over inventing a new one.

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
