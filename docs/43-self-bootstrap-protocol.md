# 43 — Self-Bootstrap Protocol

The kit is designed so that any AI agent — Cursor, Claude Code, Codex, Copilot, Aider — can pick up this repository and become productive **without the user running setup commands manually**.

## Design goals

1. Zero user-side commands. The user clones, opens the folder in their AI client, and types a prompt.
2. Zero foreign side effects. Setup never installs Node, never elevates, never writes outside the repo.
3. Idempotent. Re-running `tools/setup.mjs` is always safe.
4. Recoverable. Every failure mode has a recipe in `.agent/doctor.md`.
5. Deterministic. The state file (`.agent/state/setup-state.json`) records exactly what was prepared and what is missing.

## Components

| Path | Audience | Role |
| --- | --- | --- |
| `AGENTS.md` | AI agents (entry point) | Routing and rules |
| `.agent/bootstrap.md` | AI agents | Self-setup procedure |
| `.agent/doctor.md` | AI agents | Failure → recipe map |
| `.agent/env-check.json` | tools/* | Required Node version, paths, optional deps |
| `.agent/state/setup-state.json` | tools/* | Last-known good state (gitignored) |
| `tools/setup.mjs` | shell | Executes the bootstrap idempotently |
| `tools/doctor.mjs` | shell | Diagnoses and (with `--fix`) applies whitelisted remedies |
| `skills/mcbe-json-ui-self-bootstrap/SKILL.md` | AI agents | Skill that wraps the protocol |
| `data/ai-tool-registry.json` | AI agents and tools | Versioned command, input, output, failure, mutation, and evidence contracts |
| `data/skill-tool-profiles.json` | AI agents and tools | Minimal ordered tool set for each JSON UI skill |
| `tools/skill-doctor.mjs` | shell | Verifies registry, profiles, implemented scripts, and declared help support |

## Boot sequence (logical)

```
AI opens repo
  └─ reads AGENTS.md
       └─ if .agent/state/setup-state.json missing:
            ├─ reads .agent/bootstrap.md
            ├─ runs node tools/setup.mjs
            └─ on failure: reads .agent/doctor.md, runs node tools/doctor.mjs --fix
       └─ else:
            └─ runs node tools/doctor.mjs --quick
```

After the environment check, select tools from the registry rather than guessing commands:

```text
node tools/skill-doctor.mjs <selected-skill> --probe
  -> npm run skill:context -- <selected-skill>
  -> node tools/tool-describe.mjs <selected-tool-id>
  -> invoke only implemented, available tools required by the task
```

`tools/doctor.mjs` checks the local Node environment. `tools/skill-doctor.mjs` checks AI tool contracts and skill profiles. Neither validates a resource pack or proves Bedrock runtime behavior.

## Safety boundaries (what AI must NOT do)

- Do not `sudo` or otherwise elevate.
- Do not install Node, npm, Python, or any system package.
- Do not modify files outside this repository.
- Do not auto-clone large mirrors (e.g. `MCBVanillaResourcePack`); ask the user first.
- Do not overwrite an existing AI-client config (`.cursor/`, `CLAUDE.md`, `.github/copilot-instructions.md`) without explicit consent.

## Why this differs from `docs/22-ai-response-quality.md`

`docs/22` constrains the *response shape* an AI returns to the user.
`docs/43` constrains the *runtime environment preparation* the AI may perform on the user's machine.
They are complementary and never overlap.
