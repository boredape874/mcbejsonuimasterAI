# 42 — Tools Reference

The v2 tool layer is registry-first. This document explains the workflow; it does not duplicate every argument, output, exit code, and recovery rule.

## Source of truth

- `data/ai-tool-registry.json` — versioned contract for every AI-callable tool
- `schemas/ai-tool.schema.json` — registry schema
- `data/skill-tool-profiles.json` — minimal ordered tools for each skill
- `schemas/task-envelope.schema.json` — structured prompt input
- `prompts/task-envelope.yaml` — copyable task-envelope template

Use the registry commands before guessing a CLI:

```powershell
npm run skill:doctor -- --all --probe
npm run tools:list -- --skill mcbe-json-ui-visual-design
npm run tools:describe -- asset.search
npm run skill:context -- mcbe-json-ui-server-forms
```

`status: implemented` plus an existing script means a tool is available. `skill:doctor` reports a missing implemented script as an error and a newly created planned script as a promotion candidate. A file existing by itself is not enough to claim a stable tool contract.

## Recommended workflow

```text
environment check
  -> source validation and UI-only scan
  -> recipe or asset search
  -> IR solve and compile
  -> texture-aware preview
  -> pack validation
  -> offline evaluation
  -> later, real Bedrock evidence check
```

Use only the stages needed by the task. `skill:context` returns the smaller skill-specific sequence.

## Implemented command groups

| Task | npm command | Main evidence |
| --- | --- | --- |
| Environment | `npm run doctor:quick` | repository-local dependency and state checks |
| Source boundary | `npm run validate:sources -- [config]` | source schema, path, license-evidence, and redistribution findings |
| UI corpus | `npm run source:scan -- [options]` | normalized screen, control, texture, nine-slice, and protocol records |
| Broad local archive | `npm run corpus:inventory -- --root <path>` | neutral sources, measured controls/assets/protocols, exclusions, unresolved records, and local recipe candidates |
| Recipe catalog | `npm run catalog:build -- [options]` | measured recipes linked to source evidence |
| Recipe lookup | `npm run design:search -- [query] [filters]` | matching recipe ids, tiers, roles, and evidence |
| Asset lookup | `npm run asset:search -- [query] [filters]` | UI-first asset metadata, dimensions, hash, source, and duplicate state |
| Asset semantics | `npm run asset:catalog -- [options]` | observed control usage, semantic roles/states, visual measurements, state families, and nine-slice evidence |
| Texture context | `npm run asset:context -- <role> [--state <state>]` | source-redacted measured constraints and original-art generation brief |
| Layout pipeline | `npm run run -- <ir.yaml>` | `solved.json`, `ui.json`, and `report.json` |
| Visual preview | `npm run preview -- <ui.json> [<solved.json>] [options]` | coordinates, unsupported-property report, state previews, and contact sheet |
| Pack validation | `npm run validate:pack -- <pack-root> [options]` | `_ui_defs`, namespace, control, JSONC, and texture report |
| Public-release audit | `npm run audit:public -- [options]` | local path, private source, credential, framework, and redistribution leak findings |
| Offline evaluation | `npm run eval:offline -- [options]` | deterministic fixed-task and golden-image report |
| Runtime evidence gate | `npm run eval:live -- [options]` | status of real PC/touch screenshots and Bedrock content logs |
| Tool discovery | `npm run tools:list -- [options]` | current registered tools and availability |
| Tool contract | `npm run tools:describe -- <tool-id>` | inputs, outputs, mutations, failures, recovery, and evidence |
| Skill context | `npm run skill:context -- <skill>` | ordered minimal tool set and boundaries |
| Skill health | `npm run skill:doctor -- <skill>` | registry, profile, script, and optional help-probe checks |
| Prompt build | `npm run prompt:build -- <task-envelope>` | canonical Markdown task prompt |
| Prompt lint | `npm run prompt:lint -- <prompt-or-envelope>` | missing sections, schema errors, and unavailable required tools |

Run `npm run tools:describe -- <tool-id>` for exact options and failure behavior. The table above is navigation, not a second contract.

## Source and catalog pipeline

The source tools treat development packs and asset libraries as read-only inputs.

```powershell
npm run validate:sources
npm run corpus:inventory -- --root <local-json-ui-archive> --out workspace/corpus-local/archive
npm run source:scan -- --out workspace/corpus-local
npm run catalog:build -- --corpus workspace/corpus-local/index.json
npm run design:search -- button --role button --json
```

`design:search` prefers the generated local catalog when present and otherwise uses the checked-in `data/design-recipes.public.json`. Maintainers rebuild that public fallback only with `catalog:build -- --public`; this mode rejects local-only or prohibited evidence and writes deterministic content.

- Public configuration contains only redistributable or metadata-only sources.
- Local paths belong in the Git-ignored local source configuration.
- The scanner follows configured UI entry points and linked RP/BP evidence; it does not promote unresolved dynamic values.
- The catalog preserves source tier and redistribution status.
- Search results are evidence candidates, not permission to copy source assets.

## Asset semantics and search

Build semantic evidence before writing a texture prompt:

```powershell
npm run asset:catalog
npm run asset:context -- button --state hover --json
```

The semantic catalog joins actual JSON UI texture references to owning controls and screen families, then records observed versus inferred roles, visual measurements, state siblings, and same-stem nine-slice values. A context query with insufficient cross-source evidence must remain unresolved instead of inventing a measured rule.

`asset:search` queries the local visual asset index without copying files.

Defaults are deliberately narrow:

- UI categories only
- records with `duplicateOf` excluded
- no resolved local path in output
- a redistribution warning in every JSON report

Use `--include-duplicates`, `--all-categories`, or `--absolute` only when the task explicitly needs them. Even with `--absolute`, verify the source license before copying an asset.

## IR, compile, and validation

The normal geometry command remains:

```powershell
npm run run -- workspace/<project>/ir.yaml
```

It runs `ir-validate -> solve -> compile -> validate` and writes `solved.json`, `ui.json`, and `report.json`. Fix geometry in `ir.yaml` and regenerate; do not hand-tune generated offsets.

Low-level commands remain available for diagnosis:

| Tool id | Direct command | Role |
| --- | --- | --- |
| `project.init` | `node tools/init-project.mjs <name> [--template <id>]` | create a non-overwriting starter IR |
| `ir.validate` | `node tools/ir-validate.mjs <ir.yaml>` | schema, reference, and solver-unit checks |
| `layout.solve` | `node tools/solve.mjs <ir.yaml> <solved.json>` | absolute pixel geometry |
| `ui.compile` | `node tools/compile.mjs <solved.json> <ui.json>` | Bedrock JSON UI skeleton |
| `ui.validate` | `node tools/validate.mjs <ui.json> [<solved.json>]` | structural and geometry-risk report |
| `preview.diff` | `node tools/diff.mjs <target> <preview>` | coordinate or raster difference evidence |
| `repository.audit` | `node tools/audit.mjs [--report <path>]` | repository links, JSON, skill, and script integrity |
| `vanilla.index` | `node tools/build-vanilla-index.mjs [--force]` | local vanilla screen and texture evidence |

The Go solver remains geometry-only. YAML parsing, auto-sizing, compilation, validation, preview, and reports stay in Node.

## Single preview engine

`tools/preview.mjs` is the primary preview entry point. `tools/render.mjs` delegates to the same engine for backward compatibility.

```powershell
npm run preview -- workspace/<project>/ui.json workspace/<project>/solved.json `
  --profiles pc,touch `
  --states default,hover,pressed `
  --report workspace/<project>/preview-report.json
```

The engine writes deterministic coordinates and unsupported-property evidence even when raster support is unavailable. With the optional canvas dependency it renders selected profiles and states, textures and nine-slices, a contact sheet, and a compatibility `preview.png`.

Unsupported properties are reported rather than silently accepted. The preview is still not a complete Bedrock client emulator.

## Prompt contract

Copy `prompts/task-envelope.yaml` into a workspace and keep its paths repository-relative. The envelope separates:

`goal -> profiles -> materials -> measured evidence -> constraints -> recipes/tools -> output files -> validation -> unverified items`

```powershell
npm run prompt:build -- workspace/<task>/task.yaml --output workspace/<task>/prompt.md
npm run prompt:lint -- workspace/<task>/prompt.md --json
```

Prompt building fails if a required tool is unregistered or unavailable. It does not invent evidence, execute the task, or mark runtime work complete.

## Offline and Bedrock runtime gates

`eval:offline` checks fixed public tasks using parse, reference, geometry, text, asset, protocol, preview, leak, and golden-image evidence. Golden images change only with the explicit `--update-goldens` option; never use that option merely to hide a regression.

`eval:live` does not launch or emulate Minecraft. It checks whether real PC and touch screenshots and a Bedrock content log were supplied for each task, and whether the log contains JSON UI errors.

Therefore:

- clean IR, preview, pack, and offline reports mean **static and visual validation complete**;
- real in-game screenshots plus clean content logs mean **runtime evidence present**;
- no tool result alone proves bindings, collection data, input dispatch, animation timing, or device interaction.

Actual Bedrock verification is performed only when the user requests that stage.

## Repository safety

- Tools do not install system software, elevate privileges, or modify global configuration.
- Public outputs must not contain absolute local paths, private source names, or restricted assets.
- Run `npm run audit:public` before public release. It checks public candidates while excluding ignored local data and designated external/private reference areas.
- Local corpus and preview data stay under ignored workspace paths.
- Setup, tool availability, and content correctness are separate checks: use `doctor`, `skill:doctor`, and the appropriate validator for each layer.
