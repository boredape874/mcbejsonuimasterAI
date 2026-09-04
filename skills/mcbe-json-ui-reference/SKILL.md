---
name: mcbe-json-ui-reference
description: Look up exact Minecraft Bedrock JSON UI control types, properties, bindings, catalog records, and vanilla evidence. Use when an answer must cite a verified name or path instead of inferring from memory.
---

# MCBE JSON UI Reference

Resolve one exact lookup from the smallest authoritative local source.

## Contract

- Input: the exact property, control, binding, recipe, screen, texture, or atlas question and the target file context.
- Output: the verified value, evidence path and revision or tier, scope limitations, and an explicit unresolved result when evidence is absent.
- Success: every exact name or path is traceable to a current schema, working sample, catalog record, or vanilla source; inference is never presented as confirmation.

## Workflow

1. Read [references/catalog-lookup.md](references/catalog-lookup.md) and select only the evidence class needed.
2. Read the `mcbe-json-ui-reference` entry in `data/skill-tool-profiles.json` when present.
3. If `tools/skill-doctor.mjs` exists, use it to inspect the profile before invoking a registered tool. A tool or profile marked `planned` or unavailable must not be executed, even if a same-named script exists.
4. Search the verified local source directly when no implemented lookup tool is available.
5. Return `confirmed`, `sample-observed`, `inferred`, or `unresolved` with the evidence location.

## Boundaries

- Schema acceptance is not Bedrock runtime proof.
- A vanilla index proves upstream existence, not ownership by the target RP.
- Catalog matches carry their source tier and redistribution restriction.
- Do not invent a near-looking property, binding, control, or texture path.
