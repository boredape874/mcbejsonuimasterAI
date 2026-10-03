# 45 — JSON UI Spec & Preset Catalogs

The kit ships two machine-readable catalogs the AI must consult before authoring or validating any JSON UI:

| File | Purpose | Source / License |
|---|---|---|
| [data/jsonui-spec.json](../data/jsonui-spec.json) | Authoritative list of control types, anchors, properties, binding/animation/renderer enums, plus rule thresholds. | Ported from gamezaSRC/JSON-UI-Web-Editor (MIT) — see `_attribution` block in the file. |
| [data/presets-catalog.json](../data/presets-catalog.json) | Vanilla preset references (`common.*`, `common_dialogs.*`, `common_buttons.*`, `server_form.*`) with the `$variables` each one consumes. | Independently authored, inspired by patterns observed in SebTheSigma/JSON-UI-Maker (no upstream LICENSE; no source code copied). Names and variables verified against the pinned bedrock-samples v1.26.50.4 templates on 2026-10-03 (`tests/presets-catalog-vanilla.mjs`). |

## How the kit uses them

- `tools/_lib/ui-validator.mjs` (used by `tools/validate.mjs`) reads `jsonui-spec.json` for type/anchor/binding rules. Adding a property to the catalog instantly extends the validator.
- The IR field `element.extends` (see [docs/41-ir-spec.md](41-ir-spec.md)) takes any value listed in `presets-catalog.json` and the compiler emits `id@<extends>` with the solved layout, the IR's `variables`, and the IR's `bindings`.
- The skill [skills/mcbe-json-ui-vanilla-presets/SKILL.md](../skills/mcbe-json-ui-vanilla-presets/SKILL.md) routes user requests like "centered confirm dialog" or "scrolling form body" to the right preset.

## Updating the spec

The spec is kept in step with the pinned official samples (`references/official/bedrock-samples-ui`, revision in `references/official/bedrock-samples-ui.lock.json`, currently v1.26.50.4). Everything added for that revision sits under `_confirmed_extensions.vanilla_1_26_50` with the vanilla file that evidences it; preview-only vocabulary sits under `_confirmed_extensions.preview_1_26_60` and is not treated as stable.

If a new vanilla version adds a property:

1. Sync the samples (`scripts/sync-bedrock-samples-ui.ps1`, then `node tools/sync-bedrock-samples-ui.mjs --check`) and run `node tests/jsonui-spec-vanilla-coverage.mjs`; it lists every property, type, or enum value the pinned files use that the spec rejects.
2. Add each property to the appropriate `properties.<group>` array in `data/jsonui-spec.json` (create a group such as `tooltip` or `cycler` when none fits).
3. If it has an enum (anchors, font sizes, etc.) add it to the relevant top-level array.
4. Record the vanilla file that uses it in `_confirmed_extensions` and mirror the name in `docs/48-json-ui-field-catalogue.md`.
5. Run `node tests/jsonui-spec-vanilla-coverage.mjs` and `node tools/run.mjs workspace/<any>/ir.yaml` to confirm the validator still loads the spec.

## Updating the preset catalog

If a new vanilla preset becomes useful:

1. Add an entry to the appropriate `*_refs` array in `data/presets-catalog.json`.
2. List the `$variables` it consumes under `common_variables`; confirm each one with `node tools/vanilla-name-check.mjs '$name'` and by reading the template's inheritance chain in `references/official/bedrock-samples-ui`.
3. Add a row to the table in `skills/mcbe-json-ui-vanilla-presets/SKILL.md`.
4. Run `node tests/presets-catalog-vanilla.mjs`; it fails when a ref is not defined in the pinned sample files or a listed variable is not consumed anywhere in that ref's vanilla chain (this is how `common.cancel_button` and `$button1_panel`/`$button2_panel` were found to be non-vanilla in 2026-10).
