# Overview

This repository is a Codex skill pack for mastering Minecraft Bedrock JSON UI in real server and addon workflows.

It is built around four principles:

1. Prefer working Bedrock resource-pack samples over abstract explanation
2. Treat JSON UI as part of the full RP and addon structure
3. Validate vanilla paths against upstream sources instead of memory
4. Answer in file-level terms that a PMMP or Bedrock developer can edit immediately
5. Keep AI context small by routing to one topic and one or two exact references

It also now includes a beginner-safe layer so the AI can explain:

- what a Bedrock resource pack is
- what `_ui_defs.json` actually does
- why screens and templates differ
- why Bedrock does not have one fixed runtime screen size

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

This repository fixes that by combining local sample packs, official Mojang samples, Bedrock Wiki rules, and Ztech vanilla asset verification.
