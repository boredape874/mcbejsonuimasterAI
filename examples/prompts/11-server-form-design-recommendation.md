# Server Form Design Recommendation Prompts

## Pick a visual direction before implementation

```text
Use mcbe-json-ui-master.
I need a Bedrock server_form design recommendation before editing files.

Target feature:
- <NPC dialogue / shop / quest board / stats menu / kit selector / settings menu>

Target pack:
- <resource pack path>

Constraints:
- must work on small screens
- use verified vanilla or bundled texture paths only
- preserve server_form collection bindings unless a replacement route is needed

Use:
- docs/39-design-recommendation-catalog.md

Return:
- recommended design family
- 2-3 alternative design directions if my preferred style is unclear
- exact reference file to inspect
- suggested root/body/button sizes
- title prefix or routing strategy
- files that would need edits
```

## Adapt a chosen design family

```text
Use mcbe-json-ui-master and mcbe-json-ui-server-forms.
Implement a <design family> server_form style for this pack:

Target pack:
- <resource pack path>

Chosen style:
- <vanilla shell / bottom NPC dialogue / framed NPC panel / RPG stat menu / chest-like form / furnace process form / modern control panel>

Route prefix:
- <prefix in form title>

Data from PMMP:
- <buttons, icons, prices, descriptions, stats, progress, etc.>

Reference:
- docs/39-design-recommendation-catalog.md

Rules:
- if the visual style is not explicit, ask me to pick from 2-3 recommended design references before implementing
- keep layout dimensions stable for repeated buttons, slots, icons, and rows
- use `%`, `%c`, anchors, and scroll areas for variable content
- do not invent texture paths
- update `_ui_defs.json` if a new UI file is added
- validate JSON after editing
```
