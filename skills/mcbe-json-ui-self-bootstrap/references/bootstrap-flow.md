# Bootstrap flow (compact)

```
AI opens repo
  │
  ▼
read AGENTS.md
  │
  ▼
.agent/state/setup-state.json exists? ──► YES ──► doctor.mjs --quick ──► proceed
  │
  NO
  │
  ▼
read .agent/bootstrap.md
  │
  ▼
node tools/setup.mjs
  │
  ▼
success? ──► YES ──► record state, proceed
  │
  NO
  ▼
read .agent/doctor.md, match symptom
  │
  ▼
node tools/doctor.mjs --fix
  │
  ▼
re-run setup
```

Exit codes from `tools/setup.mjs`:

| Code | Meaning |
| --- | --- |
| 0 | success |
| 1 | unexpected error |
| 2 | Node too old |
| 3 | npm install failed |

Exit codes from `tools/doctor.mjs`:

| Code | Meaning |
| --- | --- |
| 0 | all checks ok (or --quick) |
| 4 | one or more checks failed (full mode) |
