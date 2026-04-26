# .agent/doctor.md — Diagnostics and Recovery

Use when `tools/setup.mjs` or any `tools/*.mjs` fails.
Each entry: **Symptom → Diagnosis → Remedy**.

The AI should read symptoms in order, match the closest one, and apply the remedy.
Do not chain remedies blindly. If two apply, pick the more specific one.

---

## Bootstrap failures

### Symptom: `node: command not found` or version `< 18.17`
- Diagnosis: Node not installed or too old.
- Remedy: Stop. Ask user to install Node 18.17+. Do not install yourself.

### Symptom: `npm install` fails with `EACCES` / permission errors
- Diagnosis: User's npm prefix points to a system directory.
- Remedy: Ask user to fix npm prefix (`npm config get prefix`). Do not run with sudo.

### Symptom: `npm install` fails with native build error for `@napi-rs/canvas` or `pixelmatch`
- Diagnosis: Native module without a prebuilt binary for the user's platform.
- Remedy: These are **optional** (used only by `render.mjs` and `diff.mjs`). Re-run with `npm install --omit=optional` and continue. Mark `render`/`diff` as unavailable in `setup-state.json` `warnings`.

---

## Vanilla index failures

### Symptom: `vanilla-index/screens.json` missing after `tools/build-vanilla-index.mjs`
- Diagnosis: `references/upstreams/MCBVanillaResourcePack` not present or empty.
- Remedy: Ask user to run `scripts/sync-ztech-vanilla.ps1` first. Tools layer still works without the index; lookups will fall back to `references/official/bedrock-samples-ui` if present.

### Symptom: `build-vanilla-index.mjs` finds 0 screens
- Diagnosis: Wrong source path or partial mirror.
- Remedy: Re-run sync script. If still 0, check `references/upstreams/MCBVanillaResourcePack/ui/` exists.

---

## IR / solver / compile failures

### Symptom: `ir-validate.mjs` reports "unknown unit" / "% used without explicit allow"
- Diagnosis: IR uses `%`, `%c`, `%cm`, or `fill` without the user explicitly enabling parent-relative units.
- Remedy: Either rewrite IR using `px`, or set `units: { allowPercent: true }` at the root of `ir.yaml` (only if the user asked for parent-relative behavior).

### Symptom: `solve.mjs` reports "constraint conflict"
- Diagnosis: Two declared constraints contradict (e.g. `align_x` + `symmetric_x` with mismatched anchors).
- Remedy: Inspect `solver_log.json`. Identify the conflicting constraint pair. Remove or relax one. Do not silently delete user-declared constraints — explain to the user which conflict was resolved and how.

### Symptom: `solve.mjs` runs forever / OOM
- Diagnosis: Cyclic constraint graph.
- Remedy: Kill, inspect IR for circular references (e.g. A.right = B.left, B.right = A.left). Break the cycle and retry.

### Symptom: `compile.mjs` produces JSON UI but coords mismatch the IR by > 1px
- Diagnosis: Anchor or unit conversion bug, or rounding.
- Remedy: Re-run with `--strict` to fail on mismatch. If reproducible with a small IR, file an issue in this repo with that IR attached.

### Symptom: `validate.mjs` reports "unknown binding" / "hardcoded name violation"
- Diagnosis: A binding/hardcoded name is not in `docs/19` / `docs/34` allowlist.
- Remedy: Check `docs/19-bindings-and-hardcoded-values.md` and `docs/34-binding-patterns-value-index.md`. If the binding is genuinely valid but missing from the allowlist, add it (with a `confirmed from / inferred from / not verified` label per `docs/22`) before re-running.

---

## Render / diff failures

### Symptom: `render.mjs` errors with "canvas not available"
- Diagnosis: Optional dependency `@napi-rs/canvas` not installed.
- Remedy: `npm install @napi-rs/canvas`. If still failing on this platform, render is unavailable; fall back to numeric review of `solved.json` and `report.json`.

### Symptom: `render.mjs` output shows wrong fonts / missing textures
- Diagnosis: Vanilla index missing textures, or pack uses non-vanilla assets without registering them.
- Remedy: Run `tools/build-vanilla-index.mjs --force`. If pack has custom assets, point `--assets <path>` at the pack root.

### Symptom: `diff.mjs` reports very high differences for what visually looks identical
- Diagnosis: Anti-aliasing / scale mismatch between target and rendered.
- Remedy: Re-run with `--ignore-aa` and matching `--scale`. Use region-level diff (`--regions`) instead of raw pixel diff.

---

## State / cache failures

### Symptom: `tools/*` reads stale state / wrong vanilla data
- Diagnosis: Cache in `vanilla-index/cache/` or `.agent/state/` out of date.
- Remedy: Delete `vanilla-index/cache/` and re-run `tools/build-vanilla-index.mjs`. Delete `.agent/state/setup-state.json` and re-run `tools/setup.mjs`.

---

## Last resort

If none of the above match:

1. Run `node tools/doctor.mjs --verbose` and capture full output.
2. Show the user the captured output.
3. Do not attempt blind fixes (file deletion, reinstall, etc.).
