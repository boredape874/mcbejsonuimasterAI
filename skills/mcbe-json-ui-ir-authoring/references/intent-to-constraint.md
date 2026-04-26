# Intent → Constraint mapping

Use this when translating user wording (Korean or English) into IR constraints.

| User said (any language) | IR constraint |
| --- | --- |
| "두 버튼을 좌우 대칭으로 / mirror these horizontally" | `{op: symmetric_x, ids: [a, b]}` |
| "위아래 대칭으로 / mirror vertically" | `{op: symmetric_y, ids: [a, b]}` |
| "같은 크기 / same size / matching dimensions" | `{op: same_size, ids: [...]}` |
| "같은 너비만 / equal widths" | `{op: same_width, ids: [...]}` |
| "같은 높이만 / equal heights" | `{op: same_height, ids: [...]}` |
| "왼쪽 정렬 / align left" | `{op: align_x, edge: start, ids: [...]}` |
| "오른쪽 정렬 / align right" | `{op: align_x, edge: end, ids: [...]}` |
| "수평 중앙 정렬 / center horizontally" | `{op: align_x, edge: center, ids: [...]}` |
| "위쪽 정렬 / align top" | `{op: align_y, edge: start, ids: [...]}` |
| "아래쪽 정렬 / align bottom" | `{op: align_y, edge: end, ids: [...]}` |
| "수직 중앙 정렬 / center vertically" | `{op: align_y, edge: center, ids: [...]}` |
| "균등 간격 가로 / equal horizontal spacing" | `{op: equal_gap_x, ids: [...]}` |
| "정확히 8px 간격으로 / 8px gap exactly" | `{op: equal_gap_x, ids: [...], gap: 8}` |
| "균등 간격 세로 / equal vertical spacing" | `{op: equal_gap_y, ids: [...]}` |
| "A의 오른쪽이 B의 왼쪽과 일치 / A.right = B.left" | `{op: edge_eq, a: "a.right", b: "b.left"}` |
| "A의 오른쪽이 B의 왼쪽보다 12px 왼쪽 / A.right = B.left - 12" | `{op: edge_offset, a: "a.right", b: "b.left", delta: -12}` |

## Common combos

- Two buttons centered side-by-side at the bottom of a modal:
  `same_size` + `symmetric_x` + `align_y(edge: center)` (or `edge: end`)
- Tab row at top:
  `same_size` + `align_y(edge: start)` + `equal_gap_x`
- Sidebar list of cards:
  `same_width` + `align_x(edge: start)` + `equal_gap_y`
- Header label centered above body:
  `align_x(edge: center, ids: [header, body])`
