# Déesse-Style HUD Menu And Overlay Pattern

This local private reference family shows how to build a feature-rich HUD menu without placing every control directly in `hud_screen.json`.

Private local mirror:

- local-only source catalog entry `deesse-ui-toolkit` when explicitly configured

## Pattern Summary

The useful idea is a routed HUD module system:

- `hud_screen.json` remains the vanilla insertion point.
- `_ui_defs.json` registers many submodules.
- A custom `hud/` folder owns feature panels such as menu, debug, chunk viewer, chat grid, and overlays.
- Desktop and touch get separate menu files.
- A common toggle state controls whether each HUD feature is visible.

## Implementation Guidance

For a new HUD suite:

1. Insert one root panel into `hud_screen.json`.
2. Register `ui/<project>/hud/*.json` in `_ui_defs.json`.
3. Keep the desktop menu and touch menu as separate files.
4. Put each overlay in its own module.
5. Use a common toggle naming convention such as `<project>:hud_menu-<feature>`.
6. Bind each overlay's `#visible` from its toggle state and any vanilla global visibility condition.

## Device Split

The reference treats desktop and touch as separate layouts. This is the right approach for Bedrock because touch controls, safezone, and screen density differ enough that one shared layout usually becomes fragile.

For phone HUD work:

- keep controls larger
- avoid dense text rows
- anchor near safe areas
- avoid relying on hover-only feedback

For desktop HUD work:

- use compact scrollable option panels
- map keyboard/gamepad actions explicitly
- keep menu panels max-sized so GUI scale does not explode them

## Debugging Notes

If a HUD module does not appear:

- confirm the file is registered in `_ui_defs.json`
- confirm the namespace is loaded
- confirm the inserted root panel exists in `hud_screen.json`
- check any `ignored` expressions
- check the controlling toggle state
- check whether the desktop/touch branch is being hidden by device conditions
