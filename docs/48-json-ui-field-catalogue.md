# JSON UI Field Catalogue

This is a schema-like working catalogue for Bedrock JSON UI element types and property groups. Use it as a fast lookup before opening schema files, JSON UI Dumper, Bedrock Wiki, or vanilla UI dumps.

Important:

- This is a practical reference, not a proof that every field works in every screen.
- Confirm high-risk fields against the target version and a working source file.
- Some historical snippets contain typos such as `hide_hypen`, `$fit_to_witdh`, or `enabled_scissor_test`. Prefer the exact spelling confirmed by schemas or vanilla dumps when implementing.

## Element Types And Inherited Groups

| Element type | JSON `type` | Property groups |
| --- | --- | --- |
| Panel | `panel` | `control`, `layout`, `data_binding` |
| InputPanel | `input_panel` | `input`, `focus`, `sound`, `control`, `layout`, `data_binding` |
| Image | `image` | `sprite`, `control`, `layout`, `data_binding` |
| Grid | `grid` | `grid`, `control`, `layout`, `data_binding` |
| Label | `label` | `text`, `control`, `layout`, `data_binding` |
| Button | `button` | `button`, `input`, `focus`, `sound`, `control`, `layout`, `data_binding` |
| Screen | `screen` | `screen`, `sound`, `control`, `layout`, `data_binding` |
| ScrollBox | `scroll_box` | `input`, `control`, `layout`, `data_binding` |
| StackPanel | `stack_panel` | `stack_panel`, `control`, `layout`, `data_binding` |
| Toggle | `toggle` | `toggle`, `input`, `focus`, `sound`, `control`, `layout`, `data_binding` |
| Slider | `slider` | `slider`, `input`, `focus`, `sound`, `control`, `layout`, `data_binding` |
| SliderBox | `slider_box` | `slider_box`, `input`, `control`, `layout`, `data_binding` |
| Dropdown | `dropdown` | `dropdown`, `toggle`, `input`, `focus`, `sound`, `control`, `layout`, `data_binding` |
| EditBox | `edit_box` | `text_edit`, `input`, `focus`, `sound`, `button`, `control`, `layout`, `data_binding` |
| Custom | `custom` | `custom`, `control`, `layout`, `data_binding` |
| ScrollView | `scroll_view` | `scroll_view`, `input`, `control`, `layout`, `data_binding` |
| ScrollTrack | `scroll_track` | `input`, `control`, `layout`, `data_binding` |
| Factory | `factory` | `control`, `layout`, `data_binding` |
| SelectionWheel | `selection_wheel` | `selection_wheel`, `input`, `focus`, `sound`, `control`, `layout`, `data_binding` |
| GridPageIndicator | `grid_page_indicator` | `grid`, `control`, `layout`, `data_binding` |
| LabelCycler | `label_cycler` | `cycler`, `control`, `layout`, `data_binding` |
| ImageCycler | `image_cycler` | `cycler`, `control`, `layout`, `data_binding` |
| CollectionPanel | `collection_panel` | `control`, `layout`, `data_binding` |

## Core Groups

### Control

| Property | Type notes |
| --- | --- |
| `controls` | array |
| `variables` | array or object |
| `visible` | boolean |
| `ignored` | boolean |
| `modifications` | array |
| `anims` | array |
| `disable_anim_fast_forward` | boolean |
| `animation_reset_name` | string |
| `enabled` | boolean |
| `layer` | integer |
| `alpha` | float |
| `propagate_alpha` | boolean |
| `clips_children` | boolean |
| `allow_clipping` | boolean |
| `clip_offset` | vector2 |
| `clip_state_change_event` | string |
| `enable_scissor_test` | boolean |
| `property_bag` | object |
| `selected` | boolean |
| `use_child_anchors` | boolean |
| `grid_position` | vector2 |
| `collection_index` | integer |
| `debug` | string |

### Layout

| Property | Type notes |
| --- | --- |
| `anchor_from`, `anchor_to` | anchor string such as `center`, `top_left`, `bottom_middle` |
| `contained` | boolean |
| `draggable` | boolean or direction-like value, depending on version |
| `follows_cursor` | boolean |
| `offset` | vector2 |
| `size` | vector2 |
| `max_size`, `min_size` | vector2 |
| `inherit_max_sibling_width`, `inherit_max_sibling_height` | boolean |
| `use_anchored_offset` | boolean |

### Data Binding

| Property | Type notes |
| --- | --- |
| `bindings` | array of binding objects |
| `binding_type` | `global`, `view`, `collection`, `collection_details`, `none` |
| `binding_name` | string |
| `binding_name_override` | string |
| `binding_collection_name` | string |
| `binding_collection_prefix` | string |
| `binding_condition` | `always`, `always_when_visible`, `visible`, `once`, `none`, `visibility_changed` |
| `source_control_name` | string |
| `source_property_name` | string expression |
| `target_property_name` | string |
| `resolve_sibling_scope` | boolean |

### Sprite

| Property | Type notes |
| --- | --- |
| `texture` | string path |
| `uv`, `uv_size` | vector2 |
| `nineslice_size` | integer or vector4 |
| `base_size` | vector2 |
| `color` | vector3 or color string |
| `tiled` | boolean or axis-like string |
| `tiled_scale` | vector2 |
| `clip_direction` | `left`, `right`, `up`, `down`, `center` |
| `clip_ratio` | float |
| `clip_pixelperfect` | boolean |
| `keep_ratio` | boolean |
| `bilinear` | boolean |
| `fill` | boolean |
| `grayscale` | boolean |
| `force_texture_reload` | boolean |
| `$fit_to_width` | boolean |
| `zip_folder` | string |
| `texture_file_system` | `InUserPackage`, `InAppPackage`, `RawPath`, `RawPersistent`, `InSettingsDir`, `InExternalDir`, `InServerPackage`, `InDataDir`, `InUserDir`, `InWorldDir`, `StoreCache` |
| `allow_debug_missing_texture` | boolean |
| `pixel_perfect` | boolean |

### Text

| Property | Type notes |
| --- | --- |
| `text` | string |
| `color`, `locked_color` | vector3 or string |
| `shadow` | boolean |
| `font_size` | `small`, `normal`, `large`, `extra_large` |
| `font_scale_factor` | float |
| `localize` | boolean |
| `line_padding` | number |
| `font_type` | `default`, `rune`, `unicode`, `smooth`, `MinecraftTen` |
| `backup_font_type` | string |
| `text_alignment` | string |
| `hide_hyphen` | boolean |
| `locked_alpha` | float |
| `enable_profanity_filter` | boolean |
| `notify_on_ellipses` | array |

## Input, Focus, And Screen Groups

### Input

| Property | Type notes |
| --- | --- |
| `button_mappings` | array |
| `modal`, `inline_modal` | boolean |
| `always_listen_to_input` | boolean |
| `always_handle_pointer` | boolean |
| `always_handle_controller_direction` | boolean |
| `hover_enabled` | boolean |
| `prevent_touch_input` | boolean |
| `consume_event`, `consume_hover_events` | boolean |
| `gesture_tracking_button` | string |

Button mapping object fields:

```text
ignored, from_button_id, to_button_id, mapping_type, scope,
input_mode_condition, ignore_input_scope, consume_event,
handle_select, handle_deselect, button_up_right_of_first_refusal
```

### Focus

```text
default_focus_precedence, focus_enabled, focus_wrap_enabled,
focus_magnet_enabled, focus_identifier, focus_change_down,
focus_change_up, focus_change_left, focus_change_right, focus_mapping,
focus_container, use_last_focus, focus_navigation_mode_left,
focus_navigation_mode_right, focus_navigation_mode_down,
focus_navigation_mode_up, focus_container_custom_left,
focus_container_custom_right, focus_container_custom_down,
focus_container_custom_up
```

Focus navigation modes seen in references:

```text
none, stop, custom, contained
```

### Screen

```text
render_only_when_topmost, screen_not_flushable, always_accepts_input,
render_game_behind, absorbs_input, is_showing_menu, is_modal,
should_steal_mouse, low_frequency_rendering, screen_draws_last,
vr_mode, force_render_below, send_telemetry, close_on_player_hurt,
cache_screen, load_screen_immediately, gamepad_cursor,
gamepad_cursor_deflection_mode, should_be_skipped_during_automation
```

## Component-Specific Groups

### Grid

```text
grid_dimensions, maximum_grid_items, grid_dimension_binding,
grid_rescaling_type, grid_fill_direction, precached_grid_item_count,
grid_item_template
```

### Stack Panel

```text
orientation
```

Common values:

```text
vertical, horizontal
```

### Button

```text
default_control, hover_control, pressed_control, locked_control
```

### Toggle

```text
radio_toggle_group, toggle_name, toggle_default_state,
toggle_group_forced_index, toggle_group_default_selected,
reset_on_focus_lost, toggle_on_button, toggle_off_button,
enable_directional_toggling, toggle_grid_collection_name,
checked_control, unchecked_control, checked_hover_control,
unchecked_hover_control, checked_locked_control, unchecked_locked_control,
checked_locked_hover_control, unchecked_locked_hover_control
```

### Slider

```text
slider_track_button, slider_small_decrease_button,
slider_small_increase_button, slider_steps, slider_direction,
slider_timeout, slider_collection_name, slider_name,
slider_select_on_hover, slider_selected_button, slider_deselected_button,
slider_box_control, background_control, background_hover_control,
progress_control, progress_hover_control
```

### Slider Box

```text
indent_control, default_control, hover_control, locked_control
```

### Dropdown

```text
dropdown_name, dropdown_content_control, dropdown_area
```

### Text Edit / Edit Box

```text
text_box_name, text_edit_box_grid_collection_name, constrain_to_rect,
enabled_newline, text_type, max_length, text_control,
place_holder_control, can_be_deselected, always_listening,
virtual_keyboard_buffer_control
```

Text type values seen in references:

```text
ExtendedASCII, IdentifierChars, NumberChars
```

### Scroll View

```text
scrollbar_track_button, scrollbar_touch_button, scroll_speed,
gesture_control_enabled, always_handle_scrolling, touch_mode,
scrollbar_box, scrollbar_track, scroll_view_port, scroll_content,
scroll_box_and_track_panel, jump_to_bottom_on_update,
allow_scroll_even_when_content_fits
```

### Selection Wheel

```text
inner_radius, outer_radius, state_controls, slice_count, button_name,
iterate_left_button_name, iterate_right_button_name, initial_button_slice
```

### Cyclers

```text
target_cycler_to_compare, next_sub_page_button_name,
prev_sub_page_button_name, text_labels, images
```

## Renderers And Custom Controls

Custom renderer property:

```text
renderer
```

Renderer names seen in compiled references include:

```text
hover_text_renderer, 3d_structure_renderer, splash_text_renderer,
ui_holo_cursor, trial_time_renderer, panorama_renderer,
actor_portrait_renderer, banner_pattern_renderer, live_player_renderer,
web_view_renderer, hunger_renderer, bubbles_renderer, mob_effects_renderer,
cursor_renderer, progress_indicator_renderer, camera_renderer,
horse_jump_renderer, armor_renderer, hotbar_renderer,
hotbar_cooldown_renderer, heart_renderer, horse_heart_renderer,
vignette_renderer, name_tag_renderer, flying_item_renderer,
inventory_item_renderer, credits_renderer, debug_screen_renderer,
gradient_renderer, paper_doll_renderer, progress_bar_renderer,
debug_overlay_renderer, background_renderer, bohr_model_renderer,
experience_renderer, menu_background_renderer
```

Renderer-specific fields can include:

```text
gradient_direction, color1, color2, text_color, background_color,
primary_color, secondary_color, camera_tilt_degrees, starting_rotation,
use_selected_skin, use_uuid, use_skin_gui_scale, use_player_paperdoll,
rotation, end_event
```

AI rule:

- Built-in renderers are context-dependent. Do not assume an inventory or HUD renderer works inside arbitrary server forms.

## Animation Fields

Animation blocks use `anim_type`, not `type`.

Common fields:

```text
anim_type, duration, next, destroy_at_end, play_event, end_event,
start_event, reset_event, easing, from, to, initial_uv, fps,
frame_count, frame_step, reversible, resettable,
scale_from_starting_alpha, activated
```

`anim_type` values seen in references:

```text
alpha, clip, color, flip_book, offset, size, uv, wait,
aseprite_flip_book
```

Easing values seen in sample references:

```text
linear, spring,
in_quad, out_quad, in_out_quad,
in_cubic, out_cubic, in_out_cubic,
in_quart, out_quart, in_out_quart,
in_quint, out_quint, in_out_quint,
in_sine, out_sine, in_out_sine,
in_expo, out_expo, in_out_expo,
in_circ, out_circ, in_out_circ,
in_bounce, out_bounce, in_out_bounce,
in_back, out_back, in_out_back,
in_elastic, out_elastic, in_out_elastic
```

## TTS And Accessibility Fields

```text
tts_name, tts_control_header, tts_section_header,
tts_control_type_order_priority, tts_index_priority,
tts_toggle_on, tts_toggle_off, tts_override_control_value,
tts_inherit_siblings, tts_value_changed, ttsSectionContainer,
tts_ignore_count, tts_skip_message, tts_value_order_priority,
tts_play_on_unchanged_focus_control, tts_ignore_subsections,
text_tts, use_priority, priority
```

## Practical AI Use

When implementing:

1. Pick the element type.
2. Use the inherited groups table to know which property families are plausible.
3. Search included sources for the exact field before relying on it:

```powershell
rg -n '"clip_ratio"|"scroll_view_port"|"always_accepts_input"|"animation_reset_name"' references/official/bedrock-samples-ui references/source-packs references/local-examples -g *.json -g *.jsonc
```

4. If the field is absent from working sources, label it as schema-like or unverified.
5. Prefer a small working patch over adding every possible property.

