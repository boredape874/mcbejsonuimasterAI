---
name: mcbe-json-ui-custom-toggles
description: Design, debug, and implement custom Minecraft Bedrock JSON UI toggles, toggle animation illusions, hover/focus visuals, toggle-state factories, and button-event alternatives. Use when working with common.toggle, common_toggles, ui_template_toggles.json, local button/toggle templates, focus border colors, hover animation, or toggle-driven UI animation in Bedrock JSON UI.
---

# MCBE JSON UI Custom Toggles

Use this skill for Bedrock JSON UI toggle behavior, especially when a toggle should look animated, change hover/focus visuals, or drive other controls.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: `references/official/bedrock-samples-ui` at the revision in `references/official/bedrock-samples-ui.lock.json`, `node tools/vanilla-name-check.mjs <name>` for any control, `#binding`, `$variable`, button id, renderer or screen file, the full local mirror under `references/upstreams/bedrock-samples` when present, and `docs/83-vanilla-ui-1.26.50-diff.md` for names that moved or disappeared.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

## Contract

- Input: target toggle or button template, required states and events, and the closest working source.
- Output: chosen interaction pattern, exact controls/events to edit, and verification notes for each state.
- Success: state ownership is explicit, default and hover/focus/pressed behavior is reachable, and server-form submission behavior is not accidentally consumed.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-custom-toggles` entry. Use only registered commands whose implementation is present; otherwise validate from source structure and Bedrock runtime evidence.

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
