---
name: mcbe-json-ui-self-bootstrap
description: Use when an AI agent opens this repository for the first time, or when tools/* commands fail. Runs the AGENTS.md self-bootstrap protocol (Node check, npm install, workspace + state, optional vanilla-index) via tools/setup.mjs and tools/doctor.mjs without modifying the user's system.
---

# MCBE JSON UI Self-Bootstrap

Use this skill when:

- `.agent/state/setup-state.json` does not exist
- any `tools/*.mjs` reports a missing dependency or directory
- the user explicitly asks you to "set up the kit" or "fix the environment"

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
- If a step requires cloning a large mirror (e.g. ZtechNetwork/MCBVanillaResourcePack), ask the user first; do not auto-clone.

## References

- `references/bootstrap-flow.md`
