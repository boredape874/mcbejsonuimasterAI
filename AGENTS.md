# AGENTS.md — AI Entry Point

This file is read first by any AI agent (Cursor, Claude Code, Codex, Copilot, Aider, etc.) that opens this repository.

The repository has two layers:

1. **Knowledge layer** — `skills/`, `docs/`, `references/`. Long-form knowledge for Bedrock JSON UI.
2. **Tools layer** — `tools/`, `schemas/`, `vanilla-index/`, `workspace/`. Deterministic Node CLI that the AI calls to author, compile, validate, and (optionally) render JSON UI.

## 0. First-time self-bootstrap (do this once per clone)

If `.agent/state/setup-state.json` is **missing**:

1. Read `.agent/bootstrap.md` and follow it.
2. Run `node tools/setup.mjs`.
3. On failure, read `.agent/doctor.md` and run `node tools/doctor.mjs --fix`.
4. Never install global packages, never use sudo, never modify the user's system without explicit consent.

If `.agent/state/setup-state.json` **exists**:

- Run `node tools/doctor.mjs --quick` (3 second sanity check) before starting non-trivial work.

## 1. Routing rule (most important)

Pick the layer **based on what the user asked for**, not by default.

| User intent | Use |
| --- | --- |
| "make this layout/positions/alignment/symmetry correct", "build a HUD/panel/form from this image or spec" | **Tools layer** (IR + `tools/`) |
| "use the vanilla dialog/form/button frame", "extend `common_dialogs.*` / `common_buttons.*` / `server_form.*`" | **Tools layer** with `extends:` (skill `mcbe-json-ui-vanilla-presets`, catalog `data/presets-catalog.json`) |
| "fix this binding", "add this animation", "wire this to a PMMP form / Script API event" | **Knowledge layer** (`skills/`, `docs/17, 19, 33, 34, 35, 36`) editing raw JSON UI directly |
| Beginner explanation, source lookup, vanilla path verification, schema setup | **Knowledge layer** |
| "what properties / anchors / binding types are valid?" | `data/jsonui-spec.json` (single source of truth used by `tools/validate.mjs`) |
| Mixed (layout + bindings + animation) | Tools layer for layout, then patch the compiled JSON UI with raw edits for bindings/animation |
| "이걸로 실제 RP 만들어 줘" / "production-ready" / "skills 기반으로 마감" | **Two-stage**: tools for coords, then hand-finish the JSON UI per `docs/46-tools-output-to-handcrafted-ui.md` (3-state buttons, vanilla nineslice, modification-only routing). Template: `examples/handcrafted/simple_server_custom_form/`. |

If unsure, ask the user one short question to disambiguate. Do not silently switch layers.

## 2. Tools layer — when chosen

Workflow:

1. Author or update `workspace/<project>/ir.yaml`.
2. `node tools/run.mjs workspace/<project>/ir.yaml`
   - This runs: ir-validate → solve → compile → validate, and writes:
     - `workspace/<project>/solved.json`
     - `workspace/<project>/ui.json`
     - `workspace/<project>/report.json`
3. Read `report.json`. If `ok=false`, fix `ir.yaml` (not `ui.json`) and rerun.
4. (Optional) `node tools/render.mjs workspace/<project>/ui.json` for `preview.png` + `coords.json`.
5. (Optional) `node tools/diff.mjs <target.png> workspace/<project>/preview.png` to get region-level differences and feed those back into `ir.yaml`.

IR rules (hard):

- Use **px** by default. Use `%`, `%c`, `%cm`, `fill`, `default` only when the user explicitly requested or when the requirement clearly implies parent-relative behavior.
- Declare `symmetric_x` / `symmetric_y` whenever a left/right or top/bottom pair is intended.
- Declare `same_size` + `equal_gap` whenever a row/column of repeating elements is intended.
- Declare `align_x` / `align_y` whenever an alignment is intended.
- Do **not** edit `ui.json` by hand in the tools workflow. Edit `ir.yaml` and recompile.

## 3. Knowledge layer — when chosen

Use the existing routing already in this repo. Suggested entry points:

- `skills/mcbe-json-ui-master/SKILL.md` — top-level router for arbitrary JSON UI work
- `docs/03-skill-map.md`, `docs/27-token-efficient-routing.md` — pick which skill to read
- `docs/17-community-patterns-string-score-hud.md`, `docs/19-bindings-and-hardcoded-values.md` — bindings, score HUD, hardcoded values
- `docs/33-animation-patterns-and-dumper-values.md`, `docs/35-scroll-and-carousel-patterns.md`, `docs/36-dumper-value-cookbook.md` — animations / scroll / dumper values
- `docs/22-ai-response-quality.md` — required output shape and labels (confirmed from / inferred from / not verified)
- `docs/24-json-ui-layout-units.md`, `docs/39-design-recommendation-catalog.md`, `docs/44-design-to-ir-mapping.md` — for design choices that may later be expressed as IR

## 4. Safety and operational rules

- Never invent vanilla texture paths. Verify against `references/upstreams/MCBVanillaResourcePack` (mirror) or `vanilla-index/textures.json`.
- Never invent bindings or hardcoded names. Verify against `docs/19` and `docs/34`.
- Never bulk-rewrite `ui.json` if a small patch works.
- Label claims in your reply per `docs/22-ai-response-quality.md`.
- Do not run network installers, do not call sudo, do not change global Node/npm settings during bootstrap.

## 5. Output expectations

When work is done, the AI should hand back:

- A short summary of what was changed
- Exact file paths edited (with line ranges where relevant)
- For tools-layer work: the path to `ir.yaml`, `ui.json`, `report.json` (and `preview.png` if rendered)
- Any unresolved warnings from `tools/validate.mjs`

## 6. Where to read more

- `.agent/bootstrap.md` — exact bootstrap procedure
- `.agent/doctor.md` — diagnostics and recovery
- `docs/41-ir-spec.md` — full IR spec
- `docs/42-tools-reference.md` — every tool's input/output/exit codes
- `docs/43-self-bootstrap-protocol.md` — design rationale for the AI bootstrap
- `docs/44-design-to-ir-mapping.md` — converting `docs/39` design recommendations into IR constraints
- `docs/45-jsonui-spec-and-presets.md` — `data/jsonui-spec.json` + `data/presets-catalog.json` and how the validator + IR `extends` use them
- `docs/46-tools-output-to-handcrafted-ui.md` — when to stop at compiler output vs. when to hand-finish the JSON UI; checklist before declaring done
- `skills/mcbe-json-ui-self-bootstrap/SKILL.md`, `skills/mcbe-json-ui-ir-authoring/SKILL.md`, `skills/mcbe-json-ui-tools-runner/SKILL.md`, `skills/mcbe-json-ui-vanilla-presets/SKILL.md`
