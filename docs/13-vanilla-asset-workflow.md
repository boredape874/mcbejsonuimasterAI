# Vanilla Asset Workflow

This document explains how the AI should actually use Bedrock vanilla assets during JSON UI work.

## Upstream authority

Use `ZtechNetwork/MCBVanillaResourcePack` as the upstream vanilla asset authority.

Primary upstream:

- <https://github.com/ZtechNetwork/MCBVanillaResourcePack>

Current checked public state:

- the repository is public
- it contains `textures/`, `ui/`, `font/`, `blocks.json`, and other vanilla RP data
- the latest visible release on GitHub search results was `v26.10.0` on March 24, 2026

Treat that as the current pack tree authority for file names and paths.

## Use the right source for the right job

### Direct UI texture path

If the JSON UI control uses a direct texture path, search:

- `textures/ui/`

Typical result style:

- `textures/ui/Black`
- `textures/ui/close_button_default`

Use this for:

- `image.texture`
- nine-slice UI textures
- background cards
- icons already stored as direct UI textures

## Item icons

If the UI needs a vanilla item icon, do not guess the path from memory.

Search:

- `textures/item_texture.json`

The point is to verify the atlas key and the texture short name actually exists.

Use this for:

- inventory-like buttons
- Chest-UI style rendered item icons
- item-choice menus
- server-form buttons pretending to be items

## Block icons

If the UI needs a vanilla block icon, search:

- `textures/terrain_texture.json`
- `blocks.json` when block-to-texture relationships matter

Use this for:

- block-based menu buttons
- isometric or block-preview style forms
- block texture confirmation for custom UIs

## Vanilla screen structure

If the task is not "find a texture" but "find how vanilla screen X is built", search:

- `ui/*.json`
- `_ui_defs.json`
- `_global_variables.json`

Use this for:

- finding real control names
- seeing how a vanilla screen injects or composes panels
- checking whether a namespace or control name really exists in vanilla

## Practical lookup order

When the AI needs a vanilla path:

1. decide whether the target is UI texture, item icon, block icon, or screen file
2. search only the matching vanilla source
3. return only verified names
4. if not found, explicitly say it is not verified
5. prefer a shipped custom texture over hallucinating a fake vanilla one

## Examples

### Case 1: HUD background image

Question:

- "What texture should I use for a black HUD card?"

Process:

1. this is a UI texture problem
2. search `textures/ui/`
3. return a verified `textures/ui/*` path if present

### Case 2: Item icon button in server form

Question:

- "What vanilla icon should I use for diamond?"

Process:

1. this is an item atlas problem
2. search `textures/item_texture.json`
3. confirm the real atlas entry or advise using a custom texture if the intended presentation is different

### Case 3: Block-based chest menu button

Question:

- "How do I render a crafting table icon correctly?"

Process:

1. this is a block texture problem
2. search `textures/terrain_texture.json`
3. if needed, use `blocks.json` to understand the block texture aliasing

## What the AI should say explicitly

Mark the result as one of:

- confirmed from Ztech vanilla pack
- confirmed from vanilla screen file
- inferred from a working local example
- not verified

## Common mistakes to avoid

- inventing `textures/ui/*` names
- treating item and block atlases like direct texture paths without checking
- assuming every item or block has a one-line obvious icon path
- using a local handwritten note as stronger evidence than the upstream pack tree
