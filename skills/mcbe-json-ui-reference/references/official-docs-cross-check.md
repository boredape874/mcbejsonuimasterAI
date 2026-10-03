# Official and community property tables versus the spec

Reviewed 2026-10-03. `data/jsonui-spec.json` stays the single accepted vocabulary; the sources below were compared against it and against the 207 vanilla ui files of the pinned Mojang `bedrock-samples` revision (`v1.26.50.4`, commit `46ba6ea985fb`). The comparison is recorded in `data/jsonui-spec.json` under `_confirmed_extensions.docs_cross_check_2026_10_03` and guarded by `tests/jsonui-spec-vanilla-coverage.mjs`. Run `node tools/vanilla-name-check.mjs <name>` before citing any name from these tables. Paths written as `wiki:docs/...` or `schemas:schemas/...` are files inside the pinned upstream source, not this repository.

## Microsoft creator reference (`microsoftdocs-minecraft-creator-reference`, CC-BY-4.0)

`creator/Reference/Content/JsonUiReference/Examples/JsonUiComponents/ui_element.md` (frontmatter `ai-usage: ai-assisted`, `ms.date 02/11/2025`):

| Finding | Result |
| --- | --- |
| element properties documented | 77; 72 already in the spec |
| documented but absent from every vanilla file | `nine_slice_buttom` (typo), `nine_slice_left`, `nine_slice_right`, `nine_slice_top`, `slider_range`; not added (vanilla uses `nineslice_size` and `slider_steps`) |
| binding sub-keys documented | `binding_collection_name`, `binding_condition`, `binding_name`, `binding_name_override`, `binding_type`, `source_control_name`, `source_property_name`, `target_property_name` (all in `binding_entry_keys`; vanilla also uses `resolve_ancestor_scope`, `resolve_sibling_scope`, `binding_collection_prefix`, `ignored`) |
| button mapping keys documented | `from_button_id`, `input_mode_condition`, `mapping_type`, `to_button_id`; vanilla additionally uses `scope`, `handle_select`, `handle_deselect`, `ignored`, `consume_event`, `button_up_right_of_first_refusal`, `ignore_input_scope` (all eleven are now `button_mapping_entry_keys`) |
| `variables` array entries | `requires` plus `$` overrides (505 vanilla uses of `requires`; now `variables_entry_keys`) |
| enumeration tables | every choice table (anchors, binding condition, input mode, mapping type, grid rescaling, type) renders only `undefined`; take enums from vanilla |
| type claims not to trust | `font_scale_factor` boolean, `grid_item_template` integer, `locked_control` boolean, `slider_select_on_hover` string, `size` as number array only |

`ui_defs.md`, `ui_screen.md` and `ui_global_variables.md` confirm, as documented names: `_ui_defs.json` is required and lists `ui/...` paths; every non-`namespace` key of a screen file is an element; `name@base` inheritance; `$`-prefixed variables with `[r, g, b]` or `[r, g, b, a]` colors.

Label these as "confirmed from Microsoft docs (name exists)". Type, default and runtime claims from the ai-assisted pages stay "not verified".

## Official schemas (`mojang-bedrock-schemas-visual`, MIT)

`types/rp/ui/UiElement.d.ts` and `forms/ui/ui_element.form.json` carry the same five absent names and the same doubtful types as the creator page, omit `nineslice_size`, `property_bag`, the clip properties and the button/toggle state controls, and `schemas:schemas/rp/ui/index.schema.json` validates only `namespace`. Use them as a name checklist and as evidence that both official exports derive from one flawed table.

## Community editor schemas (`blockception-json-schemas-ui`, BSD-3-Clause; `kalmemarq-bugrock-json-ui-schemas`, NOASSERTION)

| Finding | Result |
| --- | --- |
| Blockception per-property schema files (`source/resource/ui/elements/properties/*.json` inside that source) | 222 files; 221 names are in the spec, `is_new_nine_slice` is not (zero vanilla uses, not added) |
| spec names without a Blockception file | 94 (for example `property_bag_for_children`, `focus_container_custom_*`, `use_selected_skin`, `gradient_direction`); all vanilla-confirmed by the coverage test, so editor validation that uses this schema will flag valid vanilla properties |
| Bugrock `ui.schema.json` | JSON with comments and trailing commas, so it is compared through its README tables (screens, element types, properties, "Unused/No Longer Works"); names only |

Use either schema as an editor convenience and as a name checklist, never as proof that a name is accepted by the client.

## Documented Molang queries at the pinned version (`bedrock-dot-dev-docs-1-26-50`)

`data/molang-queries-1.26.50.json` lists the 323 `query.*` names documented in the Mojang release documentation archived for 1.26.50.4 (the same version as the vanilla pin), flags which of them the pinned vanilla pack folders use (166), and records that every query the vanilla pack uses is documented. `node tools/vanilla-name-check.mjs query.is_in_ui` (or `q.…`) resolves against this list; with the local mirror it also resolves pack identifiers (`minecraft:…` client entities and attachables, `geometry.*`, `animation.*`, `controller.animation.*`, `controller.render.*`, material short names such as `armor_enchanted`). The documentation's license is not stated, so cite names only.

## Bedrock Wiki documentation (`bedrock-wiki-entities-visuals`, `wiki:docs/json-ui/json-ui-documentation.md`)

| Finding | Result |
| --- | --- |
| element types listed | 20; `scrollbar_track` is Wiki-only (vanilla and the spec spell the type `scroll_track`, 1 vanilla use) |
| types the Wiki marks legacy | `tab`, `carousel_label`, `grid_item`, `scrollbar`; vanilla 1.26.50 still has one `carousel_label`; `tab` and `grid_item` have zero uses but stay in the spec for older references |
| properties the Wiki marks legacy | `z_order`, `scroll_report`, `alignment`, `wrap`, `clip`; `z_order` and `alignment` stay in the spec (zero vanilla uses) |
| the 83 Wiki names not in the spec | renderer names, `property_bag` keys, hardcoded variable names and legacy tab keys, none of which are element properties |
| documented rules worth citing | size units `%c`, `%cm`, `%sm`, `%x`, `%y`, `fill`; `binding_condition` includes `visibility_changed`; `resolve_sibling_scope` restricts `source_control_name` to siblings; factory `control_name` takes an integer `#collection_length`, `control_ids` a string array; grid columns = floor(grid width / template width) under horizontal rescaling; `ignored: true` skips evaluation where `visible: false` does not |

Label these "community-documented"; the Wiki states JSON UI is unversioned and will eventually be replaced by Ore UI.

## Community research repository (`hawariii-bedrock-ui-research`, MIT)

Audit of 2026-10-03 with `node tools/vanilla-name-check.mjs` over the pinned files plus the mirror (222 files indexed):

| List | Checked | Found in vanilla 1.26.50 | Not found |
| --- | --- | --- | --- |
| `bindings.md` and `button-ids.md` | 78 | 59 | 19: `#is_hovered`, `#is_checked`, `#value`, `#max`, `#min`, `#progress`, `#current_index`, `#inventory_selected_slot`, `#item_count`, `#item_icon`, `#item_durability`, `#recipe_selected`, `#recipe_name`, `#collection_selected`, `#paperdoll_visible`, `#chat_message`, `#chat_input`, `#setting_value`, `#setting_name` |
| `collections.md` | 47 | 6 | 41 (for example `crafting_items`, `creative_items`, `settings_list`, `chat_messages`, `npc_buttons`, `server_list`; `collection_name` is a property name, not a collection) |
| `controls.md` | 19 | 11 | 8 are not JSON UI types at all: `scroll_panel`, `checkbox`, `radio_button`, `item_renderer`, `inventory_grid`, `hotbar`, `slot`, `progress_bar` |

Several missing names are marked "✅ Confirmed / Source: Vanilla UI" in that repository (for example `#is_hovered`). Treat the repository as a discovery aid only: cite a name from it only after the vanilla check finds it, and label the rest "not in vanilla 1.26.50". The six listed collection names that `node tools/vanilla-name-check.mjs` reports as vanilla collections are `inventory_items`, `hotbar_items`, `armor_items`, `container_items`, `world_list` and `world_templates`.

Community type names that are not JSON UI control types, with the vanilla construction they usually mean (confirm the spelling in `data/jsonui-spec.json` and the control in the pinned samples before use):

| Community name | What vanilla actually uses |
| --- | --- |
| `scroll_panel` | `scroll_view` with `scroll_content`, `scroll_view_port`, `scrollbar_box`, `scrollbar_track` |
| `checkbox`, `radio_button` | `toggle` (radio behaviour through `radio_toggle_group` and `toggle_group_forced_index`) |
| `progress_bar` | `image` with `clip_direction` / `clip_ratio`, or a `custom` control with `progress_bar_renderer` |
| `item_renderer` | `custom` with `renderer: inventory_item_renderer` and `#item_id_aux` |
| `inventory_grid`, `hotbar`, `slot` | `grid` with `collection_name` (`inventory_items`, `hotbar_items`, `armor_items`, `offhand_items`) and `grid_item_template` |

The same source lists `binding_type` and `collection_name` in one object; in vanilla `collection_name` sits on the grid, stack panel or collection panel control while `binding_collection_name` sits inside each binding entry, and collection-typed bindings always carry `binding_collection_name`.

## Result labels

- `confirmed`: found by `node tools/vanilla-name-check.mjs` at the pinned revision, or present in `data/jsonui-spec.json` with vanilla evidence.
- `documented-name`: present in an official table but absent from vanilla; report it as unverified, never as accepted.
- `community-documented`: Wiki or community repository text; cite with the revision and the audit result.
- `unresolved`: not found anywhere above.
