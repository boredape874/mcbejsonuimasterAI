# PMMP To JSON UI Bridge

Use this when server code must drive Bedrock JSON UI.

## What PMMP can realistically drive

PMMP can influence client UI through:

- forms, usually `server_form.json`
- title text
- subtitle text
- actionbar text
- chat messages
- scoreboard display
- resource-pack delivery and pack stack control

JSON UI cannot directly call PMMP code. The server sends data through a visible or hidden client channel, and JSON UI reads available bindings or collections.

## Common bridge patterns

| Server channel | JSON UI use |
| --- | --- |
| `sendTitle()` | Large overlays, dialog-style UI, encoded status payloads. |
| `sendActionBarMessage()` | Compact HUD values, bars, counters, protocol strings. |
| chat message | Chat panel replacement, topbar notifications, text event display. |
| scoreboard list | Personal score HUD and list-driven panels. |
| form packets/FormAPI | `server_form.json` customization and title-prefix routing. |

## Protocol design

Use explicit prefixes so JSON UI can distinguish payloads:

```text
ck:hp:75:mp:32:gold:1000
ck:notify:success:Quest complete
ck:dialog:npc_a:Hello there
```

Rules:

- pick one delimiter and document it
- escape or avoid delimiter characters in user text
- include a version prefix for long-lived systems
- avoid sending raw user input into JSON UI expressions
- keep actionbar payloads short

## PMMP-side responsibility

PMMP should:

- own gameplay truth
- format stable payload strings
- throttle repeated HUD updates
- avoid sending unchanged values every tick
- keep resource-pack versioning predictable

JSON UI should:

- parse only the data it needs
- show/hide controls
- select textures and labels
- animate lightweight presentation

## Debug checklist

If PMMP data does not appear:

1. confirm the server sends the title/actionbar/form
2. confirm vanilla UI shows the raw text if custom UI is disabled
3. confirm JSON UI binds to the correct runtime property
4. confirm the protocol prefix matches
5. confirm string slicing/splitting does not break on numbers or delimiters
6. confirm the target screen is loaded through `_ui_defs.json`

