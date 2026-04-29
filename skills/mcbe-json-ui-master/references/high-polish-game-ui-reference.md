# High-Polish Game UI Reference

Use this internal design reference family when the user asks for a high-polish RPG/game UI, especially skill menus, HUD status clusters, custom hotbars, or routed server forms.

## Source

- Reference family: local high-polish game UI pack.
- Entry point: `ui\_ui_defs.json`.
- Public answers should mention only the pattern family and target files, not the original folder name or raw local path.

## Key Files

- `ui/server_form.json`: routes custom server form titles to specialized UI modules.
- `ui/skill_ui.json`: fixed 256x256 skill-board form with many hand-placed icons and a compact form button row.
- `ui/inventory_server_form.json`: inventory-style server form treatment.
- `ui/info_ui.json`: HP/MP style HUD/status cluster using texture-state composition.
- `ui/hotbar.json`: custom hotbar treatment.
- `ui/hud_screen.json`: HUD integration and hotbar slot rendering.
- `textures/ui/inventory/button1.json`: reusable button texture metadata.
- `textures/tmp/health.json`, `textures/tmp/mana.json`: status bar texture metadata.

## Use For

- High-quality RPG skill screen layout.
- Compact icon board or skill tree visuals.
- HUD health/mana/info cluster styling.
- Custom hotbar and slot frame styling.
- Server form title routing to specialized UI modules.
- Dense polished game UI where texture-backed controls matter more than vanilla flat panels.

## Patterns To Extract

- Route `server_form.third_party_server_screen` by `#title_text` into separate modules.
- Keep the normal server form visible only when custom route titles do not match.
- Use a fixed square visual shell for premium/game-like skill screens.
- Place skill icons manually when the design is radial, tree-like, or non-grid.
- Use texture-backed buttons and explicit state textures for default/hover/pressed/locked.
- Keep HUD bars and icon clusters compact, layered, and texture-driven.

## Do Not Copy Blindly

- Do not copy server-specific title keys without adapting them.
- Do not copy texture paths unless the target RP contains those textures.
- Do not use the manual icon offsets if the target screen size or shell texture differs.
- Do not mix this style into plain utility forms unless the user wants a game/RPG look.
