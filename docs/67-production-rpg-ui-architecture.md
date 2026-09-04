# 67 - Production RPG UI Architecture

This guide turns the compact RPG HUD and asymmetric server-form style into a reusable production structure. Use the IR templates to establish geometry, then hand-finish bindings, factories, animations, and textures in the resource pack.

## Design targets

| Surface | Stable frame | Content rule |
| --- | --- | --- |
| Status HUD | `260x104`, top-left | portrait, name/level, HP, MP, defense, EXP, currency |
| RPG menu | `640x430`, centered | `590x64` header, `590x300` card area, compact footer |
| Primary card | `290x300` | one strong destination with a `50-58px` icon |
| Secondary cards | `294x148` and two `144x146` cells | three scannable actions without covering gameplay |

The geometry starters are:

- `templates/ir/rpg_hud.yaml`
- `templates/ir/rpg_menu.yaml`

Generate them with `tools/init-project.mjs`, run the deterministic pipeline, and edit the resulting resource-pack JSON only after the layout report is clean.

## Resource-pack ownership

Keep vanilla entry files thin and feature logic isolated:

```text
RP/
  manifest.json
  ui/
    _ui_defs.json
    hud_screen.json
    server_form.json
    rpg_hud.json
    rpg_menu_form.json
    rpg_common.json
  textures/ui/rpg/
    hud_frame.png
    portrait_frame.png
    bar_bg.png
    bar_hp.png
    bar_mana.png
    bar_defense.png
    menu_frame.png
    menu_card.png
```

- `hud_screen.json` inserts one local wrapper or one local factory host.
- `server_form.json` owns title routing and the vanilla fallback.
- Feature files own controls, parsers, animations, and texture names.
- `rpg_common.json` owns genuinely shared frames and button states; it must not become a second screen router.
- Register every feature file in `_ui_defs.json` and validate the whole pack, not isolated files.

## HUD data contract

Use one versioned payload and fixed field order. Keep dialogue, notifications, and persistent stats on separate channels or prefixes.

```text
rpg:hud:v1|name|level|hp|maxHp|mana|maxMana|defense|exp|maxExp|gold
```

The server or Script API should cache the last serialized payload per player. Send a new title/actionbar payload only when a field changes, with a low-frequency recovery refresh if needed. Do not rebuild and transmit the same string every tick.

Inside JSON UI:

1. Preserve the original bound string once.
2. Extract each field once in a parser control.
3. Reuse parsed controls with `source_control_name`; do not repeat the full substring expression in every label and bar.
4. Clamp every denominator on the server side so progress calculations never divide by zero.
5. Keep protocol controls invisible and outside visible layout groups.

## Animated stat bars

Each bar should have a stable outer size, a background image, a clipped fill host, a fill image, and one centered value label. Animate only the fill width or clip percentage.

- Reuse one `animated_stat_bar` template with concrete variables supplied by each instance.
- Every binding must name a real `binding_name`, `binding_name_override`, or `source_property_name` as required by its binding type.
- Do not depend on undeclared ancestor variables such as `$progress_binding`.
- Keep labels explicit in size and above the fill layer so text remains readable.
- Use short easing for visible changes; avoid perpetual animations when the value is stable.

## Live player portrait

Use the Bedrock player renderer rather than a static skin image when the target screen supports it. Place the renderer inside a fixed portrait frame and clip or size it so armor and held items cannot overflow into the bars. Treat a static texture as an intentional fallback, not as the primary implementation.

NPC dialogue portraits are a separate component. Align the model or portrait to a dedicated fixed-width column, then give the text column the remaining width. Do not position the NPC relative to the full dialogue panel center.

## Server-form composition

The asymmetric menu is a custom renderer for one routed form family, not a replacement for every server form.

- Preserve a vanilla fallback for unrecognized titles.
- Route on a short versioned title marker, then hide protocol text from visible title labels.
- Bind button text and images from the form collection. A custom visual control still needs the vanilla collection index and button event path.
- Put normal, hover, and pressed visuals inside the button control. Do not draw a second decorative card over an active button.
- Use a scroll view only when content exceeds the fixed card area; do not leave an empty scrollbar or toast background visible.
- Default transient title, toast, notification, and dialogue panels to `visible: false`, then enable them from a concrete binding condition.

## Visual system

Use a restrained neutral frame plus semantic accents:

| Token | Use |
| --- | --- |
| near-black at `0.78-0.94` alpha | shell, cards, bar tracks |
| red | HP and danger |
| blue | mana |
| pale steel | defense |
| gold | EXP, level, currency, selected state |
| warm paper | quest details only |

Keep text at readable Minecraft GUI sizes. Large headings belong in the form header, while card labels and HUD values stay compact. Icons should remain inside predictable `50-58px` footprints. Transparent texture padding must be included in the control size so neighboring elements are not clipped.

## Performance rules

- Prefer stable dimensions and visibility changes over rebuilding large control trees.
- Share templates only when two or more real controls use them.
- Keep animation graphs short and event-driven.
- Avoid duplicate full-screen panels, nested scroll views, and always-visible transparent overlays.
- Normalize texture keys to the exact case stored in the pack or vanilla index.
- Use `collection_panel` only with `binding_collection_name` and valid collection details.
- Avoid cross-namespace inherited controls directly inside `modifications[].value`; insert a local wrapper that owns the external control, or replace the intended local host deliberately.
- Validate all `_ui_defs.json` entries and texture references before in-game testing.

## Production workflow

```text
1. node tools/init-project.mjs rpg_status --template rpg_hud
2. node tools/run.mjs workspace/rpg_status/ir.yaml
3. node tools/init-project.mjs rpg_dashboard --template rpg_menu
4. node tools/run.mjs workspace/rpg_dashboard/ir.yaml
5. hand-finish bindings, button states, factories, routing, and textures
6. node tools/validate-pack.mjs <resource-pack> --report workspace/pack-report.json
7. test desktop, touch, safe-zone extremes, GUI scale, and multiplayer updates in Bedrock
```

The generated `ui.json` is a geometry baseline. A production screen is complete only after the data contract, vanilla fallback, button events, transient visibility, texture ownership, and in-game behavior are verified.
