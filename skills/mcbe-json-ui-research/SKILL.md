---
name: mcbe-json-ui-research
description: Research and route Minecraft Bedrock JSON UI questions to the right authority. Use when Codex must decide whether to rely on local sample packs, Mojang bedrock-samples, Bedrock Wiki JSON UI pages, or ZtechNetwork/MCBVanillaResourcePack, and when answers need explicit confirmation vs inference labeling.
---

# MCBE JSON UI Research

Use this skill when the main problem is selecting or combining sources correctly.

## Workflow

1. Read `references/research-map.md`.
2. Decide which source class is needed:
   - local sample pack
   - official Mojang sample
   - Bedrock Wiki rule page
   - Ztech vanilla pack
3. Mark the result as one of:
   - confirmed from upstream source
   - confirmed from working included sample
   - inferred from pattern
   - not verified
4. Keep source selection explicit in the answer.

## Hard rules

- Use Ztech for vanilla asset truth.
- Use Mojang samples for official screen file structure.
- Use Bedrock Wiki for behavior explanations and techniques.
- Use local packs for implementation patterns and Bedrock server workflows.
