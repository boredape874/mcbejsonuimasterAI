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

## Dynamic size and value-driven layout

When the user asks for panels or controls that change by value or content, split the work:

- Static outer skeleton: use IR/tools for the safe region, anchor, fixed bounds, alignment, and spacing.
- Dynamic inner content: hand-finish raw JSON UI with content sizing, bindings, clipping, collections, or animations.

Common mappings:

| User intent | Recommended JSON UI direction |
| --- | --- |
| Panel grows with text/buttons | bounded parent panel + child using `"100%c"` or `"100%cm"` where verified |
| Long text may overflow | fixed safe area + clipped label or scroll region |
| Progress/HP/EXP changes | fixed background image + foreground using `clip_ratio` and `clip_direction` |
| Parts show/hide by state | separate controls with view binding to `#visible` |
| Color changes by state | separate controls or state-derived color binding when verified |
| Number of rows changes | collection/factory pattern plus scroll region |
| Carousel/scrolling animation | clipped parent + animated child offset |

Do not make the whole layout push nearby elements unless the user explicitly wants reflow. Bedrock JSON UI is safer when dynamic content is bounded.

## Control texture questions

Before implementing button rows, scroll views, progress bars, or icon controls, capture the texture policy:

- vanilla textures only
- reuse existing target RP textures
- add custom textures later
- simple panels with minimal texture dependencies
- mixed vanilla frame plus custom icons

For buttons, ask whether `default_control`, `hover_control`, `pressed_control`, `locked_control`, and selected/checked visuals are needed. For scroll areas, ask whether the scrollbar should be visible, hidden, vanilla, or custom skinned.
