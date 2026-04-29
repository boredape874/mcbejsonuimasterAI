# Visual Server Form Patterns

Use this for high-polish server form skins, image-backed form rows, and custom button layouts.

## Custom Button Grid

One useful compact pattern is:

- Route the custom form with a title token.
- Replace a normal long form body with a custom panel.
- Render selected `form_buttons` indexes into manually placed vertical and horizontal button strips.
- Use `common.button` with custom `default`, `hover`, and `pressed` controls.
- Bind `#form_button_text`, `#form_button_texture`, and `collection_details` from `form_buttons`.
- If `#form_button_texture` starts with `textures`, render it as an image; otherwise parse it as an item aux/id for an item renderer.
- Optional hover text can be shown with `hover_text_renderer` only for buttons whose text contains a hover marker.

This is good for radial menus, controller-like button pads, and compact skill/action panels. It is not a general replacement for long scrolling lists because every index is manually placed.

## Image Row In Forms

An image form pattern can encode image rows into `form_buttons` text:

```text
<image-key><padding payload><texture suffix>
```

The UI then:

- detects the image key inside `#form_button_text`
- hides the normal text row
- derives a `textures/...` path from the suffix
- uses fixed-width or padded text to influence image sizing/offset

Use this when Script API or PMMP form APIs do not expose a first-class image row, but the UI needs image separators or visual previews inside a form.

Rules:

- Keep the image key private to that form family.
- Do not expose the raw key as visible text.
- Clamp or generate padding length on the server side; JSON UI is poor at validating malformed payloads.
- Prefer pack-owned texture paths and verify they exist.

## Polished Header Form

For high-polish server form designs:

- Keep `third_party_server_screen` thin and route to a form template.
- Use a fixed central form shell with a header region, close button, content region, and button item template.
- Make header buttons a factory/collection of state buttons when they are part of the protocol.
- Use text markers to express button sizing/state only if the server controls all form labels.
- Split the real implementation into `forms/<feature>/layout.json`, `buttons.json`, `state.json`, and `protocol.json` once it grows beyond a prototype.

## Cautions

- Do not copy third-party comments, credits, or texture paths into a target pack.
- If a reference depends on a helper library namespace, either include that library intentionally or rewrite the controls into local templates.
- Marker-heavy button text is a protocol. Document the exact markers in `protocol.json` or the equivalent feature notes.
