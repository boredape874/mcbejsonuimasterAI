# Server Form Example Index

Use this after `docs/39-design-recommendation-catalog.md`.

The design catalog chooses a visual family. This index tells the AI which existing example behaves like a quest window, shop window, stat window, skill window, NPC dialogue, settings panel, chest form, process form, RPG hub, guild menu, craft menu, or boss menu.

## How The AI Should Use This

1. Identify the target feature: main menu, quest, shop, stats, skills, craft, boss, guild, NPC, settings, inventory, process, or generic menu.
2. If the user did not choose a visual style, present 2-3 matching examples from this document and ask which direction to use.
3. Open only the matching row from this document.
4. Inspect the listed source file.
5. Copy the layout idea, not the whole file.
6. Preserve the target pack's namespace, `_ui_defs.json`, title routing, and texture paths.

## When To Ask The User

Ask before implementation if the request is broad and visual, for example:

- "make this server form look good"
- "make a quest window"
- "make a shop UI"
- "make a cool RPG menu"

Do not ask if the user already gave a design source, such as:

- a specific file path
- a screenshot or image
- a named style from this document
- an instruction like "use the custom crops quest style"

Use a short choice list:

```text
For this quest UI, I recommend one of these:
1. `quest.json` compact quest list: 220x220 panel, scroll list, good for many quests.
2. CNPC framed NPC panel: larger text area, good for story-heavy quests.
3. Vanilla-safe form skin: simplest, best compatibility.

Send the number or send another reference, and I will base the implementation on that.
```

## Custom Crops Reference Design Set

This local source is one of the strongest design references in the repository:

- original local source: `C:\Users\champ\OneDrive\문서\개발\커스텀 농작물 플러그인\참고자료\ui`
- portable repository mirror: `references/source-packs/custom-crops-reference/ui`

Treat these files as one coherent RPG/server menu design language:

- dark panel backgrounds
- compact fixed-size modal panels
- `MinecraftTen` title labels
- small `15x15` close/back controls
- `form_buttons` collection reuse
- title routing through markers such as `menu.quest`, `menu.shop`, `menu.stat`, `menu.skill`, `menu.craft`, `menu.guild`
- custom textures under `textures/custom_ui/*`, such as `stat`, `quest_bg`, `skill_box`, `player`, `info`, `hover`, and RPG bar assets

Do not copy local absolute paths into public instructions or target packs. Use the portable mirror path when giving reusable guidance.

## Feature-To-Example Map

| Feature | Example source | What it teaches | Suggested route prefix |
| --- | --- | --- | --- |
| Main RPG menu | `references/source-packs/custom-crops-reference/ui/menu.json` | 325px-wide main menu with player/info art, compact navigation buttons, custom `player` and `info` textures | `menu.menu` or `main:` |
| Quest list window | `references/source-packs/custom-crops-reference/ui/quest.json` | compact 220px quest panel, scrollable list, 175x40 quest buttons, `menu.quest` title filtering | `menu.quest` or `quest:` |
| Shop category/item window | `references/source-packs/custom-crops-reference/ui/shop.json` | 220x220 shop body, 150px scroll area, 3-column rows, item button grid | `menu.shop` or `shop:` |
| Player stat window | `references/source-packs/custom-crops-reference/ui/stat.json` | 325x200 stat panel, large title, 5 wide stat cards, icon-backed buttons | `menu.stat` or `stats:` |
| Skill menu | `references/source-packs/custom-crops-reference/ui/skill.json` | 260x160 compact skill panel, 50x50 skill icons, card-like skill choices | `menu.skill` or `skill:` |
| Craft menu | `references/source-packs/custom-crops-reference/ui/craft.json` | 260x160 crafting panel, 50x50 craft item cards, 116.6x26.6 action button style | `menu.craft` or `craft:` |
| Boss menu | `references/source-packs/custom-crops-reference/ui/boss.json` | compact boss-selection panel, 116.6x26.6 list buttons, stat-themed background | `menu.boss` or `boss:` |
| Guild main menu | `references/source-packs/custom-crops-reference/ui/gmenu.json` | guild menu with narrow 57.6x25.6 buttons, compact 150x150 stat-themed panel, close/back controls | `menu.gmenu` or `guild:` |
| Guild info menu | `references/source-packs/custom-crops-reference/ui/ginfo.json` | guild info/detail panel with 180x150 card and 170x110 inner dark content area | `menu.ginfo` or `guild.info:` |
| Guild management menu | `references/source-packs/custom-crops-reference/ui/guild.json` | guild action panel similar to ginfo, compact management buttons and detail card | `menu.guild` or `guild.manage:` |
| NPC custom menu | `references/source-packs/custom-crops-reference/ui/npc.json` | NPC-specific wide form route, spacious action buttons, hover decoration | `menu.npc` or `npc:` |
| General custom form router | `references/source-packs/custom-crops-reference/ui/form.json` | shared form logic and target-specific form composition | project-specific |
| Vanilla-safe server form | `references/official/bedrock-samples-ui/server_form.json` | vanilla form hierarchy, button collection shape, safe fallback behavior | none; default fallback |
| Token-routed server form | `references/source-packs/custom-crops-reference/ui/server_form.json` | route different form types from title/body markers | `menu.*` |
| Bottom NPC dialogue | `references/local-examples/npc-dialogue/ui/server_form.json` | bottom anchored dialogue box and dialogue button style | `npc:` or `dialogue:` |
| Full NPC interaction panel | `references/upstreams/minecraft-bedrock-json-ui-sample/CNPC.UI.RP/CNPC UI [RP]/ui/npc_interact_screen.json` | framed NPC window, header, close button, side options, large body text | screen replacement or NPC route |
| Dynamic dialogue bridge | `references/upstreams/minecraft-bedrock-json-ui-sample/DynamicDialogV2-2/DynamicDialogV2-2/RP/ui/hud_screen.json` | dialogue driven through HUD/title-like data instead of normal server form | title/actionbar protocol |
| Chest server form | `references/source-packs/custom-crops-reference/ui/chest_server_form.json` | server form transformed into inventory-like menu | `chest:` or custom token |
| Chest inventory system | `references/source-packs/custom-crops-reference/ui/chest_inventory_system.json` | slot/grid composition and inventory-like repeated controls | `chest:` |
| Furnace/process form | `references/source-packs/custom-crops-reference/ui/furnace_server_form.json` | process-style UI with input/output/progress mental model | `furnace:` or `process:` |
| Chest UI external tool pattern | `references/external/Chest-UI/RP/ui/server_form.json` | external chest-form authoring structure | tool-specific |
| EasyUIBuilder generated form | `references/external/EasyUIBuilder/ui/server_form.json` | builder-style generated server form structure | generated |
| RainbowPie modern form controls | `references/upstreams/minecraft-bedrock-json-ui-sample/json ui 개발/ui/RainbowPieUI/ui_extras/server_form_controls.json` | search/input/toggle/slider/dropdown-style form controls | settings/config |
| StarLib custom form library | `references/upstreams/minecraft-bedrock-json-ui-sample/starLib/StarLibV2-1.0.3.3/StarLibV2-1.0.3.3/starlib2/package_custom/common_custom.jsonc` | reusable form library layout and component composition | library-defined |
| Magic learning station | `references/upstreams/minecraft-bedrock-json-ui-sample/magicwayui/magic_learning_station_screen.json` | RPG station screen and magic/skill progression visual direction | station or skill route |

## Concrete Design Notes By Example

### RPG Menu Hub

Source:

- `references/source-packs/custom-crops-reference/ui/menu.json`

Observed useful dimensions:

- outer content panel: about `325x195`
- default navigation button: `55x25`
- slot area: about `63.45x282`
- player art: about `55x115`
- info icon area: about `45x45`
- close/back controls: `15x15`

Use when:

- making a main server menu
- routing to stats, skills, shop, quests, guild, craft, boss, or settings
- showing a player/profile illustration next to navigation

Implementation advice:

- keep this as a hub, not as a long data page
- use button labels as category names
- route each category to its own specialized form
- if the target server has many systems, this is a better first screen than a vanilla action form list

### Quest Window

Source:

- `references/source-packs/custom-crops-reference/ui/quest.json`

Observed useful dimensions:

- root quest panel: `220x220`
- internal content panel: about `260x195`
- scroll viewport: about `200x171`
- quest button: `175x40`
- close/back icon: `15x15`

Use when:

- listing quests
- selecting active/completed quests
- showing compact quest names with icons
- the server sends a list of actions through `form_buttons`

Implementation advice:

- keep the quest list scrollable
- use a larger detail panel only if the quest description is long
- if each quest has status, encode status in button text or texture, then bind from `form_buttons`
- route by `menu.quest` or a clear prefix so normal server forms still work

### Shop Window

Source:

- `references/source-packs/custom-crops-reference/ui/shop.json`

Observed useful dimensions:

- main form panel: `220x220`
- body text display: `100% x 30`
- scrolling list area: about `150px` tall
- row size: `180x60`
- layout pattern: multiple 3-button rows using `form_buttons`
- close icon: `15x15`

Use when:

- selling items
- showing shop categories
- showing item price/stock/currency
- building a compact menu with many repeatable choices

Implementation advice:

- keep each item row or card a stable height
- use icons only from verified bundled assets or vanilla asset lookup
- show price/currency in the button text or a small label inside the card
- avoid long descriptions inside each button; put details in a body text area or separate confirmation form

### Stat Window

Source:

- `references/source-packs/custom-crops-reference/ui/stat.json`

Observed useful dimensions:

- main panel: `325x200`
- content panel: `325x195`
- default stat button: `65x145`
- slot area: about `81.3x160`
- top/right small control: `15x15`

Use when:

- showing RPG stats
- showing server profile values
- showing currencies, ranks, levels, or attributes
- presenting a small number of large stat cards

Implementation advice:

- use 4-6 large cards, not a long list
- use `MinecraftTen` or another established font only if the pack already uses it
- use compact labels and icon-backed cards
- if many values are needed, split into tabs or use a scrollable detail section

### Skill Window

Source:

- `references/source-packs/custom-crops-reference/ui/skill.json`

Observed useful dimensions:

- main panel: `260x160`
- background image: about `254x155`
- skill button: `50x50`
- slot area: about `81.3x200`

Use when:

- skill tree or skill category selection
- ability unlocks
- class or job selection
- compact RPG progression menu

Implementation advice:

- make each skill icon large enough to recognize
- use short labels under or over icons
- put level/progress in a separate label or tooltip-like area
- use a bigger panel if descriptions are required

### Craft Window

Source:

- `references/source-packs/custom-crops-reference/ui/craft.json`

Observed useful dimensions:

- main panel: `260x160`
- background image: about `255x155`
- item/card square: `50x50`
- action button variant: about `116.6x26.6`
- close icon: `15x15`

Use when:

- crafting categories
- recipe selection
- upgrade material selection
- item creation confirmation

Implementation advice:

- use the 50x50 cards for visible output items
- use the 116.6x26.6 button style for confirm/craft actions
- if the craft result has ingredients, use a second detail form or a furnace/process form

### Boss Window

Source:

- `references/source-packs/custom-crops-reference/ui/boss.json`

Observed useful dimensions:

- main panel: `260x160`
- background image: about `254x155`
- button variant: about `116.6x26.6`
- close icon: `15x15`

Use when:

- boss teleport menu
- dungeon selection
- raid difficulty selection
- arena queue choices

Implementation advice:

- keep boss entries short
- include difficulty, cooldown, or party requirement in text if needed
- use a confirmation form before teleporting or spending currency

### Guild Menus

Sources:

- `references/source-packs/custom-crops-reference/ui/gmenu.json`
- `references/source-packs/custom-crops-reference/ui/ginfo.json`
- `references/source-packs/custom-crops-reference/ui/guild.json`

Observed useful dimensions:

- main panel: `260x160`
- compact guild action button: about `57.6x25.6`
- gmenu background/card: about `150x150`
- ginfo/guild card: about `180x150`
- inner dark info panel: about `170x110`
- close/back controls: `15x15`

Use when:

- guild home menu
- guild info/details
- guild management actions
- member invite/kick/rank actions

Implementation advice:

- split guild flows into menu, info, and management screens
- use the inner dark panel for guild stats or member summaries
- keep destructive actions behind confirmation
- avoid stuffing long member lists into this compact style; use a scroll list if member count can be large

### NPC Dialogue And NPC Action Menu

Sources:

- `references/local-examples/npc-dialogue/ui/server_form.json`
- `references/source-packs/custom-crops-reference/ui/npc.json`
- `references/upstreams/minecraft-bedrock-json-ui-sample/CNPC.UI.RP/CNPC UI [RP]/ui/npc_interact_screen.json`
- `references/upstreams/minecraft-bedrock-json-ui-sample/DynamicDialogV2-2/DynamicDialogV2-2/RP/ui/hud_screen.json`

Observed useful dimensions in the custom crops NPC menu:

- outer route panel: `150% x 40%`
- internal panel: about `260x195`
- button slot: about `200x55`
- default button: about `25x10`
- decorative NPC design texture: about `123x27`
- hover texture: `textures/custom_ui/hover`

Use when:

- NPC speaks to player
- story dialogue
- quest acceptance
- tutorial or guide panels
- an NPC has only a few action choices

Implementation advice:

- use bottom dialogue for short speech
- use custom crops `npc.json` for a few spacious action choices
- use framed NPC panel for multi-option shops/quests
- use HUD/title-driven dynamic dialogue when the dialogue must update without reopening a form
- keep choices short and predictable

### Settings Or Config Form

Sources:

- `references/upstreams/minecraft-bedrock-json-ui-sample/json ui 개발/ui/RainbowPieUI/ui_extras/server_form_controls.json`
- `references/upstreams/minecraft-bedrock-json-ui-sample/starLib/StarLibV2-1.0.3.3/StarLibV2-1.0.3.3/starlib2/package_custom/common_custom.jsonc`
- `references/external/EasyUIBuilder/ui/server_form.json`

Use when:

- a player configures server options
- admin panel has toggles/sliders/search
- long options need filtering
- generated form structure needs cleanup

Implementation advice:

- use section headers
- keep toggles and sliders in stable row heights
- use search only when the list is long enough to justify it
- document exactly which field is server-driven and which is client-local UI state

## Recommended AI Selection Rules

| User request type | AI should inspect |
| --- | --- |
| quest window or quest UI | `quest.json` first, then framed NPC panel if detail text is long |
| shop or item store | `shop.json`, then RPG card menu if item cards need icons/prices |
| stats, profile, attributes | `stat.json` |
| skill tree, job, class, ability unlocks | `skill.json`, then magic learning station for RPG station style |
| craft, recipe, item creation | `craft.json`, then furnace/process form if input-output-progress matters |
| boss, dungeon, raid selection | `boss.json` |
| guild menu, guild info, guild management | `gmenu.json`, `ginfo.json`, or `guild.json` |
| NPC dialogue | bottom NPC dialogue first |
| NPC shop or NPC quest menu | framed NPC panel or custom crops `npc.json` |
| inventory-like menu | chest server form and chest inventory system |
| production, processing, upgrading | furnace/process form |
| settings/config panel | RainbowPie controls or StarLib common custom form |
| generic main menu | `menu.json`, vanilla shell, or token-routed server form |

## What To Put In Final Answers

When the AI uses one of these examples, it should say:

```text
Design reference:
- source: references/source-packs/custom-crops-reference/ui/quest.json
- role: quest list window
- reused: 220x220 compact panel, 200x171 scroll viewport, 175x40 list buttons
- changed: namespace, route prefix, textures, PMMP button payload
```

This makes it clear whether the AI copied structure, copied dimensions, or only used the example as visual inspiration.
