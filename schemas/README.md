# schemas/

This folder holds **kit-owned** schemas used by the Node tool layer.

| File | Owned by | Purpose |
| --- | --- | --- |
| `ir.schema.json` | this kit | JSON Schema for the IR YAML written by the AI and consumed by `tools/ir-validate.mjs` and `tools/solve.mjs`. |

For **external** JSON UI schemas (Blockception, DJStompZone), see `references/schemas/`. Those are upstream mirrors used for editor integrations and reference. Do not confuse them with the kit-owned IR schema.
