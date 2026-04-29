# Community Notes

These notes are user-provided community findings. Treat them as practical heuristics and verify against local JSON where possible. Public answers should describe the behavior, not the person, server, original post, or pack name.

## Hover Animation On Toggles

A practical hover animation pattern is to emit a custom button event from `button_mappings` using only `to_button_id`, or using `to_button_id` plus `"mapping_type": "pressed"` when the local template already follows that shape. Reset the animated child with `animation_reset_name`.

## Toggle Output Events

`common_toggles.light_text_toggle` is not a reliable source of separate external on/off output events for unrelated controls. For simple press-driven animation, use a button-style control with `$pressed_button_name`. For persistent toggle state, bind from `#toggle_state`.

## Animated Toggle Factory Illusion

The reliable animated-toggle approach is a combination of a real toggle and factories that create animated child elements. The toggle owns state; the factory-created children provide entry and exit animation.

## Focus Border Color

Focus and hover visuals are controlled by the actual state controls used by the toggle. Edit or replace the controls for default, hover, checked, unchecked, focused, and locked states instead of searching for a single focus-border-color property.
