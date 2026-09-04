# Déesse-Style UI Toolkit Reference

This is a local private reference family for a large Bedrock JSON UI utility pack. The raw source is not redistributed in this repository because the source files include an explicit no-copy notice. Use the private local mirror only for structural study when it exists on the current machine.

Local private mirror:

- local-only source catalog entry `deesse-ui-toolkit` when explicitly configured

## What To Learn From It

Use this reference for integrated UI suites rather than single isolated widgets.

- `_ui_defs.json` as a central router for many small UI modules.
- Separate desktop and touch HUD menu implementations.
- Toggle-driven HUD feature panels with persistent state bindings.
- `common.scrolling_panel` plus stack/list content for long option menus.
- Quick-container helpers for inventory/chest screens.
- Search, tooltip display, instant move, and hover-mode utility panels.
- Shared common controls: raw toggles, buttons, dropdowns, sliders, dialogs, and animation presets.
- Tool overlays such as chunk map, minimap renderer, item/armor preview, and utility screens.
- Chat and HUD integration through vanilla screen overrides instead of standalone screens.

## Routing Pattern

The pack does not keep all logic in `hud_screen.json` or `inventory_screen.json`. Those vanilla files act as insertion points, then `_ui_defs.json` registers many namespaced modules under a custom folder.

When adapting this pattern:

1. Keep vanilla screen overrides thin.
2. Put reusable controls in a `common/` folder.
3. Put screen-specific HUD work in a `hud/` folder.
4. Put inventory/container helpers in a separate container folder.
5. Keep configuration lists and language keys separate from runtime controls.

This is a good model for large Bedrock UI packs because it avoids one huge unmaintainable JSON file.

## HUD Menu Pattern

The HUD menu is split by input family.

- Desktop menu: compact dialog, keyboard mappings, option list toggles.
- Touch menu: separate layout tuned for touch controls.
- Shared behavior: toggles bind to visible HUD modules and settings rows.

When implementing a similar menu, do not try to make one layout fit every device. Route desktop and touch separately, then share only the underlying toggle state names.

## Quick Container Pattern

The quick-container modules attach helper panels around chest/inventory style screens.

Useful subpatterns:

- side buttons anchored relative to the container root
- search bar panel hidden on performance/unsupported modes
- tooltip display as a separate overlay module
- instant move buttons behind feature toggles
- extra utility column expanded by a toggle

This is a practical reference when building Bedrock server utility packs that need chest UI enhancement without replacing the entire inventory screen.

## Common Control Pattern

The common folder is useful for reusable controls:

- raw toggle base with custom checked/unchecked visuals
- dialog shell with close behavior
- dropdown composition
- slider composition
- animation definitions reused by multiple panels

Adapt the structure, not the raw code. Keep your project namespace, texture paths, and button IDs independent.

## Validation Notes

Some source files are JSONC-style references with comments. Before moving any pattern into a runtime pack, strip comments and validate as normal JSON. Also verify all custom texture paths and language keys exist in the target RP.

## When To Use

Use this reference when the task mentions:

- large UI pack architecture
- desktop/touch split HUD
- settings or feature toggles
- quick inventory/chest utilities
- scrollable settings menus
- chunk/minimap/debug overlays
- reusable control library design

Do not use it as a direct copy source for public code.
