---
name: mcbe-json-ui-custom-toggles
description: Design, debug, and implement custom Minecraft Bedrock JSON UI toggles, toggle animation illusions, hover/focus visuals, toggle-state factories, and button-event alternatives. Use when working with common.toggle, common_toggles, ui_template_toggles.json, local button/toggle templates, focus border colors, hover animation, or toggle-driven UI animation in Bedrock JSON UI.
---

# MCBE JSON UI Custom Toggles

Use this skill for Bedrock JSON UI toggle behavior, especially when a toggle should look animated, change hover/focus visuals, or drive other controls.

## Workflow

1. Read `references/source-map.md` to pick the closest internal reference family before editing JSON UI.
2. If the problem is a simple click-triggered animation, prefer a button or button-like template with a custom `$pressed_button_name`.
3. If the problem needs persistent on/off visuals, use a real toggle and bind from `#toggle_state`.
4. If the problem needs on/off entry/exit animation, use the animated-toggle template pattern: toggle state drives factory-created animated child controls.
5. If the problem is hover animation, use a `button_mappings` pulse event and `animation_reset_name` on the animated child.
6. If the problem is focus border color, modify the actual visual controls in the toggle template or make a custom toggle. Do not search for a magic focus-color property first.

## Decision Rules

- `toggle_on_button` and `toggle_off_button` are input events the toggle listens for. Treat them as inputs, not reliable external output events for unrelated animations.
- For external animation from a press, `common_buttons.light_text_button` or a custom `button` with `$pressed_button_name` is usually more reliable than `common.toggle`.
- For animated toggles, create an illusion: the toggle changes state, then `collection_panel` plus `factory` creates an animated `ent` or `exit` child based on `#toggle_state`.
- For hover pulse animations, local button templates show a practical pattern: a mapping with only `to_button_id` can emit a custom hover event; many working files also include `"mapping_type": "pressed"`.
- Keep server forms conservative. If a custom event closes or consumes the form, fall back to visible `form_buttons` or a non-submitting button/toggle pattern proven in local references.

## References

- `references/source-map.md`: internal reference families to inspect first.
- `references/patterns.md`: implementation patterns and minimal snippets.
- `references/community-notes.md`: community-derived behavior notes and caveats.
