# Server Form Map

## Primary source files

- `../../references/source-packs/modern-cloud-ui-reference/ui/server_form.json`
- `../../references/source-packs/rpg-server-ui-reference/ui/server_form.json`
- `../../references/source-packs/rpg-server-ui-reference/ui/chest_server_form.json`
- `../../references/source-packs/rpg-server-ui-reference/ui/furnace_server_form.json`
- `../../references/source-packs/rpg-server-ui-reference/ui/chest_inventory_system.json`
- `../../references/source-packs/farm-ui-variants/GfE8ULhgL4I/ui/server_form.json`
- `../../references/source-packs/farm-ui-variants/GfE8ULhgL4I/ui/chest_screen.json`
- `../../references/external/EasyUIBuilder/ui/server_form.json`
- `../../references/external/Chest-UI/RP/ui/server_form.json`
- `../../references/external/Chest-UI/RP/ui/chest_server_form.json`
- `../../references/external/Chest-UI/RP/ui/furnace_server_form.json`
- optional restricted neutral mirror: `../../references/restricted/advanced-ui-set-ui/restricted-suite-b/ui/server_form.json`
- optional restricted neutral mirror: `../../references/restricted/advanced-ui-set-ui/restricted-suite-b/ui/device_phone/second.json`
- optional restricted neutral mirror: `../../references/restricted/advanced-ui-set-ui/restricted-suite-b/ui/chest_server_form.json`
- optional restricted neutral compact router: `../../references/restricted/advanced-ui-set-ui/restricted-suite-c-rp/ui/server_form.json`
- optional restricted neutral compact view: `../../references/restricted/advanced-ui-set-ui/restricted-suite-c-rp/ui/creaturesv.json`
- optional restricted neutral button templates: `../../references/restricted/advanced-ui-set-ui/restricted-suite-c-rp/ui/creaturebt.json`
- optional restricted neutral premium router: `../../references/restricted/advanced-ui-set-ui/premium-form-gallery-a/ui/server_form.json`
- optional restricted neutral premium common templates: `../../references/restricted/advanced-ui-set-ui/premium-form-gallery-a/ui/common/common.json`
- optional restricted neutral premium shop form: `../../references/restricted/advanced-ui-set-ui/premium-form-gallery-a/ui/menus/other/store.json`
- optional restricted neutral premium crate form: `../../references/restricted/advanced-ui-set-ui/premium-form-gallery-a/ui/menus/crates/preview_v2.json`

## Strong patterns

- Community server-form search-bar pattern: `common.text_edit_box` plus button visibility binding against `#form_button_text`.
- Modern Cloud UI Reference: `customUI_` plus typed suffix routing
- RPG Server UI Reference: chest or furnace token routing
- `farm-ui-variants/GfE8ULhgL4I`: lightweight server form skin override
- `../../../docs/47-custom-auxid-and-form-progress.md`: `#form_text` numeric prefix progress bar pattern
- `../../../docs/50-advanced-ui-reference-analysis.md`: premium multi-form router and feature-page families
- `../../../docs/51-compact-crafting-pocket-ui-reference.md`: compact menu router, small icon buttons, and vanilla fallback pattern
- `../../../docs/60-advanced-ui-set-special-ui-reference.md`: restricted neutral routes for device forms, battle/database/storage forms, and advanced `server_form` dispatch
- `../../../docs/62-special-form-device-ui-patterns.md`: fixed shell device/phone form workflow
- `../../../docs/61-advanced-ui-set-file-pattern-routes.md`: compact routed form, button template suite, and texture metadata route table
- `../../../docs/63-premium-form-gallery.md`: polished shop/store, auction, crate, reward, generic long/modal, and city/claim form reference

## Design recommendation

- `../../../docs/39-design-recommendation-catalog.md`
- `../../../docs/40-server-form-example-index.md`
