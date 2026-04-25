# Minecraft Bedrock JSON UI Sample Upstream

This document indexes the optional upstream mirror:

- upstream: <https://github.com/boredape874/minecraft-bedrock-json-ui-sample>
- local mirror: `references/upstreams/minecraft-bedrock-json-ui-sample/`
- sync script: `scripts/sync-minecraft-bedrock-json-ui-sample.ps1`
- inspected commit: `d74f4c3`

The mirror is intentionally ignored by Git through `references/upstreams/`. Keep the public repository portable by committing only routing notes, not the full archive.

## Sync

```powershell
.\scripts\sync-minecraft-bedrock-json-ui-sample.ps1
```

## High-value folders

| Folder or file | Use it for |
| --- | --- |
| `magicwayui/` | custom screen composition, HUD overlays, chest screen replacement, utility panels |
| `DynamicDialogV2-2/DynamicDialogV2-2/` | BP script to RP JSON UI dialogue bridge, dialogue textures, HUD-driven dialogue |
| `CNPC.UI.RP/CNPC UI [RP]/ui/npc_interact_screen.json` | NPC form layout and custom button/background textures |
| `Clearchat-Addon-2/Clearchat-Addon-2/` | chat and HUD interaction example |
| `binding/binding_dump.txt` | discovered binding names and hardcoded values |
| `json ui 개발/ui/` | large dumped vanilla-style UI archive |
| `json ui 개발/ui/RainbowPieUI/ui_extras/` | practical vanilla-like screen customizations, animation tests, scroll panels |
| `starLib/` | StarLib package examples, search binding, string slicing, form utility architecture |
| `통합할ui/` | integrated HUD/chat/components examples |

## Search routes

Use `rg` before opening files:

```powershell
rg -n '\"anim_type\"|\"anims\"|\"animation_reset_name\"|\"play_event\"|\"end_event\"' references/upstreams/minecraft-bedrock-json-ui-sample -g *.json -g *.jsonc
rg -n '\"bindings\"|\"binding_name\"|\"source_property_name\"|\"target_property_name\"' references/upstreams/minecraft-bedrock-json-ui-sample -g *.json -g *.jsonc
rg -n 'scroll_view|scrolling_panel|scrollbar_box|scrollbar_track|orientation.*horizontal|draggable.*horizontal' references/upstreams/minecraft-bedrock-json-ui-sample -g *.json -g *.jsonc
```

## AI usage rule

Load this source only after local targeted docs are not enough. Open one exact file, extract the smallest working fragment, then adapt it to the target pack's namespace, `_ui_defs.json`, texture paths, and screen context.

Do not blindly merge entire folders from this archive into a production pack.
