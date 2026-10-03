---
name: mcbe-json-ui-research
description: Research and route Minecraft Bedrock JSON UI questions to the right authority. Use when Codex must decide whether to rely on local sample packs, official sample screens, community reference docs JSON UI pages, or vanilla resource mirror, and when answers need explicit confirmation vs inference labeling.
---

# MCBE JSON UI Research

Use this skill when the main problem is selecting or combining sources correctly.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

For skill/context design or pixel/game UI research, use `node tools/research-context.mjs topics` and retrieve only one relevant topic with `context --topic ID`. The source record separates published results from proposed local adaptations. Do not describe a paper's effect size as measured improvement of this skill.

## Contract

- Input: the exact claim or implementation question, required recency, and redistribution boundary.
- Output: selected source class, evidence location, confidence label, and license/use limits.
- Success: authoritative facts, working-sample evidence, inference, and unknowns remain distinguishable.

If `data/skill-tool-profiles.json` exists, find the single record in its `profiles` array whose `skill` is `mcbe-json-ui-research`. Do not treat the file as an object keyed by skill name. Invoke a registered search/index command only when present; missing local indexes must be reported rather than silently replaced by guesses.

## Workflow

1. Read `references/research-map.md`.
2. Check the current package scripts or tool registry before choosing a source audit, search, or sync command. If no source-management tool exists, inspect configured local evidence read-only and report the missing capability. Download selected pinned sources only within the user's authorization; never execute downloaded code merely to research it.
3. For an exact JSON UI property/type claim, check the source revision and reviewed conflict evidence. Report conflicts directly; do not imply that a separate reviewed-claims catalog exists in this checkout.
4. Decide which source class is needed:
   - Microsoft Learn documented surface
   - pinned Mojang stable or preview implementation evidence
   - target Bedrock runtime and Content Log
   - local sample pack
   - verified sample screen
   - community reference docs rule page
   - versioned community mirror for comparison only
5. Mark the result as one of:
   - confirmed from upstream source
   - confirmed from working included sample
   - inferred from pattern
   - not verified
6. Keep source selection explicit in the answer.

## Hard rules

For optional design Skill research, run `node tools/design-library.mjs skills` only when available. For pinned art or addon evidence, use `sources --source ID` and the lock's exact files. `node tools/design-source-sync.mjs --source ID` gives a read-only download plan; `--download` acquires hash-verified files in the ignored workspace, and `--verify` audits the cache. Load one source instead of all upstream instructions. These commands do not establish runtime compatibility.

- Use Microsoft Learn for documented names, then cross-check disputed types and enum values against a pinned Mojang sample.
- Use a pinned Mojang `bedrock-samples` stable commit for vanilla screen, property-use, and texture-path implementation evidence; keep preview evidence separate.
- Treat target-version Bedrock screenshots, input behavior, and a clean Content Log as the final runtime authority.
- Use Bedrock Wiki for community behavior explanations and techniques, with attribution and a community-evidence label.
- Use Ztech only as a versioned comparison mirror after cross-checking Mojang evidence; it is not official truth or redistribution permission.
- Use local packs for implementation patterns and server workflows, never as automatic proof of general compatibility.
- If Learn and pinned Mojang evidence conflict, return `unresolved-conflict` instead of choosing whichever is more convenient.
