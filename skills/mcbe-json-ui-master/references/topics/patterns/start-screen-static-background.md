# Start Screen Static Background

Use this when replacing the panorama/start background with a fixed image.

## Pattern

Patch the `start` namespace so `start_screen` points its background slot at a custom image control:

```json
{
  "namespace": "start",
  "start_screen": {
    "$screen_bg_content": "start.background",
    "$screen_content": "start.start_screen_content"
  },
  "background": {
    "type": "image",
    "fill": true,
    "texture": "textures/ui/<your_background>",
    "size": ["100%", "100%"]
  }
}
```

## Asset Rules

- Use a texture path owned by the pack, usually under `textures/ui/start/`.
- Prefer a 16:9 source image, then verify common desktop and mobile aspect ratios.
- If the texture is important content, avoid cropping it tightly because `fill` may crop on non-16:9 screens.
- Keep start-screen visual assets separate from server-form/HUD assets.

## File Placement

For serious packs:

```text
ui/start_screen.json
textures/ui/start/background.png
```

Register the start screen file in `_ui_defs.json` if the pack structure requires explicit registration.
