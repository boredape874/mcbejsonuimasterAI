---
name: mcbe-json-ui-logic
description: Explain and implement Bedrock JSON UI logic rules. Use when Codex must analyze bindings, preserved text, string slicing, printf-style `%.s` text formatting, fixed-width payloads, first-line extraction, chat locate-message parsing, actionbar or title driven protocols, visibility expressions, value extraction, and condition-based UI behavior in Minecraft Bedrock JSON UI.
---

# MCBE JSON UI Logic

Use this skill when the main problem is not structure but data flow.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Contract

- Input: source control/property, payload examples, target value, and the controls that consume it.
- Output: source-to-derived-value binding trace, exact string protocol, and failure cases.
- Success: property ownership and transformation order are evidenced and unresolved binding names are not guessed.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-logic` entry. Use a registered inspector only when its command exists; otherwise trace bindings directly from the JSON UI and sender source.

## Workflow

1. Read `references/logic-map.md`.
2. Identify the logic type:
   - binding relay
   - string prefix filtering
   - fixed-width substring parsing
   - title or actionbar protocol
   - visibility condition
3. Explain which control owns the source property and where the derived value is used.
4. For packed strings, write the complete sender/receiver framing table before editing slice expressions: prefix, ordered fields, width unit, padding, sentinel, escaping, and maximum observed total length.
5. Test emitted bytes and slice boundaries with ASCII, Korean, section-sign, PUA/emoji, empty, numeric-only, exact-boundary, and over-boundary fixtures.
6. If exact property names are needed, escalate to `vanilla-assets` only for textures, otherwise answer from source evidence.

## Output rules

- Use short JSON snippets only when needed.
- State the protocol string exactly when one exists.
- Distinguish view-binding derived values from direct `binding_name` values.
- Do not equate JavaScript string length or substring offsets with Bedrock's observed `%.Ns` width. Keep target-version behavior as measured evidence, not a universal byte-limit claim.
