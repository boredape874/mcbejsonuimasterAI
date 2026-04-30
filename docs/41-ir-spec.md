# 41 — IR Spec

The IR (Intermediate Representation) is a YAML format consumed by the Node tool layer (`tools/ir-validate.mjs`, `tools/solve.mjs`, `tools/compile.mjs`).

It describes **layout intent** for a single Bedrock JSON UI screen and is intentionally narrower than raw JSON UI: bindings, animations, and dynamic data are out of scope for the IR. Those are added afterward as raw JSON patches per `docs/17`, `docs/19`, `docs/33`–`docs/36`.

The canonical schema is `schemas/ir.schema.json`.

## Top-level fields

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `screen` | snake_case string | required | Logical name; also default namespace and root panel name. |
| `namespace` | snake_case string | `screen` | Override JSON UI namespace if needed. |
| `base_resolution` | `[w, h]` ints | `[1920, 1080]` | Reference resolution. |
| `gui_scale` | int 1–8 | `3` | Renderer hint only. |
| `units.allowPercent` | bool | `false` | Records that the final hand-finished JSON may use dynamic Bedrock units. The solve/run pipeline still requires numeric pixel sizes. |
| `root.size` / `root.anchor` / `root.pos` | optional | full screen at `top_left`, `[0,0]` | Overrides the default root panel. The solver and compiler both honor this root rect. |
| `elements` | list of `element` | required | The layout. |
| `constraints` | list of `constraint` | `[]` | Declared layout intents (symmetry, alignment, etc.). |

## Element

```yaml
- id: snake_case            # required, unique within the file
  parent: snake_case | __root__
  kind: panel | image | label | button | stack_h | stack_v | scroll
  anchor: <one of 9 anchors>
  pos: [dx, dy]             # pixels from the chosen anchor on the parent
  size: [w, h]              # pixels (numbers) by default
  auto_size: { ... }        # optional pre-solve measurement for text/image/grid
  collection: { ... }       # optional grid collection metadata
  z: 0                      # higher draws on top
  props: { ... }            # raw JSON UI props merged at compile time
```

### Anchors

`top_left`, `top_middle`, `top_right`, `left_middle`, `center`, `right_middle`, `bottom_left`, `bottom_middle`, `bottom_right`.

### `pos` semantics

- If anchor includes `left` → `pos.x` is offset from parent's left edge (positive = inward).
- If anchor includes `right` → `pos.x` is offset from parent's right edge (negative = inward inset).
- If anchor includes `middle`/`center` on x → `pos.x` is offset from parent's horizontal center.
- Same on y for `top` / `bottom` / `middle`.

This matches Bedrock JSON UI behavior with `anchor_from = anchor_to = <anchor>` and `offset = pos`.

## Pre-solve Sizing

Use `auto_size` when the AI needs a deterministic size before solving but the user described the control by content rather than pixels.

### Text labels

```yaml
- id: title
  kind: label
  size: [0, 0]
  auto_size:
    mode: text
    padding: [6, 2]
  props:
    text: "SHOP MENU"
    localize: false
    font_size: large
    font_scale_factor: 1.5
```

The tool estimates a single-line width and line height from `props.text`, `font_size`, and `font_scale_factor`, then adds x/y padding. This is an estimate for layout safety, not a Bedrock font renderer.

### Image aspect ratio

```yaml
- id: icon
  kind: image
  size: [64, 0]
  auto_size:
    mode: image_aspect
    aspect: [2, 1]
  props:
    texture: textures/ui/example
```

If one axis is zero, the tool derives it from the declared aspect ratio. If both axes are zero, provide `source_size` and optional `scale`.

### Server-form/HUD collection grids

```yaml
- id: button_grid
  kind: collection_grid
  size: [0, 0]
  auto_size: { mode: collection_grid }
  collection:
    name: form_buttons
    dimensions: [3, 2]
    maximum_items: 6
    item_template: server_form.form_button
    item_size: [40, 40]
    gap: [6, 8]
    length_binding: "#form_button_contents"
```

`collection_grid` (or the alias `collection_panel`) compiles to a Bedrock `grid` with `collection_name`, `grid_dimensions`, `maximum_grid_items`, and `grid_item_template`. `item_size` and `gap` are solver-only footprint hints so the parent panel and surrounding HUD/form controls can be aligned accurately.

## Constraints

All constraints are evaluated to a fixed point (max 32 iterations). Conflicts are reported in `solved.json.log`.

### Pair constraints

```yaml
- { op: symmetric_x, ids: [a, b] }   # mirror about parent center on X
- { op: symmetric_y, ids: [a, b] }
```

### Group constraints

```yaml
- { op: align_x,    ids: [a, b, c], edge: start | center | end }   # default start
- { op: align_y,    ids: [a, b, c], edge: start | center | end }
- { op: center_group_x, ids: [a, b, c] }   # center the whole group in the common parent
- { op: center_group_y, ids: [a, b, c] }
- { op: same_size,  ids: [a, b, c] }
- { op: same_width, ids: [a, b, c] }
- { op: same_height,ids: [a, b, c] }
```

### Gap constraints

```yaml
- { op: equal_gap_x, ids: [a, b, c, d] }            # average current gaps
- { op: equal_gap_x, ids: [a, b, c], gap: 8 }       # exact px gap
- { op: equal_gap_y, ids: [a, b], gap: 4 }
```

### Edge constraints

```yaml
- { op: edge_eq,     a: "btn.right", b: "panel.right" }
- { op: edge_offset, a: "btn.right", b: "panel.right", delta: -8 }
```

Allowed edges: `left`, `right`, `top`, `bottom`, `center_x`, `center_y`.

## Authoring rules

- Always declare a constraint when the user expressed (or the image clearly shows) symmetry, alignment, equal spacing, group centering, or equal sizing. Do **not** rely on hand-tuned `pos` values to "look symmetric" — declare it.
- For button rows, card rows, tab rows, and slot clusters that should sit in the middle of a parent, use `center_group_x` or `center_group_y` in addition to `same_size` and `equal_gap_*`.
- Pixels by default. The deterministic solve/run pipeline requires numeric pixel `size` values for `root` and every element after `auto_size` is applied. If a final Bedrock control must use `%`, `%c`, `fill`, or `default`, solve the layout with equivalent pixel sizes first, then add the dynamic unit during the hand-finish JSON patch.
- Constraint ids must reference existing elements. Cross-parent symmetry is not allowed.

## Compile output

`tools/compile.mjs` produces a JSON UI file with:

- `namespace`
- `root_panel` (`["100%","100%"]` by default, or the solved `root` rect when `root.size`/`root.anchor`/`root.pos` is provided)
- one entry per element, with computed `anchor_from`, `anchor_to`, `offset`, `size`, and any `props` merged in
- `controls` arrays representing the parent → child tree

Bindings, animations, and `$variable` plumbing are added afterward by editing the compiled file using the knowledge layer.

## Solved geometry audit

When `tools/validate.mjs` receives both `ui.json` and `solved.json`, it also checks layout-risk warnings:

- non-positive solved sizes
- elements outside their parent rect
- static labels whose estimated text height is larger than the solved label rect
- static labels whose estimated single-line width is larger than the solved label rect
- constraint errors logged by the solver

These warnings are not a substitute for in-game testing, but they catch the common AI failure modes before the JSON is hand-finished.
