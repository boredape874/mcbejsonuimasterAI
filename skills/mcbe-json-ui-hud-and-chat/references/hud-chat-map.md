# HUD Chat Map

## Primary source files

- `../../references/sample-packs/form-router-sample/ui/hud_screen.json`
- `../../references/sample-packs/form-router-sample/ui/chat_screen.json`
- `../../references/sample-packs/form-router-sample/ui/scoreboards.json`
- `../../references/sample-packs/game-hud-sample/ui/hud_screen.json`
- `../../references/sample-packs/ui-variant-samples/FwnQgFaZsHs/ui/hud_screen.json`
- `../../references/sample-packs/ui-variant-samples/FwnQgFaZsHs/ui/chat_screen.json`
- `../../references/sample-packs/ui-variant-samples/gPiyv-DJxGw/ui/hud_screen.json`
- `../../references/sample-packs/ui-variant-samples/gPiyv-DJxGw/ui/scoreboards.json`
- `../../references/sample-packs/ui-variant-samples/z65tCLQRo0Q/ui/hud_screen.json`
- `../../references/sample-packs/ui-variant-samples/z65tCLQRo0Q/ui/chat_screen.json`
- optional restricted neutral mirror: `../../references/restricted/advanced-ui-set-ui/restricted-suite/ui/phud/phud.json`
- optional restricted neutral mirror: `../../references/restricted/advanced-ui-set-ui/restricted-suite/ui/phud/sidebar.json`
- optional restricted neutral mirror: `../../references/restricted/advanced-ui-set-ui/restricted-suite/ui/phud/phone.json`
- optional restricted neutral HUD renderer relocation: `../../references/restricted/advanced-ui-set-ui/restricted-suite/ui/hud_screen.json`
- optional restricted neutral maze status HUD: `../../references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/custom_hud/maze.json`
- optional restricted neutral maze reward HUD: `../../references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/custom_hud/reward.json`

## Strong examples

- Modern Cloud UI Reference: custom chat panel, scoreboard split, title-driven HP bar
- RPG Server UI Reference: hp/xp/mp/lv/gold HUD, levelup actionbar image
- Farm UI variants: alternate HUD and chat pairings
- Chat protocol filtering: hide rendered chat rows whose `#text` contains a server-owned marker while preserving `#chat_visible`; see `mcbe-json-ui-master/references/topics/hud-chat/chat-message-filtering.md`.
- Java Locate Command chat helper: intercept `The nearest ... is at block ...` rows in `chat_screen.json`, reformat the row, and use an invisible `edit_box` to build `/tp @s <x> <y> <z>`; see `../../../references/topics/hud-chat/java-locate-command-chat.md`.
- Déesse-style HUD menu reference: route a large HUD suite through `_ui_defs.json`, keep desktop and touch menu layouts separate, and bind overlays from shared toggle state; see `../../../references/topics/hud-chat/deesse-style-hud-menu.md`.
- advanced-ui-set neutral reference: title-payload HUD router with separate actionbar, phone, sidebar, currency, loading, and wait widgets. Use `../../../docs/60-advanced-ui-set-special-ui-reference.md` before opening raw restricted files.
- advanced-ui-set compact renderer reference: vanilla renderer relocation and actionbar fade without fully replacing hotbar or gameplay HUD. Use `../../../docs/61-advanced-ui-set-file-pattern-routes.md` to route this separately from protocol HUD work.
- advanced-ui-set maze reference: status HUD, effect duration bars, cooldown overlays, reward overlays, and flip-book animation values. Use `../../../docs/64-motion-form-hud-reference.md` before opening raw restricted files.
