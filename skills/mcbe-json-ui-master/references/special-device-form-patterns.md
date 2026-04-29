# Special Device Form Patterns

Use for server forms that should look like a phone, PDA, guidebook, profile device, or quest book.

Open the full project doc first when available:

- `../../../docs/62-special-form-device-ui-patterns.md`

## Minimal Checklist

1. Keep the normal `long_form` fallback.
2. Add route detection in `server_form.json` from a hidden title/body marker.
3. Render a fixed shell image.
4. Overlay named regions: top, left, middle, bottom, side actions.
5. In each region, use a factory over `form_buttons`.
6. Gate each button by a neutral hidden marker.
7. Use one shared button template with collection bindings.
8. Map clicks to `button.form_button_click`.
9. Replace every restricted texture paths.
10. Keep default/hover/pressed controls the same size.

## Visual Fit

- Device shell is fixed-size or fixed-aspect.
- Dynamic text never resizes the shell.
- Labels have explicit `size`.
- Repeated region buttons use one width, one height, and one gap.
- Long text moves to a detail page or scroll region.

