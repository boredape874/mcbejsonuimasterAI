# Hierarchical Task Router

Use when the request is broad, mixed, or says "make a complete UI".

If the local repository checkout exists, prefer:

- `project-root/docs/57-hierarchical-task-router.md`
- `project-root/data/reference-hierarchy.json`

## Route Shape

1. Major topic: HUD, chat, server form, special form, battle UI, database/storage, container, loading, tooltip, pause/settings, addon integration.
2. Mid topic: bars, hotbar, command palette, menu design, renderer overlay, scroll list, etc.
3. Subtopic: the exact job such as vertical hotbar, RPG status bars, chat command palette, animated hover tooltip.
4. Data source: static RP, title/actionbar/chat payload, server form collection, scoreboard collection, Script API, PMMP, addon renderer.
5. Closest reference: one file or one restricted neutral mirror.
6. Patch target: exact `RP/ui/*.json` plus addon files if needed.

## restricted local Routes

| Subtopic | restricted neutral reference |
| --- | --- |
| animated hover tooltip | `references/restricted/json-ui-reference-packs/animated-hover-text/ui/ui_common.json` |
| vertical hotbar | `references/restricted/json-ui-reference-packs/vertical-hotbar-left-right/.../ui/hud_screen.json` |
| circular hotbar | `references/restricted/json-ui-reference-packs/circular-hotbar/ui/hud_screen.json` |
| chat command palette | `references/restricted/json-ui-reference-packs/fast-commands/ui/chat_screen.json` |
| minimap or interactive HUD | `references/restricted/json-ui-reference-packs/minimap-overlay/ui/hud_screen.json` |
| phone/PDA/device form | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/device_phone/second.json` |
| battle command panel | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/creature/attack.json` |
| database/detail UI | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/creature/creature_database.json` |
| PC/storage UI | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/creature/pc.json` |
| title-payload HUD suite | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/phud/phud.json` |

Open these only after selecting the matching subtopic.
