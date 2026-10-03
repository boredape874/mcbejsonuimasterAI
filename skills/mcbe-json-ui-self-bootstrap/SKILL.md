---
name: mcbe-json-ui-self-bootstrap
description: Use when an AI agent opens this repository for the first time, or when tools/* commands fail. Runs the AGENTS.md self-bootstrap protocol (Node check, npm install, workspace + state, optional vanilla-index) via tools/setup.mjs and tools/doctor.mjs without modifying the user's system.
---

# MCBE JSON UI Self-Bootstrap

Use this skill when:

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

- `.agent/state/setup-state.json` does not exist
- any `tools/*.mjs` reports a missing dependency or directory
- the user explicitly asks you to "set up the kit" or "fix the environment"

## Contract

- Input: repository root, failing command or missing setup state, and the current Node/npm availability.
- Output: setup and doctor results, changed repository-local files, warnings, and optional index status.
- Success: the quick doctor passes or the precise remaining blocker is reported without altering the user's system.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-self-bootstrap` entry, but treat the checked-in setup and doctor scripts below as source of truth. Never invoke a profile command whose implementation is absent.

## Workflow

1. Read `AGENTS.md` (section 0 + section 4).
2. Read `.agent/bootstrap.md` end-to-end before running any command.
3. Run `node tools/setup.mjs`.
4. On failure, read `.agent/doctor.md`, then run `node tools/doctor.mjs --fix`.
5. After success, run `node tools/doctor.mjs --quick` to confirm.
6. Report to the user: which steps ran, which `warnings` are present in `setup-state.json`, and whether the optional vanilla-index is available.

## Hard rules

- Never run `sudo`. Never elevate.
- Never install Node, npm, or any system package on the user's machine.
- Never modify files outside this repository during bootstrap.
- Never overwrite an existing AI-client config (`.cursor/`, `CLAUDE.md`, `.github/copilot-instructions.md`) without explicit user consent.
- If a step requires cloning a large mirror (e.g. vanilla resource mirror), ask the user first; do not auto-clone.

## References

- `references/bootstrap-flow.md`
