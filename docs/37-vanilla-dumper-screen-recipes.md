# Vanilla Dumper Screen Recipes

This document lists practical recipes discovered from dumped vanilla UI files.

Use it when the AI needs a real vanilla example before modifying a custom pack.

## HUD screen

Source:

- `references/official/bedrock-samples-ui/hud_screen.json`

High-value recipes:

| Recipe | Vanilla objects to inspect | Use |
| --- | --- | --- |
| actionbar fade | `hud_actionbar_text`, `anim_actionbar_text_alpha_out` | PMMP actionbar notification UI |
| title/subtitle chain | `anim_title_text_alpha_in`, `anim_title_text_alpha_stay`, `anim_title_text_alpha_out` | custom title overlays |
| auto-save sprite sheet | `auto_save_animation`, `auto_save` | `flip_book` and `uv` animation |
| hotbar item icon | `hotbar_hud_item_icon@common.item_renderer` | item renderer binding pattern |
| hotbar button mapping | `gui_hotbar_slot_button_prototype` | controller/mouse input patterns |
| built-in renderers | `heart_renderer`, `hunger_renderer`, `armor_renderer` | inspect renderer names and limitations |
| player position | `player_position` | global visibility/text binding pattern |

Do not copy the whole HUD screen. Extract one object plus the control that references it.

## Chat screen

Source:

- `references/official/bedrock-samples-ui/chat_screen.json`

High-value recipes:

| Recipe | Vanilla objects to inspect | Use |
| --- | --- | --- |
| chat message list | `messages_stack_panel`, `messages_scrolling_panel` | scroll-to-bottom chat log |
| text edit input | `text_edit_box@common.text_edit_box` | chat input and focus bindings |
| autocomplete item renderer | `auto_complete_panel_contents_with_item` | collection item renderer and text binding |
| autocomplete grid | `auto_complete_grid` | dynamic suggestion list |
| controller mappings | `text_edit_box` button mappings | cross-device input behavior |

## Chest screen

Source:

- `references/official/bedrock-samples-ui/chest_screen.json`

High-value recipes:

| Recipe | Vanilla objects to inspect | Use |
| --- | --- | --- |
| 9x3 grid | `small_chest_grid` | chest-like custom form |
| 9x6 grid | `large_chest_grid` | large inventory custom screen |
| container item template | `chest_grid_item@common.container_item` | item collection cell |
| desktop/pocket branching | `small_chest_screen`, `large_chest_screen` variables | responsive container screens |
| selected item factories | `selected_item_details_factory`, `item_lock_notification_factory` | inventory helper overlays |

## Inventory screen

Source:

- `references/official/bedrock-samples-ui/inventory_screen.json`

High-value recipes:

| Recipe | Vanilla objects to inspect | Use |
| --- | --- | --- |
| animated top tabs | `tab_offset_anim`, `tab_wait_anim`, `top_tab` | tab strip animation |
| focus navigation | `focus_identifier`, `focus_change_left/right/up` in tab controls | keyboard/controller UX |
| toggle group tabs | `toggle_group_forced_index`, `toggle_state_binding_name` | tabbed custom screens |

## UI common

Source:

- `references/official/bedrock-samples-ui/ui_common.json`

High-value recipes:

| Recipe | Vanilla objects to inspect | Use |
| --- | --- | --- |
| scroll handle fade | `anim_scrollbar_box_fadeout`, `touch_scrollbar_box_image` | polished scrollbars |
| reusable scrolling panel | `scrolling_panel_base`, `scroll_view_control` | long lists |
| common buttons | button templates and image states | consistent button styling |
| inventory helpers | `container_item`, `item_renderer`, selected item detail controls | inventory-like UI |

## Server form

Source:

- `references/official/bedrock-samples-ui/server_form.json`
- local/custom examples listed in `docs/34-binding-patterns-value-index.md`

High-value recipes:

| Recipe | Use |
| --- | --- |
| title/body binding | route long/custom forms by title prefix |
| `form_buttons` collection | custom buttons and button textures |
| `collection_details` | get button-specific data inside a factory |
| scroll wrapper | long form content with `common.scrolling_panel` |

## AI extraction rule

For every recipe:

1. Search the target object name.
2. Open the object and the object that references it.
3. Copy the smallest dependency chain.
4. Rename namespace references to the target pack namespace.
5. Confirm any texture path through vanilla asset workflow if it is not already in target pack.
