# External Research Map

These are the external sources that should be checked when the local pack samples are not enough.

## Broad JSON UI example archive

- `boredape874/mcbe-json-ui-resource`
  - <https://github.com/boredape874/mcbe-json-ui-resource>
  - optional local mirror: `references/upstreams/mcbe-json-ui-resource/`
  - guide: `docs/29-mcbe-json-ui-resource-upstream.md`

Use this for broad tutorial and sample-pack lookup. Search first with `rg`, then inspect only the exact tutorial or screen file.

- `boredape874/minecraft-bedrock-json-ui-sample`
  - <https://github.com/boredape874/minecraft-bedrock-json-ui-sample>
  - optional local mirror: `references/upstreams/minecraft-bedrock-json-ui-sample/`
  - guide: `docs/32-minecraft-bedrock-json-ui-sample-upstream.md`

Use this for animation tests, StarLib form/search patterns, binding dumps, RainbowPie vanilla-like screen examples, custom NPC UI, and integrated HUD/chat examples.

## Official vanilla UI source

- Mojang `bedrock-samples`
  - <https://github.com/Mojang/bedrock-samples/tree/main/resource_pack/ui>
  - Use for screen names, `_ui_defs.json`, and official sample screen structure

## Vanilla asset authority

- ZtechNetwork `MCBVanillaResourcePack`
  - <https://github.com/ZtechNetwork/MCBVanillaResourcePack>
  - Use for `textures/ui`, `textures/item_texture.json`, `textures/terrain_texture.json`, and current vanilla `ui/*.json`

## Behavior and rule references

- Bedrock Wiki JSON UI Documentation
  - <https://wiki.bedrock.dev/json-ui/json-ui-documentation>
- Bedrock Wiki Intro to JSON UI
  - <https://wiki.bedrock.dev/json-ui/json-ui-intro.html>
- Bedrock Wiki Best Practices
  - <https://wiki.bedrock.dev/json-ui/best-practices>
- Bedrock Wiki Preserve Title Texts
  - <https://wiki.bedrock.dev/json-ui/preserve-title-texts>
- Bedrock Wiki Modifying Server Forms
  - <https://wiki.bedrock.dev/json-ui/modifying-server-forms>
- Bedrock Wiki Buttons and Toggles
  - <https://wiki.bedrock.dev/json-ui/buttons-and-toggles>

## Example repositories

- `LeGend077/json-ui-examples`
  - <https://github.com/LeGend077/json-ui-examples>
- `Refaltor77/EasyUIBuilder`
  - <https://github.com/Refaltor77/EasyUIBuilder>
- `Herobrine643928/Chest-UI`
  - <https://github.com/Herobrine643928/Chest-UI>

## Schema repositories

- `Blockception/Minecraft-bedrock-json-schemas`
  - <https://github.com/Blockception/Minecraft-bedrock-json-schemas>
- `DJStompZone/MCBE-JSON-UI-Schemas`
  - <https://github.com/DJStompZone/MCBE-JSON-UI-Schemas>

## How to use them

### When verifying a texture path

Check:

1. Ztech repo file tree
2. `textures/item_texture.json` or `textures/terrain_texture.json` if relevant
3. local sample packs only for usage examples, not as the final authority

### When verifying a control property or binding name

Check:

1. Bedrock Wiki JSON UI documentation
2. Mojang `bedrock-samples`
3. local sample packs

### When building a new HUD or chat protocol

Check:

1. local sample packs
2. Bedrock Wiki best practices and title preservation guides
3. Mojang vanilla screen layout if screen injection is involved

### When building a new reusable control quickly

Check:

1. local sample packs
2. `json-ui-examples`
3. `EasyUIBuilder`
4. Bedrock Wiki documentation for property confirmation

### When building animation, binding, or scroll-heavy UI

Check:

1. `docs/33-animation-patterns-and-dumper-values.md`
2. `docs/34-binding-patterns-value-index.md`
3. `docs/35-scroll-and-carousel-patterns.md`
4. only one exact source file from the listed mirrors

### When validating JSON UI structure in an editor

Check:

1. `references/schemas/DJStompZone/`
2. `references/schemas/Blockception/`
3. Bedrock Wiki JSON UI documentation

### When building chest-like or furnace-like custom forms

Check:

1. local sample packs
2. `references/external/Chest-UI/`
3. Bedrock Wiki modifying server forms
