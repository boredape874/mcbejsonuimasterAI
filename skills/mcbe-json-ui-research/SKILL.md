---
name: mcbe-json-ui-research
description: Research and route Minecraft Bedrock JSON UI questions to the right authority. Use when Codex must decide whether to rely on local sample packs, official sample screens, community reference docs JSON UI pages, or vanilla resource mirror, and when answers need explicit confirmation vs inference labeling.
---

# MCBE JSON UI Research

Use this skill when the main problem is selecting or combining sources correctly.

## Contract

- Input: the exact claim or implementation question, required recency, and redistribution boundary.
- Output: selected source class, evidence location, confidence label, and license/use limits.
- Success: authoritative facts, working-sample evidence, inference, and unknowns remain distinguishable.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-research` entry. Invoke a registered search/index command only when present; missing local indexes must be reported rather than silently replaced by guesses.

## Workflow

1. Read `references/research-map.md`.
2. Decide which source class is needed:
   - local sample pack
   - verified sample screen
   - community reference docs rule page
   - Ztech vanilla pack
3. Mark the result as one of:
   - confirmed from upstream source
   - confirmed from working included sample
   - inferred from pattern
   - not verified
4. Keep source selection explicit in the answer.

## Hard rules

- Use Ztech for vanilla asset truth.
- Use official sample screens for official screen file structure.
- Use community reference docs for behavior explanations and techniques.
- Use local packs for implementation patterns and Bedrock server workflows.
