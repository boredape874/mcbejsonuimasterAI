# JSON UI File Role Catalog

This document names the typical responsibility of common Bedrock JSON UI files.

Use it when the AI must explain what each file is for before patching it.

Primary basis:

- Bedrock Wiki `json-ui-intro`
- Bedrock Wiki `json-ui-documentation`
- included local sample packs in this repository

## System files

### `_ui_defs.json`

Primary role:

- loading list for custom JSON UI files in the resource pack

What it usually controls:

- whether a custom UI JSON file is loaded at all
- which extra UI files outside vanilla are introduced by the pack

When to inspect it:

- a new UI file does not seem to apply
- a utility file was added but nothing changed
- a merged pack lost one of its UI systems

Important note:

- Bedrock Wiki intro explicitly describes `_ui_defs.json` as the file that references the UI files used on the UI

## `_global_variables.json`

Primary role:

- shared constant-like variables used across multiple UI files

What it usually stores:

- colors
- booleans that enable or disable layouts
- default texture variables
- shared sizing values

When to inspect it:

- a pack uses the same variable in many files
- a layout mode or visual mode is toggled globally
- a texture or color appears to come from a shared variable

Important note:

- this is not the only place variables can exist, but it is the common shared-variable file

## Core screen files

### `hud_screen.json`

Primary role:

- main gameplay HUD screen

What it usually contains:

- hotbar-related HUD composition
- actionbar and title linked overlays
- scoreboard overlays
- always-visible gameplay UI additions

When to inspect it:

- you are adding a gameplay overlay
- title/actionbar-driven UI is involved
- a scoreboard-like element is rendered during play

Primary Bedrock Wiki note:

- `json-ui-intro` explicitly names this as the gameplay screen where features such as the hotbar are rendered

## `chat_screen.json`

Primary role:

- chat screen behavior and chat-related UI modifications

What it usually contains:

- chat panel layout
- message rendering logic
- chat-driven protocol hiding or routing
- custom overlays that depend on chat message content

When to inspect it:

- a topbar or notification is driven from chat
- normal chat lines must be hidden, restyled, or filtered
- a pack parses message prefixes like `!topbar:`

## `server_form.json`

Primary role:

- server-sent forms and custom form layout routing

What it usually contains:

- server form factories
- custom title-based layout switching
- action-form replacement layouts
- chest-like or furnace-like substitutes for forms

When to inspect it:

- a PMMP or Script API form needs custom UI
- a title prefix chooses among different layouts
- default action forms are being restyled

Primary Bedrock Wiki note:

- `json-ui-documentation` includes a dedicated `Server Form` section for `ui/server_form.json`

## `inventory_screen.json`

Primary role:

- classic inventory UI screen

What it usually contains:

- inventory grid composition
- inventory side panels
- inventory-specific controls and bindings

When to inspect it:

- a pack edits player inventory layout
- a classic non-pocket inventory change is requested

## `inventory_screen_pocket.json`

Primary role:

- pocket or touch-oriented inventory UI

What it usually contains:

- touch-specific inventory arrangement
- mobile-friendly control layout

When to inspect it:

- the pack targets pocket UI specifically
- the issue only happens on touch or mobile style inventory

## Shared template and helper files

### `ui_common.json`

Primary role:

- shared reusable controls and templates

What it usually contains:

- common buttons
- labels
- dialog shells
- shared reusable pieces referenced from other namespaces

When to inspect it:

- a control name is reused across many screens
- a button or shell looks like a common template
- you need to patch a shared preset instead of one screen

Primary Bedrock Wiki note:

- `json-ui-intro` explicitly describes `ui_common.json` as a template file containing elements referenced on many other namespaces

## `ui_template_*.json`

Primary role:

- additional organized template libraries

What it usually contains:

- grouped reusable widgets
- more specialized template sets than `ui_common.json`

When to inspect it:

- the pack clearly uses shared templates outside `ui_common.json`
- a reusable component family is split into its own file

## Common project-specific screen files

### `scoreboards.json`

Primary role:

- pack-defined scoreboard or sidebar UI systems

What it usually contains:

- right-side board layouts
- custom text parsing for scoreboard-like displays
- gameplay HUD elements grouped outside `hud_screen.json`

When to inspect it:

- the project has a custom sidebar or board
- `hud_screen.json` injects controls from a scoreboard namespace

Important note:

- this is a common pack convention, not a guaranteed vanilla special file

## `form.json`

Primary role:

- project-defined generic form templates or helper layouts

What it usually contains:

- reusable shells for project-specific forms
- helper controls consumed by `server_form.json` or custom screens

When to inspect it:

- the project uses its own form library
- `server_form.json` references controls from a separate namespace

## `npc.json`

Primary role:

- NPC-related custom screen content in projects that customize NPC interaction UI

What it usually contains:

- NPC conversation shells
- title and body layouts
- NPC-specific buttons and overlays

When to inspect it:

- NPC interaction UI is customized
- a project uses NPC screens as a custom menu system

## How the AI should use this catalog

When asked "what file should I edit", answer in this order:

1. identify the user-visible surface
2. map it to the screen or shared template file most likely responsible
3. check whether the project uses helper files or utility files
4. confirm `_ui_defs.json` if a new file is being introduced

## Short decision map

- gameplay overlay -> `hud_screen.json`
- chat-driven overlay -> `chat_screen.json`
- server form customization -> `server_form.json`
- classic inventory layout -> `inventory_screen.json`
- pocket inventory layout -> `inventory_screen_pocket.json`
- shared reusable button or shell -> `ui_common.json` or `ui_template_*.json`
- project-specific sidebar -> often `scoreboards.json`
- project-specific NPC UI -> often `npc.json`
