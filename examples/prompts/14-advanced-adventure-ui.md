# Advanced Adventure UI Prompt

Use this when the target should look like a polished RPG/adventure Bedrock UI rather than a small utility form.

```text
Use mcbe-json-ui-master and mcbe-json-ui-server-forms.
I want an advanced adventure-style Bedrock JSON UI.

Target pack:
- <resource pack path>

Feature:
- <battle pass / store / quest board / NPC vendor / equipment window / map navigation / reward toast>

PMMP data source:
- <form title prefix, form body payload, buttons, icons, prices, progress, quest state, etc.>

Reference:
- docs/50-advanced-ui-reference-analysis.md

Rules:
- if references/private/advanced-ui-reference/ui-pack exists, inspect only the relevant feature family, not every file
- do not copy original source JSON or textures unless this project owns equivalent assets
- rewrite the pattern into the target namespace
- define project-owned route prefixes
- keep vanilla fallback if editing server_form.json
- state exact sizes, grid dimensions, icon sizes, and scroll regions used
- verify texture paths against the target pack
- update _ui_defs.json if a new file is added
- validate JSON after editing
```

## Good Follow-Up Requests

```text
Make the store page use the advanced reference but with my own textures under textures/ui/shop.
```

```text
Turn my quest form into a 3x3 quest-board layout with detail modal routing.
```

```text
Build a battle-pass reward track using my PMMP button payloads and keep the vanilla form fallback.
```
