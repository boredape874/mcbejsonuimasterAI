---
name: mcbe-json-ui-vanilla-presets
description: Use when the user asks for a screen that should reuse vanilla MCBE preset frames (modals, dialogs, form bodies, content buttons, scrolling panels). Pairs the IR `extends` field with `data/presets-catalog.json` to emit `id@common_dialogs.main_panel_no_buttons` style references with correct `$variables` instead of hand-rolling the entire skeleton.
---

# MCBE JSON UI — Vanilla Presets

Use this skill when:

- The screen is a dialog, server form, settings panel, or inventory-style modal
- The user wants the vanilla look (titlebar, OK/Cancel, light/dark content rows)
- You'd otherwise have to author dozens of nested `panel`/`button` controls by hand

## Source of truth

- `data/presets-catalog.json` — every preset reference the kit knows about, with the matching `$variable` keys and a `fits_kind` hint.
- `data/jsonui-spec.json` — full property/anchor/binding catalog (do not invent property names).

## Authoring rule

In the IR, set `extends:` on the element. Layout (`anchor`, `pos`, `size`) is still solved deterministically; the compiler emits:

```json
{ "frame@common_dialogs.main_panel_no_buttons": {
    "size": [560, 320],
    "anchor_from": "center",
    "anchor_to": "center",
    "offset": [-280, -160],
    "variables": { "$title_panel": "common_dialogs.standard_title_label", "...": "..." },
    "bindings": [{ "binding_name": "#title_text" }]
} }
```

## Selection guide

| User intent | Preset to extend | Notes |
|---|---|---|
| Plain centered modal frame | `common_dialogs.main_panel_no_buttons` | Pair with `$title_panel`, `$child_control` |
| Confirm dialog (OK/Cancel) | `common_dialogs.main_panel_two_buttons` | Provide `$button1_panel`, `$button2_panel` |
| Form-style scrolling list | `server_form.long_form` | The body grid binds to `#form_buttons` collection |
| Light menu row | `common_buttons.light_content_button` | Set `$pressed_button_name` and `$button_content` |
| Close 'X' icon | `common.cancel_button` | Set `$pressed_button_name` |
| Generic vertical scroll body | `common.scrolling_panel` | Set `$scrolling_content` to a child reference |

## Example

See `examples/ir/preset_modal.yaml`. Run:

```
node tools/run.mjs workspace/<name>/ir.yaml
```

The validator (`tools/validate.mjs`) checks the emitted nodes against `data/jsonui-spec.json` and warns on unknown anchors, font sizes, layer overflows, and malformed bindings.
