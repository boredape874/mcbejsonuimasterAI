# Bedrock JSON UI Editor

A free, open-source **visual editor** for Minecraft Bedrock Edition JSON UI files. Edit scoreboard, HUD, shimmer, and any UI element positions without manually tweaking JSON.

**[Live Editor](https://w1zardz.github.io/bedrock-json-ui-editor/)**

## Features

- **Visual Property Editing** — adjust `offset`, `size`, `anchor_from`, `anchor_to`, `alpha`, `layer`, and more with intuitive controls
- **Nudge Buttons** — move elements up/down/left/right with configurable step size (0.5px to 20px)
- **Long Press** — hold nudge buttons for continuous movement (perfect for mobile)
- **Element Tree** — navigate your JSON UI structure with collapsible tree, search, and type badges
- **Live Preview** — see element positions update in real-time on a simulated screen
- **Mobile-First** — fully optimized for phones and tablets with tab navigation
- **Export** — copy to clipboard or download the modified JSON file
- **No Backend** — runs entirely in your browser, works offline

## How to Use

1. Open the [editor](https://w1zardz.github.io/bedrock-json-ui-editor/)
2. Paste your JSON UI file (e.g., `scoreboard.json`, `hud_screen.json`)
3. Click **Parse & Edit**
4. Select elements from the tree
5. Adjust positions with nudge buttons, change anchors, tweak alpha/layer
6. Click **Export JSON** to get the result

## Common Use Cases

- **Move the scoreboard** up or down on screen
- **Adjust shimmer** animation position and size
- **Reposition HUD elements** like hotbar, health, hunger
- **Fine-tune offsets** that are hard to guess from raw JSON
- **Edit UI mods** for PocketMine-MP / PMMP servers

## Supported Properties

| Property | Editor |
|---|---|
| `offset` | Nudge buttons (arrow keys) + direct input |
| `size` | Width/height text inputs |
| `anchor_from` / `anchor_to` | Dropdown with all 9 anchor points |
| `alpha` | Number slider (0-1) |
| `layer` | Number input |
| `visible` / `enabled` | Checkbox toggle |
| Animation `from`/`to`/`duration`/`easing` | Direct input |
| `$variables` | Text input |

## Tech Stack

Pure HTML + CSS + JavaScript. No frameworks, no build step, no dependencies. Deploys to GitHub Pages as-is.

## Contributing

Issues and PRs welcome! If you have ideas for new features or find bugs, please [open an issue](https://github.com/w1zardz/bedrock-json-ui-editor/issues).

## License

MIT
