# Visual Fit Discipline

Use for any task involving layout, alignment, spacing, screenshot matching, text scale, or polished UI.

## Required Checks

- Open one concrete reference file before editing.
- Give every edited label an explicit `size`.
- Fit label height to font: normal labels usually need 10-18px depending on `font_scale_factor`; `MinecraftTen` needs more space and should be used sparingly.
- For repeated buttons, rows, bars, cards, or slots, use one item size and one gap value.
- For grids, calculate total width/height from item size, gap, and padding before patching.
- For bars under 10px high, avoid embedded text unless a reference proves it works.
- For HUD work, check hotbar, chat, actionbar/title, hearts, hunger, XP, crosshair, and mobile safe-zone side effects.

## If Geometry Matters

Use IR/tools as the geometry source of truth:

1. Draft IR for repeated layout.
2. Solve/compile.
3. Hand-finish Bedrock-specific bindings, factories, animations, and modifications.

Never guess visually important offsets if a reference or IR can make them deterministic.
