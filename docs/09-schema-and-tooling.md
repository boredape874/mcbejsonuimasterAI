# Schema And Tooling

This repository now includes portable references for JSON UI schema validation and editor-oriented tooling.

## Included schema sources

### Blockception schemas

Local mirror:

- `references/schemas/Blockception/`

Included files:

- `README.md`
- `vscode-settings.json`
- `resource/ui/ui.json`
- `resource/ui/_ui_defs.json`
- `resource/ui/_global_variables.json`

Use Blockception when:

- you want a maintained Bedrock-wide schema project
- you need VSCode `json.schemas` setup examples
- you want resource-pack UI schema files from a larger Bedrock schema ecosystem

### DJStompZone schemas

Local mirror:

- `references/schemas/DJStompZone/`

Included files:

- `ui.schema.json`
- `ui_defs.schema.json`
- `global_variables.schema.json`
- `old_ui.schema.json`
- `README.md`

Use DJStompZone when:

- you want JSON-UI-specific schema files directly
- you need a lighter focused reference for `ui`, `_ui_defs`, and `_global_variables`
- you need historical or older UI schema context

## Included tooling sources

### `bedrock-json-ui-editor`

Local mirror:

- `references/external/bedrock-json-ui-editor/`

Use for:

- visual offset and anchor editing
- understanding which properties are practical to tweak interactively
- quick element tree inspection workflows

### `EasyUIBuilder`

Local mirror:

- `references/external/EasyUIBuilder/`

Use for:

- builder-generated JSON UI examples
- control-level example files
- understanding how a JSON UI builder models elements and components

### `Chest-UI`

Local mirror:

- `references/external/Chest-UI/`

Use for:

- chest and furnace server-form replacement
- Script API driven chest-like interfaces
- slot layout and inventory-section patterns

## Practical rule

- Use schemas to validate structure
- Use editors and builders to understand authoring workflows
- Use local sample packs and Chest-UI to understand real in-game behavior
