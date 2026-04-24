# Schema Map

## Primary sources

- `../../../references/schemas/Blockception/README.md`
- `../../../references/schemas/Blockception/vscode-settings.json`
- `../../../references/schemas/Blockception/resource/ui/ui.json`
- `../../../references/schemas/Blockception/resource/ui/_ui_defs.json`
- `../../../references/schemas/Blockception/resource/ui/_global_variables.json`
- `../../../references/schemas/DJStompZone/README.md`
- `../../../references/schemas/DJStompZone/ui.schema.json`
- `../../../references/schemas/DJStompZone/ui_defs.schema.json`
- `../../../references/schemas/DJStompZone/global_variables.schema.json`
- `../../../docs/09-schema-and-tooling.md`

## Use DJStompZone when

- the question is specifically about JSON UI schema files
- the user needs direct `ui`, `_ui_defs`, or `_global_variables` schemas

## Use Blockception when

- the user needs VSCode setup
- the user wants broader Bedrock schema integration
- the task benefits from a maintained all-Bedrock schema project

## Limits

- schemas do not prove runtime rendering behavior
- schemas do not replace upstream vanilla file lookup
- schemas do not replace real pack examples for protocol patterns
