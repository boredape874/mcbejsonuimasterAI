# Screen-By-Screen Reference

This document is a practical reference for major Bedrock vanilla UI screen files.

It is not meant to list every vanilla UI file in existence.  
It focuses on the screens that are most useful for PMMP, JSON UI, server-form, HUD, and addon-driven customization work.

Primary basis:

- Bedrock Wiki `json-ui-intro`
- Bedrock Wiki `json-ui-documentation`
- included local packs and local utility mirrors in this repository

## How to use this document

Use this when the question is:

- "Which vanilla screen file should I inspect?"
- "Which file is responsible for this kind of UI?"
- "If I want to customize X, which screen is usually relevant?"

## Major vanilla screens

| File | Main role | Inspect when | Common Bedrock modding use |
| --- | --- | --- | --- |
| `ui/hud_screen.json` | Main gameplay HUD | You need always-visible gameplay overlays | Hotbar-adjacent HUDs, scoreboards, title/actionbar overlays, progress bars |
| `ui/chat_screen.json` | Chat screen and chat panel behavior | Chat rendering or chat-driven protocols are involved | Notification parsing, filtered chat lines, custom chat panels |
| `ui/server_form.json` | Server form rendering | PMMP or Script API forms need custom UI | Action form replacement, chest-like form layout, title-routed forms |
| `ui/inventory_screen.json` | Classic inventory screen | Non-pocket inventory needs layout or binding changes | Inventory shell edits, classic inventory widgets |
| `ui/inventory_screen_pocket.json` | Pocket or touch inventory screen | Issue happens on touch/mobile layout | Mobile inventory adjustments, touch-specific layout fixes |
| `ui/anvil_screen.json` | Anvil screen | A project customizes anvil presentation | Cost text, naming flow, anvil overlays |
| `ui/beacon_screen.json` | Beacon screen | Beacon UI needs custom visuals or understanding | Effect selection layout or resource checks |
| `ui/brewing_stand_screen.json` | Brewing stand screen | Brewing process indicators matter | Bubble/flame/arrow indicator reference |
| `ui/cartography_screen.json` | Cartography table screen | Map-editing UI needs reference | Mode-dependent visibility and output descriptions |
| `ui/chest_screen.json` | Chest container screen | A pack customizes vanilla chest UI directly | Container layout study, chest-like UI reference |
| `ui/command_block_screen.json` | Command block screen | You need dropdown or edit-box patterns from a complex screen | Advanced bindings, dropdowns, enabled-state logic |
| `ui/death_screen.json` | Death and respawn screen | Death menu behavior or text matters | Respawn/quit visibility patterns |
| `ui/enchanting_table_screen.json` | Enchanting table screen | Selection state, costs, or list behavior matter | Complex button state and progress references |
| `ui/furnace_screen.json` | Furnace screen | Furnace-like layouts or progress indicators matter | Arrow and flame ratio references, furnace-style custom UI |
| `ui/horse_screen.json` | Horse inventory screen | Entity inventory layout matters | Mixed inventory + equipment slot patterns |
| `ui/loom_screen.json` | Loom screen | Grid plus tab-like pattern study is needed | Selector-heavy screen study |
| `ui/stonecutter_screen.json` | Stonecutter screen | Result list and selector logic matters | Collection and selector references |
| `ui/trade_2_screen.json` | Villager trade screen | Multi-item trade layouts or tier UI patterns matter | Trade cell references, item count and state logic |
| `ui/npc_interact_screen.json` or project NPC screen equivalents | NPC interaction UI | NPC menus or dialog systems are involved | NPC dialog/menu shell design |

## Most important screens for JSON UI authors

If the AI has to choose only a few to inspect first, use this order:

1. `ui/hud_screen.json`
2. `ui/chat_screen.json`
3. `ui/server_form.json`
4. `ui/inventory_screen.json`
5. `ui/inventory_screen_pocket.json`

That covers the majority of custom HUD, chat, and form work.

## Screen notes

### `ui/hud_screen.json`

What it is for:

- the main gameplay screen
- always-on gameplay UI

Typical data channels:

- title text
- actionbar text
- visibility bindings
- factory-driven overlays

Typical customizations:

- top bars
- HP or mana bars
- scoreboards
- extra text panels
- tablist-style overlays

Use with:

- `docs/12-local-utils-and-patterns.md`
- `docs/14-json-ui-best-practices.md`

## `ui/chat_screen.json`

What it is for:

- visible chat interface
- message list rendering and chat-related controls

Typical customizations:

- topbar notifications triggered from chat
- hiding special protocol lines from normal chat
- changing chat layout or message panel behavior

## `ui/server_form.json`

What it is for:

- UI for server-sent forms

Typical customizations:

- form factory routing
- title prefix routing
- replacing simple action forms with custom layouts
- chest or furnace style server forms

This is usually the first screen to inspect for PMMP custom menu projects.

## `ui/inventory_screen.json`

What it is for:

- classic inventory screen on non-pocket layouts

Typical customizations:

- moving inventory panels
- adjusting classic inventory-specific widgets
- reusing inventory-like control structures

## `ui/inventory_screen_pocket.json`

What it is for:

- touch-oriented inventory UI

Typical customizations:

- touch-only layout fixes
- mobile inventory behavior adjustments

Important note:

- do not assume `inventory_screen.json` alone is enough if the project must support touch well

## Container and workstation screens

These are useful mostly as references for specialized widgets, not as the first file to patch.

Examples:

- `ui/furnace_screen.json`
- `ui/brewing_stand_screen.json`
- `ui/cartography_screen.json`
- `ui/loom_screen.json`
- `ui/stonecutter_screen.json`
- `ui/enchanting_table_screen.json`

Why they matter:

- they contain useful patterns for progress indicators
- they contain selectors, lists, tabs, or result panels
- they show real Bedrock handling of workstation-specific bindings

## Complex reference screens

Some screens are especially valuable because they are complex, not because you patch them often.

Examples:

- `ui/command_block_screen.json`
- `ui/trade_2_screen.json`
- `ui/horse_screen.json`

Use them as references for:

- dropdowns
- multi-state toggles
- advanced enable or visible logic
- mixed panel and collection layouts

## Practical lookup rule

When the AI must choose the first file to inspect:

- gameplay overlay -> `hud_screen.json`
- chat-driven behavior -> `chat_screen.json`
- form customization -> `server_form.json`
- classic inventory change -> `inventory_screen.json`
- touch inventory change -> `inventory_screen_pocket.json`
- workstation-specific UX -> matching workstation screen

## Relationship to other docs

Use this together with:

- `docs/15-json-ui-file-role-catalog.md` for broad file responsibility
- `docs/13-vanilla-asset-workflow.md` for verified vanilla asset lookup
- `docs/14-json-ui-best-practices.md` for patch strategy and performance rules
