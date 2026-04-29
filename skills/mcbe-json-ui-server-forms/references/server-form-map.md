# Server Form Map

## Primary source files

- `../../references/sample-packs/form-router-sample/ui/server_form.json`
- `../../references/sample-packs/game-hud-sample/ui/server_form.json`
- `../../references/sample-packs/game-hud-sample/ui/chest_server_form.json`
- `../../references/sample-packs/game-hud-sample/ui/furnace_server_form.json`
- `../../references/sample-packs/game-hud-sample/ui/chest_inventory_system.json`
- `../../references/sample-packs/ui-variant-samples/GfE8ULhgL4I/ui/server_form.json`
- `../../references/sample-packs/ui-variant-samples/GfE8ULhgL4I/ui/chest_screen.json`
- `../../references/mirrors/builder-sample/ui/server_form.json`
- `../../references/mirrors/container-form-sample/RP/ui/server_form.json`
- `../../references/mirrors/container-form-sample/RP/ui/chest_server_form.json`
- `../../references/mirrors/container-form-sample/RP/ui/furnace_server_form.json`
- optional restricted neutral mirror: `../../references/restricted/advanced-ui-set-ui/restricted-suite/ui/server_form.json`
- optional restricted neutral mirror: `../../references/restricted/advanced-ui-set-ui/restricted-suite/ui/device_phone/second.json`
- optional restricted neutral mirror: `../../references/restricted/advanced-ui-set-ui/restricted-suite/ui/chest_server_form.json`
- optional restricted neutral compact router: `../../references/restricted/advanced-ui-set-ui/restricted-suite/ui/server_form.json`
- optional restricted neutral compact view: `../../references/restricted/advanced-ui-set-ui/restricted-suite/ui/creaturesv.json`
- optional restricted neutral button templates: `../../references/restricted/advanced-ui-set-ui/restricted-suite/ui/creaturebt.json`
- optional restricted neutral premium router: `../../references/restricted/advanced-ui-set-ui/premium-form-gallery/ui/server_form.json`
- optional restricted neutral premium common templates: `../../references/restricted/advanced-ui-set-ui/premium-form-gallery/ui/common/common.json`
- optional restricted neutral premium shop form: `../../references/restricted/advanced-ui-set-ui/premium-form-gallery/ui/menus/other/store.json`
- optional restricted neutral premium crate form: `../../references/restricted/advanced-ui-set-ui/premium-form-gallery/ui/menus/crates/preview_v2.json`
- optional restricted neutral maze router: `../../references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/custom_form.json`
- optional restricted neutral maze common templates: `../../references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/common.json`
- optional restricted neutral maze ability carousel: `../../references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/components/ability/ability_upgrades_tab.json`
- optional restricted neutral maze shop browser: `../../references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/components/shop/shop_browser.json`
- optional restricted neutral maze purchase popup: `../../references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/components/purchase/purchase_popup.json`
- optional restricted neutral maze quest tab: `../../references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/components/quest/quest_tab.json`
- optional restricted neutral maze NPC/book form: `../../references/restricted/advanced-ui-set-ui/motion-form-gallery/ui/mai/custom_npc.json`

## Strong patterns

- Modern Cloud UI Reference: `customUI_` plus typed suffix routing
- RPG Server UI Reference: chest or furnace token routing
- `ui-variant-samples/GfE8ULhgL4I`: lightweight server form skin override
- `../../../docs/47-custom-auxid-and-form-progress.md`: `#form_text` numeric prefix progress bar pattern
- `../../../docs/50-advanced-ui-reference-analysis.md`: premium multi-form router and feature-page families
- `../../../docs/51-compact-crafting-pocket-ui-reference.md`: compact menu router, small icon buttons, and vanilla fallback pattern
- `../../../docs/60-advanced-ui-set-special-ui-reference.md`: restricted neutral routes for device forms, battle/database/storage forms, and advanced `server_form` dispatch
- `../../../docs/62-special-form-device-ui-patterns.md`: fixed shell device/phone form workflow
- `../../../docs/61-advanced-ui-set-file-pattern-routes.md`: compact routed form, button template suite, and texture metadata route table
- `../../../docs/63-premium-form-gallery.md`: polished shop/store, auction, crate, reward, generic long/modal, and city/claim form reference
- `../../../docs/64-motion-form-hud-reference.md`: ability/progression forms, shop purchase popups, quest tabs, NPC/book forms, shared form chrome, and animation-heavy form routes

## Design recommendation

- `../../../docs/39-design-recommendation-catalog.md`
- `../../../docs/40-server-form-example-index.md`
