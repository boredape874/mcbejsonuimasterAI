# RPG Server UI Reference Analysis

## Why this source matters

This is not only a JSON UI sample. It is a full addon-oriented reference set where UI is tied to textures, gameplay systems, and broader resource-pack structure.

That makes it the strongest included source for addon integration analysis.

## Key JSON UI patterns

### `_ui_defs.json`

Registered UI includes:

- chest and furnace server forms
- animated bars
- `form`, `menu`, `stat`, `guild`, `gmenu`, `ginfo`, `quest`, `skill`, `craft`, `npc`, `shop`, `boss`

This shows how far a pack can push game-wide custom UI.

### `hud_screen.json`

Important behaviors:

- actionbar trigger parsing
- `#hud_title_text_string` parsing for `hp`, `xp`, `mp`, `lv`, and `gold`
- multiple fixed-texture progress bars

This is a strong example of using title or actionbar text as a structured UI protocol.

### `server_form.json`

Important behaviors:

- title-text-based routing
- chest, furnace, and custom form substitution

This is directly useful for PMMP plugin driven UI protocols.

## Best use cases

- addon-wide UI and asset tracing
- HUD bars with custom textures
- chest and furnace form replacement
- linking UI to textures, blocks, items, and addon state
