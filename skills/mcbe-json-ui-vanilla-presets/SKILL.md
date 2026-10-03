---
name: mcbe-json-ui-vanilla-presets
description: Use when the user asks for a screen that should reuse vanilla MCBE preset frames (modals, dialogs, form bodies, content buttons, scrolling panels). Pairs the IR `extends` field with `data/presets-catalog.json` to emit `id@common_dialogs.main_panel_no_buttons` style references with correct `$variables` instead of hand-rolling the entire skeleton.
---

# MCBE JSON UI — Vanilla Presets

Use this skill when:

- The screen is a dialog, server form, settings panel, or inventory-style modal
- The user wants the vanilla look (titlebar, OK/Cancel, light/dark content rows)
- You'd otherwise have to author dozens of nested `panel`/`button` controls by hand

## Contract

- Input: intended vanilla screen role, target profile, content controls, and required variables/bindings.
- Output: selected preset reference, required variables, IR `extends` usage, and validation artifacts.
- Success: the preset exists in the catalog, emitted references resolve, layout constraints remain explicit, and unknown variables are not invented.

If `data/skill-tool-profiles.json` exists, read only the `mcbe-json-ui-vanilla-presets` entry. Use registered catalog or compile commands only after confirming their implementations are present.

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
| Plain centered modal frame | `common_dialogs.main_panel_no_buttons` | Pair with `$child_control` and `$text_name` (`$title_panel` is still set by vanilla `server_form.long_form` but no 1.26.50 template consumes it) |
| Confirm dialog (OK/Cancel) | `common_dialogs.main_panel_two_buttons` | Provide `$top_button_panel`, `$bottom_button_panel` (confirmed from official bedrock-samples v1.26.50.4; `$button1_panel`/`$button2_panel` were never vanilla names) |
| Form-style scrolling list | `server_form.long_form` | The body buttons come from the `form_buttons` collection (`#form_button_contents` → `#collection_length`, items read `#form_button_text`) |
| Light menu row | `common_buttons.light_content_button` | Set `$pressed_button_name` and `$button_content` |
| Text button like vanilla form buttons | `common_buttons.light_text_button` | Set `$button_text` and `$pressed_button_name`; `$button_text_max_size` bounds the label |
| Close 'X' icon | `common.close_button` | Set `$close_button_to_button_id` (confirmed from official bedrock-samples v1.26.50.4; `common.cancel_button` does not exist in vanilla) |
| Generic vertical scroll body | `common.scrolling_panel` | Set `$scrolling_content` to a child reference |

## Example

See `examples/ir/preset_modal.yaml`. Run:

```
node tools/run.mjs workspace/<name>/ir.yaml
```

The validator (`tools/validate.mjs`) checks the emitted nodes against `data/jsonui-spec.json` and warns on unknown anchors, font sizes, layer overflows, and malformed bindings.
