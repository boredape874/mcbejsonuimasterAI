---
name: mcbe-json-ui-hud-and-chat
description: Build, analyze, and debug Bedrock HUD and chat driven UI. Use when Codex must work on `hud_screen.json`, `chat_screen.json`, scoreboard injection, title overlays, actionbar driven UI, bottom chat panels, hidden chat protocol messages, Java-style locate chat helpers, clickable chat command shortcuts, desktop/touch HUD menus, chunk or minimap overlays, or message-protocol-based HUD behavior in Minecraft Bedrock JSON UI.
---

# MCBE JSON UI HUD And Chat

Use this skill for the real-time UI layer.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Contract

- Input: HUD/chat entry files, message or scoreboard protocol, device targets, and sender code when dynamic.
- Output: insertion and data-flow trace, exact protocol contract, changed files, and runtime checks.
- Success: sender and receiver formats agree, hidden protocol text does not leak, and desktop/touch behavior is tested or explicitly pending.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-hud-and-chat` entry. Run only confirmed commands and do not claim that a static preview exercised live HUD bindings.

## Workflow

1. Read `references/hud-chat-map.md`.
2. Decide the subsystem:
   - scoreboard injection
   - title display
   - actionbar conditional UI
   - chat panel
   - bottom chat or mobile split
3. Inspect `hud_screen.json` and `chat_screen.json` together when both exist.
4. Inventory every sender that writes title, subtitle, actionbar, chat, or scoreboard state. One singleton factory/channel does not accumulate independent sends.
5. For fixed-width payloads, route byte framing to `mcbe-json-ui-logic`; for pack/script ownership, add `mcbe-json-ui-addon-integration`.
6. Preserve any server-side protocol assumptions and the exact pending Bedrock scenario in the answer.

## Important rule

If a feature is keyed off title text or actionbar text, document the exact expected string format. That format is part of the system, not incidental text.

Do not close HUD/chat work from a validator or static PNG. Channel arbitration, per-row sibling scope, chat lifetime, collection correlation, and normal actionbar/chat recovery require Bedrock interaction evidence.
