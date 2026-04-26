# .agent/bootstrap.md — AI Self-Bootstrap Procedure

This file is read by AI agents on first use of this repository.
The goal is: the user does nothing, the AI prepares the environment.

All steps must be **idempotent** (safe to re-run).

## Safety guardrails (read first)

- Never run `sudo`, never elevate.
- Never install Node / npm / system packages on the user's machine.
- Never modify files outside this repository.
- Never make network calls beyond `npm install` and the explicitly listed git remotes inside `tools/build-vanilla-index.mjs`.
- If any step requires user consent (e.g. cloning a large mirror), ask before doing it.

## Step 1 — Verify Node

Run:

```
node --version
```

Required: Node `>= 18.17`.

If missing or too old:

- Stop. Tell the user: "Install Node 18.17+ then re-open this folder." Do not attempt to install Node yourself.

## Step 2 — Install dependencies

If `node_modules/` is missing OR if `package-lock.json` was modified since `.agent/state/setup-state.json` was written:

```
npm install
```

Do not pass `-g`. Do not use `--force` unless `npm install` fails with a clear lock conflict.

## Step 3 — Workspace folder

If `workspace/` does not exist, create it with a single `.gitkeep` file. Do not place any sample project inside `workspace/` automatically.

## Step 4 — Vanilla index (optional but recommended)

If `vanilla-index/screens.json` is missing AND `references/upstreams/MCBVanillaResourcePack` exists:

```
node tools/build-vanilla-index.mjs
```

If `references/upstreams/MCBVanillaResourcePack` does **not** exist:

- Do **not** clone it automatically. It is a large mirror.
- Tell the user: "Run `scripts/sync-ztech-vanilla.ps1` (PowerShell) to mirror the upstream vanilla pack, then re-run setup." Continue Step 5 — the tools layer still works without the index, with reduced lookups.

## Step 5 — Optional AI-client integrations

Detect which AI client the user is most likely using:

- `.cursor/` exists → Cursor
- `CLAUDE.md` or `.claude/` exists → Claude Code
- `.github/copilot-instructions.md` exists → Copilot
- `.codex/` exists → Codex
- `AGENTS.md` already exists → assume generic AGENTS-aware client

If a client config is missing and **the user has not asked for it**, do not create it.
Only when the user asks ("set up for Cursor"), create a minimal pointer file that references `AGENTS.md`. Examples:

- `.cursor/rules/jsonui.md` → "Follow AGENTS.md."
- `CLAUDE.md` → "See AGENTS.md."
- `.github/copilot-instructions.md` → "See AGENTS.md."

Never overwrite an existing client config without explicit user consent.

## Step 6 — Record state

Write `.agent/state/setup-state.json` with at least:

```json
{
  "version": 1,
  "checkedAt": "<ISO 8601>",
  "node": "<node --version output>",
  "deps": "ok",
  "vanillaIndex": "ok" | "skipped" | "missing-source",
  "warnings": []
}
```

This file is `.gitignore`d.

## Failure handling

If any step fails:

1. Capture the error message verbatim.
2. Open `.agent/doctor.md` and locate a matching pattern.
3. Apply the listed remedy.
4. Re-run from the failing step.
5. If still failing after one retry, stop and report the error to the user with: the failing command, the captured error, and the matching `doctor.md` section.

## After bootstrap

The AI should answer the user's original request using the routing rule in `AGENTS.md` section 1.
