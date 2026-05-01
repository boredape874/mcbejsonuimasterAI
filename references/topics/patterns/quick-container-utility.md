# Quick Container Utility Pattern

This pattern comes from a local private utility UI suite. It is useful for adding helper controls around inventory, chest, redstone, or pocket container screens.

Private local mirror:

- `C:/Users/champ/.codex/references/private/deesse-ui-toolkit/ui/déesse_ui/quick_container/`

## Core Idea

Do not rewrite the entire container screen. Add helper panels around the existing container root:

- quick move buttons
- optional search panel
- tooltip display
- hover-mode/touch-mode controls
- utility column expanded by a toggle
- background close layer if the pack wants tap-out behavior

## Layout Rules

Container helpers are sensitive to GUI scale. Keep them anchored to known container edges instead of absolute screen center.

Good anchors:

- `top_right` to `top_left` for side button columns
- `left_middle` to `right_middle` for right-side helpers
- `right_middle` to `left_middle` for mirrored mode

Avoid:

- placing helper buttons at fixed global screen offsets
- assuming the chest width is identical on pocket and desktop
- mixing touch-only behavior into desktop-only layouts

## Feature Toggle Rules

Every optional helper should be behind one clear condition:

- screen type condition
- performance mode condition
- user setting toggle
- touch/desktop condition

This keeps large utility packs debuggable when one helper fails.
