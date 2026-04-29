# Custom Toggle Patterns

Use these as behavior patterns, not copy-paste source. Rename controls, namespaces, variables, and texture paths for the target pack.

## Hover Pulse Event

Local button templates use a custom hover event on button-like controls.

```json
{
  "to_button_id": "$on_hover",
  "mapping_type": "pressed"
}
```

Community shorthand also appears as:

```json
{
  "to_button_id": "button.custom.hover_event"
}
```

Put the event on the animated content:

```json
{
  "animation_reset_name": "$on_hover",
  "anims": ["@namespace.hover_anim"]
}
```

## Press Event Animation

For a simple press-driven animation, use a button-style control and emit a custom event.

```json
{
  "type": "button",
  "$pressed_button_name": "button.custom.play_anim",
  "button_mappings": [
    {
      "from_button_id": "button.menu_select",
      "to_button_id": "$pressed_button_name",
      "mapping_type": "pressed"
    }
  ]
}
```

This is often more reliable than trying to make `common.toggle` expose an external press event.

For repeated animation, keep the animated element alive and use a replayable event:

```json
{
  "anim_type": "offset",
  "duration": 0.35,
  "from": [48, 0],
  "to": [0, 0],
  "play_event": "button.custom.play_anim",
  "resettable": true
}
```

If the same control refuses to replay after a state swap, split state and motion:

- state event changes visible scene or selected toggle
- motion event plays animation on a stable wrapper
- bridge control maps one user press to both events

## Toggle-State Animated Illusion

The animated toggle factory pattern combines:

- a real toggle, usually derived from `common_toggles.light_ui_toggle`
- a `$toggle_view_binding_name` or source control name
- `collection_panel` controls for entry and exit
- factories that create `$ent` and `$exit` animated children
- bindings from `#toggle_state` to `#alpha` and `#collection_length`

Entry panels use the toggle state:

```json
{
  "binding_type": "view",
  "source_control_name": "$toggle_view_binding_name",
  "source_property_name": "(1 * #toggle_state)",
  "target_property_name": "#collection_length"
}
```

Exit panels use the inverse:

```json
{
  "binding_type": "view",
  "source_control_name": "$toggle_view_binding_name",
  "source_property_name": "(1 * (not #toggle_state))",
  "target_property_name": "#collection_length"
}
```

Use this when the user expects a toggle to animate differently when turned on and off.

For multi-step state cycling, do not rely on one toggle to expose on/off output. Use one of these:

- a button that emits a custom event into a `label_cycler`/`image_cycler`
- a radio-toggle group where each state has its own hidden toggle
- a factory illusion where state creates the next animated child
- a server-form-specific fallback where the feature state is driven by distinct route buttons

## Focus And Hover Visuals

Focus border color and hover visuals are implemented by changing the actual child controls used by the toggle states:

- `checked_control`
- `unchecked_control`
- `checked_hover_control`
- `unchecked_hover_control`
- locked variants if used

Modify the local toggle template or create a custom toggle that provides its own state controls. Avoid relying on a nonexistent single focus-border-color property.
