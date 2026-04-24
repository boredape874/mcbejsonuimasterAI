# Interactable HUD Menu Pattern

This is a community pattern for making HUD elements interactable with mouse and keyboard by opening a dummy screen.

## Core idea

Use a dummy screen such as `dev_console_screen` to release focus enough for HUD controls to receive interaction while the game remains visible behind it.

## Moving parts

`debug_screen.json`:

- map a key to open the dummy screen

`dev_console_screen.json`:

- use a base screen
- set `render_game_behind`
- set `always_accepts_input`
- set `always_listen_to_input`
- map the same key or an exit key to close it

`hud_screen.json`:

- set HUD-side input/listen flags when needed
- ensure target HUD buttons or toggles have proper mappings

## Caveats

- primarily proven for mouse and keyboard
- touch and gamepad need separate testing
- can affect input focus in ways that feel non-vanilla
- should be treated as an advanced UI trick, not a default menu method
