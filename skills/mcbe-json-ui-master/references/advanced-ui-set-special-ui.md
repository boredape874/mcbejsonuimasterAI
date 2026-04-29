# advanced-ui-set Special UI

Use this for the restricted `advanced-ui-set` reference set.

Project docs:

- `../../../docs/60-advanced-ui-set-special-ui-reference.md`
- `../../../docs/61-advanced-ui-set-file-pattern-routes.md`
- `../../../docs/62-special-form-device-ui-patterns.md`
- `../../../docs/63-premium-form-gallery.md`
- `../../../docs/64-motion-form-hud-reference.md`
- `../../../data/advanced-ui-set-ui-file-index.json`

restricted neutral mirror:

- `../../../references/restricted/advanced-ui-set-ui/restricted-suite/`
- `../../../references/restricted/advanced-ui-set-ui/restricted-suite/`
- `../../../references/restricted/advanced-ui-set-ui/restricted-suite/`
- `../../../references/restricted/advanced-ui-set-ui/restricted-suite/`
- `../../../references/restricted/advanced-ui-set-ui/premium-form-gallery/`
- `../../../references/restricted/advanced-ui-set-ui/motion-form-gallery/`

## Route

| User intent | Open first |
| --- | --- |
| phone/PDA/profile/guidebook special form | `docs/62-special-form-device-ui-patterns.md`, then `references/restricted/advanced-ui-set-ui/restricted-suite/ui/device_phone/second.json` |
| one `server_form.json` routes many special screens | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/server_form.json` |
| advanced large routed form | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/server_form.json` |
| compact routed form with custom button templates | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/server_form.json`, then `references/restricted/advanced-ui-set-ui/restricted-suite/ui/creaturesv.json` and `references/restricted/advanced-ui-set-ui/restricted-suite/ui/creaturebt.json` |
| polished shop/store form | `references/restricted/advanced-ui-set-ui/premium-form-gallery/ui/server_form.json`, then `references/restricted/advanced-ui-set-ui/premium-form-gallery/ui/common/common.json` and `references/restricted/advanced-ui-set-ui/premium-form-gallery/ui/menus/other/store.json` |
| auction/listing, crate, reward, gifting, trade, city form | `docs/63-premium-form-gallery.md`, then the matching file under `references/restricted/advanced-ui-set-ui/premium-form-gallery/ui/menus/` |
| ability, skill tree, or battlepass-like progression form | `docs/64-motion-form-hud-reference.md`, then `references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/components/ability/ability_upgrades_tab.json` |
| shop plus purchase popup with dense product grid | `docs/64-motion-form-hud-reference.md`, then `references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/components/shop/shop_browser.json` and `references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/components/purchase/purchase_popup.json` |
| quest tab, cosmetics form, NPC/book form | `docs/64-motion-form-hud-reference.md`, then the matching `references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/` component |
| status HUD with cooldowns, effect bars, reward overlay, or flip-book icons | `docs/64-motion-form-hud-reference.md`, then `references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/custom_hud/maze.json` or `custom_hud/reward.json` |
| inventory-like server form | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/chest_server_form.json` |
| battle command UI | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/creature/attack.json` |
| battle-style button and bar texture metadata | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/battle.json`, then `references/restricted/advanced-ui-set-ui/restricted-suite/textures/ui/buttons/` |
| database/detail UI | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/creature/creature_database.json` |
| storage/PC UI | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/creature/pc.json` |
| protocol HUD suite | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/phud/phud.json` |
| vanilla HUD renderer relocation | `references/restricted/advanced-ui-set-ui/restricted-suite/ui/hud_screen.json` |

## Public Safety

- Do not publish original names, comments, credits, or restricted texture paths.
- Rename namespaces, flags, controls, and textures in derived work.
- Extract mechanisms: region mapping, factories, bindings, button states, grids, animation flow, and data protocol.
- Name the neutral path used in final answers, not the original source path.
