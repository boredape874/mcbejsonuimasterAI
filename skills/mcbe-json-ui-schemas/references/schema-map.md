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
- Bugrock JSON UI Schemas: `https://github.com/KalmeMarq/Bugrock-JSON-UI-Schemas`
  - verified HEAD on 2026-04-29: `de118a327453c3b4ed3c671fa5ea98d9b31d0238`
  - hosted schema files include `ui.schema.json`, `ui.sprite.schema.json`, `ui_defs.schema.json`, and `global_variables.schema.json`
- `../../../docs/09-schema-and-tooling.md`

## Use DJStompZone when

- the question is specifically about JSON UI schema files
- the user needs direct `ui`, `_ui_defs`, or `_global_variables` schemas

## Use Blockception when

- the user needs VSCode setup
- the user wants broader Bedrock schema integration
- the task benefits from a maintained all-Bedrock schema project

## Use Bugrock JSON UI Schemas when

- the user wants direct VSCode `json.schemas` URL examples
- the task involves `ui.sprite.schema.json` or UI texture metadata validation
- the task needs a compact catalogue of screen names, UI element types, renderers, operations, collection names, button IDs, or binding names
- comparing schema coverage between independent JSON UI schema sources would reduce guessing

## Limits

- schemas do not prove runtime rendering behavior
- schemas do not replace upstream vanilla file lookup
- schemas do not replace real pack examples for protocol patterns
