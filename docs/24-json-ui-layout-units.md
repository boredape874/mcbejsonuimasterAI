# JSON UI Layout Units

Use this when the AI must place controls without assuming a fixed screen size.

## Common size values

| Value | Practical meaning |
| --- | --- |
| number | Pixel-like UI unit. Stable for fixed icons, slots, and buttons. |
| `"100%"` | Parent-relative size. Use for full panels and overlays. |
| `"fill"` | Fill remaining stack or layout space. Common in horizontal/vertical stacks. |
| `"default"` | Let the control choose default content size. Common for labels. |
| `"100%c"` | Content-relative size. Useful for labels or images that wrap around children. |
| `"100%cm"` | Content-relative with max behavior. Often appears in vanilla stack/content sizing. |
| `"100%sm"` | Sibling/stack-measured sizing in vanilla templates. Treat as existing-template behavior unless verified. |
| `"100%x"` / `"100%y"` | Cross-axis relative sizing. Useful for ratio-like layout. |
| `"100% - 4px"` | Expression-style size used heavily by vanilla. Keep spacing explicit. |

## Anchors and offsets

- `anchor_from` is the point on this control.
- `anchor_to` is the point on the parent.
- `offset` moves from that anchor relationship.

Stable HUD pattern:

```json
{
  "type": "panel",
  "anchor_from": "top_right",
  "anchor_to": "top_right",
  "offset": [-4, 4],
  "size": ["100%c", "100%c"]
}
```

## Layering

`layer` controls draw order inside the same screen area. Use it deliberately:

- background image: low layer
- content labels/icons: middle layer
- hover/focus/click overlays: higher layer

Do not use huge layers to hide structural problems. First check parent order and insertion point.

## Device assumptions

Never claim Bedrock has one universal base resolution. JSON UI must survive:

- desktop window sizes
- mobile/touch layouts
- pocket vs classic inventory screens
- safe area differences
- chat/HUD scaling settings

## AI placement rules

- Use fixed numeric sizes for slots, icon buttons, and vanilla-like controls.
- Use percent/fill sizes for backgrounds and parent panels.
- Prefer anchoring from the nearest stable edge, not from screen center unless the UI is truly centered.
- For mobile-sensitive work, check pocket-specific screens and touch controls.
- Preserve existing vanilla sizing expressions when modifying vanilla-derived controls.

