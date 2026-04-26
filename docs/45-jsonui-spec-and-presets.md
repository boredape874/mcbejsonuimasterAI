# 45 — JSON UI Spec & Preset Catalogs

The kit ships two machine-readable catalogs the AI must consult before authoring or validating any JSON UI:

| File | Purpose | Source / License |
|---|---|---|
| [data/jsonui-spec.json](../data/jsonui-spec.json) | Authoritative list of control types, anchors, properties, binding/animation/renderer enums, plus rule thresholds. | Ported from gamezaSRC/JSON-UI-Web-Editor (MIT) — see `_attribution` block in the file. |
| [data/presets-catalog.json](../data/presets-catalog.json) | Vanilla preset references (`common_dialogs.*`, `common_buttons.*`, `server_form.*`) with the `$variables` each one consumes. | Independently authored, inspired by patterns observed in SebTheSigma/JSON-UI-Maker (no upstream LICENSE; no source code copied). |

## How the kit uses them

- `tools/_lib/ui-validator.mjs` (used by `tools/validate.mjs`) reads `jsonui-spec.json` for type/anchor/binding rules. Adding a property to the catalog instantly extends the validator.
- The IR field `element.extends` (see [docs/41-ir-spec.md](41-ir-spec.md)) takes any value listed in `presets-catalog.json` and the compiler emits `id@<extends>` with the solved layout, the IR's `variables`, and the IR's `bindings`.
- The skill [skills/mcbe-json-ui-vanilla-presets/SKILL.md](../skills/mcbe-json-ui-vanilla-presets/SKILL.md) routes user requests like "centered confirm dialog" or "scrolling form body" to the right preset.

## Updating the spec

If a new vanilla version adds a property:

1. Add it to the appropriate `properties.<group>` array in `data/jsonui-spec.json`.
2. If it has an enum (anchors, font sizes, etc.) add it to the relevant top-level array.
3. Run `node tools/run.mjs workspace/<any>/ir.yaml` to confirm the validator still loads the spec.

## Updating the preset catalog

If a new vanilla preset becomes useful:

1. Add an entry to the appropriate `*_refs` array in `data/presets-catalog.json`.
2. List the `$variables` it consumes under `common_variables`.
3. Add a row to the table in `skills/mcbe-json-ui-vanilla-presets/SKILL.md`.
