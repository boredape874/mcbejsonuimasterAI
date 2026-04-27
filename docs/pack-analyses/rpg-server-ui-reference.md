# RPG Server UI Reference Analysis

## Why this source matters

This is a UI-focused extract from a broader addon-oriented reference set. In this public repository, keep analysis limited to JSON UI files and the texture paths referenced by those files.

That makes it the strongest included source for addon integration analysis.

## Key JSON UI patterns

### `_ui_defs.json`

Registered UI includes:

- chest and furnace server forms
- animated bars
- `form`, `menu`, `stat`, `guild`, `gmenu`, `ginfo`, `quest`, `skill`, `craft`, `npc`, `shop`, `boss`

This shows how far a JSON UI layer can push game-wide custom screens without requiring raw addon metadata in the public reference.

### `hud_screen.json`

Important behaviors:

- actionbar trigger parsing
- `#hud_title_text_string` parsing for `hp`, `xp`, `mp`, `lv`, and `gold`
- multiple fixed-texture progress bars using target-pack texture paths

This is a strong example of using title or actionbar text as a structured UI protocol.

### `server_form.json`

Important behaviors:

- title-text-based routing
- chest, furnace, and custom form substitution

This is directly useful for PMMP plugin driven UI protocols.

## Best use cases

- addon-wide UI tracing
- HUD bars with custom textures
- chest and furnace form replacement
- linking UI to texture paths and addon state
