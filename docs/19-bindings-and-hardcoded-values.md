# Bindings And Hardcoded Values

This document catalogs common Bedrock JSON UI binding sources and how the AI should reason about them.

## Source status

Use this document as a practical map. Confirm exact names against:

- `references/official/bedrock-samples-ui/`
- `references/external/bedrock-wiki-json-ui/json-ui-documentation.md`
- `ZtechNetwork/MCBVanillaResourcePack`

## Global and common bindings

| Binding | Common meaning | Typical files |
| --- | --- | --- |
| `#visible` | target visibility property | most screens |
| `#enabled` | target enabled/locked property | buttons, toggles, forms |
| `#text` | target text property | labels, title, forms |
| `#using_touch` | touch input mode state | HUD, chat, controls |
| `#keyboard_button_visible` | keyboard UI visibility | chat and input screens |

## HUD-related values

| Binding or variable | Use |
| --- | --- |
| `$actionbar_text` | actionbar text variable in HUD logic |
| `#hud_title_text_string` | title text string binding |
| `#hud_subtitle_text_string` | subtitle text string binding when available |
| `#player_list_title` | scoreboard/list title text |
| `#player_score` | score value from scoreboard collection |
| `#gamertag` | player gamertag from players collection |

Use cases:

- title-driven HP bars
- actionbar protocols
- personal score HUD
- conditional rendering from title/actionbar content

For a larger source-indexed pattern map, use `docs/34-binding-patterns-value-index.md`.

## Chat-related values

| Binding | Use |
| --- | --- |
| `#chat_visible` | chat panel visibility |
| `#message_text_box_content` | current chat input content |
| `#chat_title_text` | chat title text context |

Use cases:

- chat panel modification
- chat-driven notification filtering
- custom chat input behavior

## Server form values

Common form values are screen-specific and must be checked against the current `server_form.json`.

Useful categories:

- title text
- body text
- button text
- button image data
- form collections

AI rule:

- do not assume a form binding name from memory
- inspect the target pack's `server_form.json`
- compare with official `references/official/bedrock-samples-ui/server_form.json`

## Collection-related bindings

| Collection | Use |
| --- | --- |
| `players_collection` | player entries |
| `scoreboard_scored_list_collection` | scoreboard score entries |

Use cases:

- individual score HUD
- player list overlays
- scoreboard-like HUD systems

## Practical workflow

When a binding is needed:

1. search the target pack first
2. search `references/official/bedrock-samples-ui/`
3. search `references/upstreams/minecraft-bedrock-json-ui-sample/binding/binding_dump.txt` if the optional mirror exists
4. search Bedrock Wiki documentation
5. label the result as confirmed or inferred

## Red flags

- binding only appears in a community snippet
- binding depends on a factory collection not present in target screen
- binding works in HUD but is copied into server form without checking screen context
- numeric values are fed through string formatting without marker prefixes
