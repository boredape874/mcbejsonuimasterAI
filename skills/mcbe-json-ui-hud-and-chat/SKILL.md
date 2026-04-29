---
name: mcbe-json-ui-hud-and-chat
description: Build, analyze, and debug Bedrock HUD and chat driven UI. Use when Codex must work on `hud_screen.json`, `chat_screen.json`, scoreboard injection, title overlays, actionbar driven UI, bottom chat panels, hidden chat protocol messages, or message-protocol-based HUD behavior in Minecraft Bedrock JSON UI.
---

# MCBE JSON UI HUD And Chat

Use this skill for the real-time UI layer.

## Workflow

1. Read `references/hud-chat-map.md`.
2. Decide the subsystem:
   - scoreboard injection
   - title display
   - actionbar conditional UI
   - chat panel
   - bottom chat or mobile split
3. Inspect `hud_screen.json` and `chat_screen.json` together when both exist.
4. Preserve any server-side protocol assumptions in the answer.

## Important rule

If a feature is keyed off title text or actionbar text, document the exact expected string format. That format is part of the system, not incidental text.
