---
name: mcbe-json-ui-master
description: Comprehensive Minecraft Bedrock JSON UI master skill. Use when Codex must handle Bedrock JSON UI end to end across basics and mental models, pack structure, HUD, chat, title or actionbar driven UI, server form customization, bindings and string parsing logic, reusable patterns, addon integration, debugging, vanilla texture path lookup, source selection across local sample packs, local utility mirrors, Mojang bedrock-samples, Bedrock Wiki, and ZtechNetwork/MCBVanillaResourcePack, or schema and tooling workflows such as JSON UI editors, builders, and schema-based validation.
---

# MCBE JSON UI Master

Use this as the top-level skill for Bedrock JSON UI work.

## Workflow

1. Read `references/master-routing.md`.
2. Classify the request by primary need:
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
4. Answer with file-level changes, exact JSON locations, and exact texture paths.
5. State whether a path or rule is:
   - confirmed from source
   - inferred from working samples
   - not verified

## Hard rules

- Never invent Bedrock texture paths.
- Never guess undocumented binding or property names if exact lookup is needed.
- Treat JSON UI as part of the full resource pack, not as isolated JSON files.
- Prefer included sample packs over abstract explanation for implementation patterns.
- Use `ZtechNetwork/MCBVanillaResourcePack` as the upstream vanilla asset authority.
