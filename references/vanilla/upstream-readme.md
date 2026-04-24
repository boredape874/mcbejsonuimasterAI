# mcbe-ui-codex
A verified visual reference for Minecraft Bedrock Edition UI: texture paths, Script API, JSON UI, and form icons. Built for developers and AI tools.

# MCBE UI Codex

A verified, comprehensive reference for Minecraft Bedrock Edition UI development, texture paths, Script API, JSON UI, and form design. Built for developers and AI tools alike.

---

## What This Is

A collection of reference documents that solve the same problem: **you shouldn't have to guess.**

Whether you're a developer building server forms and custom UI, or an AI tool generating MCBE code, these docs give you verified paths, correct syntax, and proven patterns, not hallucinated texture names or deprecated API calls.

Every entry is sourced from Mojang's official repositories and community-verified against live Minecraft Bedrock builds.

---

## Documents

| Document | What It Covers |
|---|---|
| [**UI Icon & Texture Reference**](docs/MCBE_UI_Icon_Reference.md) | Visual catalog of 600+ vanilla texture paths with inline PNG previews. Every `textures/ui/`, `textures/items/`, and `textures/blocks/` path usable in JSON UI and Script API forms. |
| [**Script API Reference**](docs/MCBE_Script_API_Reference.md) | Verified module names, versions, imports, events, dynamic properties, forms, scheduling, and 20+ common gotchas. Covers `@minecraft/server` 2.x and `@minecraft/server-ui` 2.x. |
| [**JSON UI Reference & Design Guide**](docs/MCBE_JSON_UI_Reference.md) | Element types, property tables, nine-slice textures, custom buttons, server form reskinning, animations, data bindings, and professional polish techniques. |

---

## Quick Examples

### Find an icon for your server form
```javascript
form.button("Teleport", "textures/items/ender_pearl");
form.button("Shop", "textures/ui/icon_recipe_nature");
form.button("Settings", "textures/ui/settings_glyph_color");
```
→ Browse all available icons with previews in the [UI Icon Reference](docs/MCBE_UI_Icon_Reference.md)

### Correct Script API import (not the hallucinated version)
```javascript
import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
```
→ Full event list, version table, and patterns in the [Script API Reference](docs/MCBE_Script_API_Reference.md)

### Professional JSON UI button (not bare minimum)
```json
{
  "my_button": {
    "type": "button",
    "size": [200, 40],
    "default_control": "default",
    "hover_control": "hover",
    "pressed_control": "pressed",
    "controls": [
      { "default": { "type": "image", "texture": "textures/ui/my_btn", "nineslice_size": 4, "size": ["100%", "100%"] } },
      { "hover": { "type": "image", "texture": "textures/ui/my_btn_hover", "nineslice_size": 4, "size": ["100%", "100%"] } },
      { "pressed": { "type": "image", "texture": "textures/ui/my_btn_pressed", "nineslice_size": 4, "size": ["100%", "100%"], "offset": [0, 1] } }
    ]
  }
}
```
→ Full button templates, toggle patterns, and polish techniques in the [JSON UI Reference](docs/MCBE_JSON_UI_Reference.md)

---

## For AI Tools

These documents are designed to work as context files for AI code generation. Drop them into your `.context/` folder, Copilot workspace, or Claude project:

```
.context/
├── MCBE_UI_Icon_Reference.md
├── MCBE_Script_API_Reference.md
└── MCBE_JSON_UI_Reference.md
```

Each doc includes explicit guidance for AI systems — what to reference, what not to invent, and which patterns to default to.

---

## Version

Built against **Minecraft Bedrock Edition 1.21.x** (2025).

The Script API reference covers `@minecraft/server` up to **2.3.0 stable** / **2.8.0-beta** and `@minecraft/server-ui` up to **2.0.0 stable**.

---

## Sources

- [Mojang/bedrock-samples](https://github.com/Mojang/bedrock-samples) — Official vanilla resource pack and behavior pack
- [ZtechNetwork/MCBVanillaResourcePack](https://github.com/ZtechNetwork/MCBVanillaResourcePack) — Community texture mirror
- [Bedrock Wiki](https://wiki.bedrock.dev) — Community documentation for JSON UI, scripting, and add-ons
- [Microsoft Learn — Script API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/) — Official API reference
- [Minecraft Wiki](https://minecraft.wiki) — Bedrock Edition GUI and UI textures

---

## Contributing

Found a missing texture path? Wrong event name? Outdated version number?

- Open an issue or PR
- Include the Minecraft version you verified against
- Cite the source (vanilla RP file path, MS Learn URL, etc.)

This is a living reference. Contributions keep it accurate.

---

## License

Documentation and text content in this repository is licensed under the [MIT License](LICENSE).

**Mojang/Microsoft Asset Notice:** Texture preview images referenced in this documentation link to
Mojang's vanilla resource pack files hosted in public GitHub repositories. These assets are the
property of Mojang Studios / Microsoft and are referenced here for documentation and developer
reference purposes only. They are not covered by this repository's MIT license.

---

Maintained by **Voidic** / [Void Server Hub](https://voidserverhub.net)
