# Server Form Example Index

Use this after `docs/39-design-recommendation-catalog.md`.

The design catalog chooses a visual family. This index tells the AI which existing example behaves like a quest window, shop window, stat window, skill window, NPC dialogue, settings panel, chest form, process form, RPG hub, guild menu, craft menu, boss menu, cloud inbox, mail view, notification list, or modern server menu.

## How The AI Should Use This

1. Identify the target feature: main menu, quest, shop, stats, skills, craft, boss, guild, NPC, mail, inbox, notification, settings, inventory, process, or generic menu.
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
- an instruction like "use the RPG server quest style"

Use a short choice list:

```text
For this quest UI, I recommend one of these:
1. `quest.json` compact quest list: 220x220 panel, scroll list, good for many quests.
2. CNPC framed NPC panel: larger text area, good for story-heavy quests.
3. Vanilla-safe form skin: simplest, best compatibility.

Send the number or send another reference, and I will base the implementation on that.
```

## RPG Server UI Reference Design Set

This reference set is one of the strongest design references in the repository:

- portable repository mirror: `references/sample-packs/rpg-server-ui-reference/ui`

Treat these files as one coherent RPG/server menu design language:

- dark panel backgrounds
- compact fixed-size modal panels
- `MinecraftTen` title labels
- small `15x15` close/back controls
- `form_buttons` collection reuse
- title routing through markers such as `menu.quest`, `menu.shop`, `menu.stat`, `menu.skill`, `menu.craft`, `menu.guild`
- custom textures under `textures/custom_ui/*`, such as `stat`, `quest_bg`, `skill_box`, `player`, `info`, `hover`, and RPG bar assets

Do not copy local absolute paths into public instructions or target packs. Use the portable mirror path when giving reusable guidance.

## Modern Cloud Form Design Set

This reference set contains a polished modern form system:

- portable repository mirror: `references/sample-packs/modern-cloud-ui-reference/ui`

Treat these files as a separate "cloud form" design language:

- `customUI_` title prefix routing in `server_form.json`
- reusable form base through `form_common.form_base`
- shared cloud action/modal skins in `form/facelift_cloud_action_form.json` and `form/facelift_cloud_modal_form.json`
- screen-specific form content in `ui/form/*_cloud_action_form.json`
- scroll panels with `5px` scroll bars and small internal padding
- rounded form buttons under `textures/ui/form/button/round_corner_button`
- soft panel backgrounds using `textures/ui/hud_tip_text_background`, `textures/ui/form/new_white_border_texture`, and related form assets
- modern large percentage-based form sizing such as `85%`, `90%`, `95%`, and `100% - 20px`

Use this set when the user wants a more polished modern UI than the compact RPG server UI panels.

Do not mix the cloud form system into a target pack by copying only `server_form.json`. It depends on:

- `ui/form_common.json`
- `ui/form_template.json`
- `ui/form_anims_template.json`
- `ui/form/facelift_cloud_action_form.json`
- `ui/form/facelift_cloud_modal_form.json`
- the specific cloud action/modal form file being routed
- the relevant textures under `textures/ui/form/*`

## Feature-To-Example Map

| Feature | Example source | What it teaches | Suggested route prefix |
| --- | --- | --- | --- |
| Main RPG menu | `references/sample-packs/rpg-server-ui-reference/ui/menu.json` | 325px-wide main menu with player/info art, compact navigation buttons, custom `player` and `info` textures | `menu.menu` or `main:` |
| Modern cloud action form fallback | `references/sample-packs/modern-cloud-ui-reference/ui/form/facelift_cloud_action_form.json` | generic cloud-skinned action form, 85% height panel, 26px title bar, 20x20 close button, scrollable content | `customUI_*` |
| Modern cloud modal form fallback | `references/sample-packs/modern-cloud-ui-reference/ui/form/facelift_cloud_modal_form.json` | generic cloud-skinned custom/modal form structure | `customUI_*` |
| Modern server menu / friends list | `references/sample-packs/modern-cloud-ui-reference/ui/form/multi_a_cloud_action_form.json` | 85%x85% menu panel, 33.33% card grid, status icons, scrollable menu button grid | `customUI_MultiACloudForm_` |
| Cloud inbox | `references/sample-packs/modern-cloud-ui-reference/ui/form/inbox_cloud_action_form.json` | 95%x95% inbox layout, 140px category rail, search row, icon categories, right-side message list | `customUI_InboxCloudForm_` |
| Cloud mail detail | `references/sample-packs/modern-cloud-ui-reference/ui/form/mail_info_cloud_action_form.json` | 85%x80% mail reader, 60% text panel, reward/action rows, scrollable text and reward list | `customUI_MailInfoCloudForm_` |
| Cloud shop grid | `references/sample-packs/modern-cloud-ui-reference/ui/form/redesign_shop_cloud_action_form.json` | 90%x95% shop, top option buttons, paged item grid, 10% width item cells, 24px page controls | `customUI_RedesignShopCloudForm_` |
| Cloud buy/sell modal | `references/sample-packs/modern-cloud-ui-reference/ui/form/redesign_shop_buy_sell_cloud_modal_form.json` | custom/modal buy-sell confirmation with generated modal fields | `customUI_RedesignShopBuySellCloudForm_` |
| Cloud recipe grid | `references/sample-packs/modern-cloud-ui-reference/ui/form/food_recipe_select_cloud_action_form.json` | 90%x95% recipe selector, item grid, page controls, rounded item buttons | `customUI_FoodRecipeSelectCloudForm_` |
| Cloud furnace/process form | `references/sample-packs/modern-cloud-ui-reference/ui/form/food_furnace_cloud_action_form.json` | 55% width process panel, 60% content grid, furnace image state/animation, input-output process feel | `customUI_FoodFurnaceCloudForm_` |
| Cloud notification list | `references/sample-packs/modern-cloud-ui-reference/ui/form/notification_list_cloud_action_form.json` | 100%-20px panel, 75% centered list, 50%x45 notification cards, top-bottom entrance animations | `customUI_NotificationListCloudForm_` |
| Quest list window | `references/sample-packs/rpg-server-ui-reference/ui/quest.json` | compact 220px quest panel, scrollable list, 175x40 quest buttons, `menu.quest` title filtering | `menu.quest` or `quest:` |
| Shop category/item window | `references/sample-packs/rpg-server-ui-reference/ui/shop.json` | 220x220 shop body, 150px scroll area, 3-column rows, item button grid | `menu.shop` or `shop:` |
| Player stat window | `references/sample-packs/rpg-server-ui-reference/ui/stat.json` | 325x200 stat panel, large title, 5 wide stat cards, icon-backed buttons | `menu.stat` or `stats:` |
| Skill menu | `references/sample-packs/rpg-server-ui-reference/ui/skill.json` | 260x160 compact skill panel, 50x50 skill icons, card-like skill choices | `menu.skill` or `skill:` |
| Craft menu | `references/sample-packs/rpg-server-ui-reference/ui/craft.json` | 260x160 crafting panel, 50x50 craft item cards, 116.6x26.6 action button style | `menu.craft` or `craft:` |
| Boss menu | `references/sample-packs/rpg-server-ui-reference/ui/boss.json` | compact boss-selection panel, 116.6x26.6 list buttons, stat-themed background | `menu.boss` or `boss:` |
| Guild main menu | `references/sample-packs/rpg-server-ui-reference/ui/gmenu.json` | guild menu with narrow 57.6x25.6 buttons, compact 150x150 stat-themed panel, close/back controls | `menu.gmenu` or `guild:` |
| Guild info menu | `references/sample-packs/rpg-server-ui-reference/ui/ginfo.json` | guild info/detail panel with 180x150 card and 170x110 inner dark content area | `menu.ginfo` or `guild.info:` |
| Guild management menu | `references/sample-packs/rpg-server-ui-reference/ui/guild.json` | guild action panel similar to ginfo, compact management buttons and detail card | `menu.guild` or `guild.manage:` |
| NPC custom menu | `references/sample-packs/rpg-server-ui-reference/ui/npc.json` | NPC-specific wide form route, spacious action buttons, hover decoration | `menu.npc` or `npc:` |
| General custom form router | `references/sample-packs/rpg-server-ui-reference/ui/form.json` | shared form logic and target-specific form composition | project-specific |
| Vanilla-safe server form | `references/verified-samples/bedrock-samples-ui/server_form.json` | vanilla form hierarchy, button collection shape, safe fallback behavior | none; default fallback |
| Token-routed server form | `references/sample-packs/rpg-server-ui-reference/ui/server_form.json` | route different form types from title/body markers | `menu.*` |
| Bottom NPC dialogue | `references/local-examples/npc-dialogue/ui/server_form.json` | bottom anchored dialogue box and dialogue button style | `npc:` or `dialogue:` |
| Full NPC interaction panel | `references/reference-mirrors/minecraft-bedrock-json-ui-sample/CNPC.UI.RP/CNPC UI [RP]/ui/npc_interact_screen.json` | framed NPC window, header, close button, side options, large body text | screen replacement or NPC route |
| Modern Cloud NPC student/teacher panel | `references/sample-packs/modern-cloud-ui-reference/ui/npc_interact_screen.json` | 125%y x 75% NPC panel, model area, scrollable message area, 40% button column, 26px response buttons | vanilla NPC screen replacement |
| Modern Cloud pause/menu layout | `references/sample-packs/modern-cloud-ui-reference/ui/pause_screen.json` | polished pause/menu structure, world info panel, 26px menu rows, 28px side icon buttons, player list panels | pause screen inspiration only |
| Advanced adventure form router | `docs/50-advanced-ui-reference-analysis.md` | production-scale long/custom form router with many feature pages, template modules, and title flag dispatch | project-owned flags |
| Advanced battle pass/store/quest/equipment UI | `docs/50-advanced-ui-reference-analysis.md` | large feature-specific form families: battle pass, store, quest, NPC, crafting, equipment, map, rewards | project-owned flags |
| Compact main menu form | `docs/51-compact-crafting-pocket-ui-reference.md` | small title-routed menu panel, fixed icon buttons, custom close button, vanilla fallback | project-owned flags |
| Dynamic dialogue bridge | `references/reference-mirrors/minecraft-bedrock-json-ui-sample/DynamicDialogV2-2/DynamicDialogV2-2/RP/ui/hud_screen.json` | dialogue driven through HUD/title-like data instead of normal server form | title/actionbar protocol |
| Chest server form | `references/sample-packs/rpg-server-ui-reference/ui/chest_server_form.json` | server form transformed into inventory-like menu | `chest:` or custom token |
| Chest inventory system | `references/sample-packs/rpg-server-ui-reference/ui/chest_inventory_system.json` | slot/grid composition and inventory-like repeated controls | `chest:` |
| Furnace/process form | `references/sample-packs/rpg-server-ui-reference/ui/furnace_server_form.json` | process-style UI with input/output/progress mental model | `furnace:` or `process:` |
| Chest UI external tool pattern | `references/mirrors/Chest-UI/RP/ui/server_form.json` | external chest-form authoring structure | tool-specific |
| EasyUIBuilder generated form | `references/mirrors/EasyUIBuilder/ui/server_form.json` | builder-style generated server form structure | generated |
| sample UI suite modern form controls | `references/reference-mirrors/minecraft-bedrock-json-ui-sample/json ui 개발/ui/sample UI suiteUI/ui_extras/server_form_controls.json` | search/input/toggle/slider/dropdown-style form controls | settings/config |
| dynamic form library custom form library | `references/reference-mirrors/minecraft-bedrock-json-ui-sample/dynamic form library/dynamic form libraryV2-1.0.3.3/dynamic form libraryV2-1.0.3.3/dynamic form library2/package_custom/common_custom.jsonc` | reusable form library layout and component composition | library-defined |
| Magic learning station | `references/reference-mirrors/minecraft-bedrock-json-ui-sample/magicwayui/magic_learning_station_screen.json` | RPG station screen and magic/skill progression visual direction | station or skill route |
| Premium multi-route form router | `docs/53-premium-ui-pattern-reference.md` | production-scale title-token dispatch, vanilla fallback, icon rows with loading placeholders | `ui:*` or project-owned hidden tokens |
| Premium chest/menu form bridge | `docs/53-premium-ui-pattern-reference.md` | maps `form_buttons` into chest/menu-like slots while preserving click routing | `ui:chest` or project-owned hidden tokens |

## Concrete Design Notes By Example

### Modern Cloud UI Reference Server Form Router

Source:

- `references/sample-packs/modern-cloud-ui-reference/ui/server_form.json`

Observed behavior:

- uses `$form_filter_text`: `customUI_`
- routes `customUI_InboxCloudForm_`
- routes `customUI_MailInfoCloudForm_`
- routes `customUI_RedesignShopCloudForm_`
- routes `customUI_FoodRecipeSelectCloudForm_`
- routes `customUI_FoodFurnaceCloudForm_`
- routes `customUI_MultiACloudForm_`
- routes `customUI_NotificationListCloudForm_`
- routes `customUI_RedesignShopBuySellCloudForm_`
- falls back to normal vanilla `long_form` or `custom_form` when the title does not start with `customUI_`

Use when:

- the target pack needs many custom form types
- PMMP can control the title prefix reliably
- one shared `server_form.json` must dispatch to several visual designs

Implementation advice:

- copy the routing idea only after adding the needed form files to `_ui_defs.json`
- use one stable prefix such as `customUI_`
- keep a vanilla fallback for ordinary server forms
- do not route by vague user-facing titles; route by hidden/internal prefix

### Modern Cloud Base Action Form

Source:

- `references/sample-packs/modern-cloud-ui-reference/ui/form/facelift_cloud_action_form.json`

Observed useful dimensions:

- cloud body: `100%y x 85%`
- title row: `100% x 26`
- close button panel: `20x20`
- content panel: `100% x fill`
- inner scroll panel: `100% - 4px`
- scroll bar: `5px`

Use when:

- making a clean modern action form
- the design should feel lighter than RPG Server UI dark panels
- the form body must be scrollable

Implementation advice:

- keep the title row short
- use the cloud base as a shared skin and put feature-specific content in separate files
- preserve `form_common.form_base` dependencies

### Modern Cloud UI Reference Inbox / Mail Forms

Sources:

- `references/sample-packs/modern-cloud-ui-reference/ui/form/inbox_cloud_action_form.json`
- `references/sample-packs/modern-cloud-ui-reference/ui/form/mail_info_cloud_action_form.json`

Observed useful dimensions:

- inbox form size: `95% x 95%`
- category rail: `140px` wide
- search row: `100% - 8px x 26`
- category row: `100% x 30`
- inbox message row: `100% x 40`
- mail detail form size: `85% x 80%`
- mail text panel: `60% x 100%`
- reward/action row: `100% x 45`

Use when:

- notifications need categories
- a server mail system has inbox/search/detail pages
- reward claiming or mail actions are part of the form

Implementation advice:

- use a left rail only when categories matter
- keep search at the top of the message list
- use the detail view for long text and rewards
- split inbox list and mail detail into separate routed forms

### Modern Cloud Shop / Recipe Grid

Sources:

- `references/sample-packs/modern-cloud-ui-reference/ui/form/redesign_shop_cloud_action_form.json`
- `references/sample-packs/modern-cloud-ui-reference/ui/form/redesign_shop_buy_sell_cloud_modal_form.json`
- `references/sample-packs/modern-cloud-ui-reference/ui/form/food_recipe_select_cloud_action_form.json`

Observed useful dimensions:

- shop/recipe form size: `90% x 95%`
- top option area: `100% x 24`
- top option button: `33.33% x 34`
- page button area: `24px x 100%`
- item grid cell: `10% x 100%x`
- item button inner padding: `100% - 4px`
- rounded item button texture: `textures/ui/form/button/round_corner_button`

Use when:

- many shop items or recipes must be browsed
- the UI needs page previous/current/next controls
- items need a modern grid instead of a compact list

Implementation advice:

- use the RPG server UI `shop.json` for compact shops
- use this Modern Cloud shop for larger stores with pagination
- route buy/sell confirmations to the modal form instead of putting everything in the grid

### Modern Cloud Furnace / Process Form

Source:

- `references/sample-packs/modern-cloud-ui-reference/ui/form/food_furnace_cloud_action_form.json`

Observed useful dimensions:

- centered form shell: `55% x 100%c`
- outer content: `100% - 20px x 100%c + 20px`
- close button: `20x20`
- inner grid panel: `60% x 100%c`
- process item cell: `33.33% x 100%x`
- furnace image panel: `70% x 70%`
- furnace image: `80% x 80%`

Use when:

- cooking, furnace, machine, crop processing, or upgrade process needs a visual form
- the server sends process states through `form_buttons`
- an on/off or animated machine image improves clarity

Implementation advice:

- use this for visual process state, not generic text menus
- verify furnace or machine texture paths before reuse
- keep input, machine, and output as separate cells

### Modern Cloud Server Menu / Friends List

Source:

- `references/sample-packs/modern-cloud-ui-reference/ui/form/multi_a_cloud_action_form.json`

Observed useful dimensions:

- form shell: `85% x 85%`
- menu card: `33.33% x 50%x`
- card inner padding: `100% - 8px`
- status icon: `8x8`, top-right offset `-6, 6`
- bottom label area: `100% x 50%`

Use when:

- a modern server menu needs large cards
- player/friend/server status indicators matter
- the form should look more like an app grid than a vanilla button list

Implementation advice:

- use card icons through `#form_button_texture`
- use status icons only if the data is actually meaningful
- keep each card title short because label area is limited

### Modern Cloud UI Reference Notification List

Source:

- `references/sample-packs/modern-cloud-ui-reference/ui/form/notification_list_cloud_action_form.json`

Observed useful dimensions:

- outer panel: `100% - 20px x 100% - 20px`
- close button: `24x24`
- centered list width: `75%`
- notification card: `50% x 45`
- scroll bar: `5px`
- has top-bottom entrance/exit animation templates

Use when:

- showing server announcements
- showing event notices
- showing patch notes or claimable alerts
- a list should animate in and out

Implementation advice:

- keep notification body concise
- use this instead of chat spam for important notices
- if the list can be long, keep the `75%` centered scroll panel

### Modern Cloud NPC Student/Teacher Panel

Source:

- `references/sample-packs/modern-cloud-ui-reference/ui/npc_interact_screen.json`

Observed useful dimensions:

- student content panel: `125%y x 75%`
- inner content padding: `100% - 12px`
- NPC model area: `fill x 100%`
- model top area: `100% x 45%`
- text scroll panel: `100% - 6px`
- NPC button column: `40% x 100%`
- student response button: `100% x 26`
- immersive reader button: `18x18`

Use when:

- replacing vanilla NPC interaction
- NPC needs a visible model area, text, and response buttons
- the design is closer to Bedrock vanilla NPC screen than PMMP server_form

Implementation advice:

- use this for true NPC interaction screens, not normal PMMP forms
- keep response count modest because each button is 26px tall
- put long dialogue in the scroll area

### RPG Menu Hub

Source:

- `references/sample-packs/rpg-server-ui-reference/ui/menu.json`

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

- `references/sample-packs/rpg-server-ui-reference/ui/quest.json`

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

- `references/sample-packs/rpg-server-ui-reference/ui/shop.json`

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

- `references/sample-packs/rpg-server-ui-reference/ui/stat.json`

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

- `references/sample-packs/rpg-server-ui-reference/ui/skill.json`

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

- `references/sample-packs/rpg-server-ui-reference/ui/craft.json`

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

- `references/sample-packs/rpg-server-ui-reference/ui/boss.json`

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

- `references/sample-packs/rpg-server-ui-reference/ui/gmenu.json`
- `references/sample-packs/rpg-server-ui-reference/ui/ginfo.json`
- `references/sample-packs/rpg-server-ui-reference/ui/guild.json`

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
- `references/sample-packs/rpg-server-ui-reference/ui/npc.json`
- `references/reference-mirrors/minecraft-bedrock-json-ui-sample/CNPC.UI.RP/CNPC UI [RP]/ui/npc_interact_screen.json`
- `references/reference-mirrors/minecraft-bedrock-json-ui-sample/DynamicDialogV2-2/DynamicDialogV2-2/RP/ui/hud_screen.json`

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

- `references/reference-mirrors/minecraft-bedrock-json-ui-sample/json ui 개발/ui/sample UI suiteUI/ui_extras/server_form_controls.json`
- `references/reference-mirrors/minecraft-bedrock-json-ui-sample/dynamic form library/dynamic form libraryV2-1.0.3.3/dynamic form libraryV2-1.0.3.3/dynamic form library2/package_custom/common_custom.jsonc`
- `references/mirrors/EasyUIBuilder/ui/server_form.json`

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
| modern inbox, mail, alerts, notices | Modern Cloud UI Reference `inbox_cloud_action_form.json`, `mail_info_cloud_action_form.json`, or `notification_list_cloud_action_form.json` |
| modern large shop or recipe browser | Modern Cloud UI Reference `redesign_shop_cloud_action_form.json` or `food_recipe_select_cloud_action_form.json` |
| modern process or machine UI | Modern Cloud UI Reference `food_furnace_cloud_action_form.json` |
| modern app-like server menu cards | Modern Cloud UI Reference `multi_a_cloud_action_form.json` |
| inventory-like menu | chest server form and chest inventory system |
| production, processing, upgrading | furnace/process form |
| settings/config panel | sample UI suite controls or dynamic form library common custom form |
| generic main menu | `menu.json`, vanilla shell, or token-routed server form |

## What To Put In Final Answers

When the AI uses one of these examples, it should say:

```text
Design reference:
- source: references/sample-packs/rpg-server-ui-reference/ui/quest.json
- role: quest list window
- reused: 220x220 compact panel, 200x171 scroll viewport, 175x40 list buttons
- changed: namespace, route prefix, textures, PMMP button payload
```

This makes it clear whether the AI copied structure, copied dimensions, or only used the example as visual inspiration.
