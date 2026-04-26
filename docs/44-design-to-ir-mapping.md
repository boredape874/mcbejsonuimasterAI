# 44 — Design → IR Mapping

Use this when `docs/39-design-recommendation-catalog.md` already gave a design family and starting sizes, and you now need to express that as IR (`docs/41-ir-spec.md`).

This document is **additive** to `docs/39`. It does not change the design choices in `docs/39`; it only shows how to encode them as constraints.

## Default mapping rules

| docs/39 element | IR encoding |
| --- | --- |
| Full modal root panel `["100%","100%"]` | omit `root` (default) or set `root.size: [base_w, base_h]` |
| Center modal body | one `panel` element with `anchor: center`, `pos: [0,0]`, explicit px `size` |
| Bottom dialogue panel | `anchor: bottom_middle`, `pos: [0, -<inset>]`, `size: [<w>, <h>]` |
| Side navigation column | `anchor: left_middle` on the column, `align_x(edge: start)` on its child buttons |
| Body text scroll region | `kind: scroll`, full width inside the body |
| Form button row | child of body, `anchor: bottom_middle`, `same_size + equal_gap_x + align_y(edge: end)` for the children |
| Icon button square (16–24 px) | `kind: button`, `same_size` across the row |
| List item / card row | `kind: panel`, `same_height` + `equal_gap_y` |
| Outer padding 4–10 px | encoded by `pos` insets, not by a separate "padding" property |

## Pattern recipes

### A. Two-button confirmation modal
```yaml
elements:
  - { id: panel,   kind: panel, anchor: center,        pos: [0,0],   size: [320,160] }
  - { id: title,   parent: panel, kind: label, anchor: top_middle, pos: [0,12], size: [260,18] }
  - { id: body,    parent: panel, kind: label, anchor: center,    pos: [0,-8], size: [280,60] }
  - { id: btn_no,  parent: panel, kind: button, anchor: bottom_middle, pos: [-70,-12], size: [120,32] }
  - { id: btn_yes, parent: panel, kind: button, anchor: bottom_middle, pos: [ 70,-12], size: [120,32] }
constraints:
  - { op: same_size,    ids: [btn_no, btn_yes] }
  - { op: symmetric_x,  ids: [btn_no, btn_yes] }
  - { op: align_y,      ids: [btn_no, btn_yes], edge: end }
```

### B. Top tab row
```yaml
constraints:
  - { op: same_size,   ids: [tab_a, tab_b, tab_c, tab_d] }
  - { op: align_y,     ids: [tab_a, tab_b, tab_c, tab_d], edge: start }
  - { op: equal_gap_x, ids: [tab_a, tab_b, tab_c, tab_d], gap: 4 }
```

### C. Sidebar list (fixed-width column)
```yaml
constraints:
  - { op: same_width,  ids: [card_1, card_2, card_3] }
  - { op: align_x,     ids: [card_1, card_2, card_3], edge: start }
  - { op: equal_gap_y, ids: [card_1, card_2, card_3], gap: 6 }
```

### D. Header label centered above body
```yaml
constraints:
  - { op: align_x, ids: [header, body], edge: center }
```

### E. Pin two icons to opposite corners of a header
```yaml
constraints:
  - { op: edge_eq, a: "icon_left.left",  b: "header.left" }
  - { op: edge_eq, a: "icon_right.right", b: "header.right" }
  - { op: align_y, ids: [icon_left, icon_right], edge: center }
```

## When NOT to use IR

If the design choice from `docs/39` includes:

- inventory-style hardcoded slot positions (Bedrock hardcodes some) — leave as raw JSON, see `docs/19`
- vanilla-derived templates that already use `%c`/`inherit_max_sibling_*` — keep raw, see `docs/15`/`docs/24`
- screens whose layout is dominated by a single dynamic binding/collection — start raw, then refactor only the static skeleton into IR if useful

For these, prefer the knowledge-layer skills directly.
