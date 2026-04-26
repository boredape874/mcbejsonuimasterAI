# Design Recommendation Catalog

Use this when choosing a visual direction before implementing a Bedrock JSON UI screen.

This is not a replacement for source inspection. It is a routing catalog: pick a design family, open the listed reference file, then copy only the needed layout fragments into the target resource pack.

For feature-labeled examples such as "this is a quest window" or "this is a shop window", load `docs/40-server-form-example-index.md` after this document.

When the chosen design will be authored through the kit's tools layer (IR), see `docs/44-design-to-ir-mapping.md` for direct constraint encodings.

## User Choice Rule

Design is subjective. If the user did not already provide a clear visual direction, the AI should not silently pick one final style.

Ask or present a short choice before implementation when:

- the request says only "make it look good", "make a server form", "make a quest UI", or similar
- multiple design families fit the feature
- the target pack does not already have a strong established style
- the change would affect the main visual identity of a server menu

Recommended response shape:

```text
I can base this on one of these styles:
1. Compact quest/shop panel: RPG server UI quest/shop style, small RPG menu, good for dense PMMP menus.
2. Framed NPC panel: header + side choices + large text body, good for quest/NPC/story screens.
3. Vanilla-safe form skin: safer and simpler, good when compatibility matters.

If you already have a preferred design reference, send the file/path/image and I will use that instead.
```

Only proceed without asking when:

- the user already named a style or reference file
- the task is a bug fix, not a design choice
- the target pack has one obvious style that should be preserved
- the user explicitly asked Codex to choose automatically

## Quick Choice Table

| Need | Recommended style | Open first |
| --- | --- | --- |
| Safe modal form that still feels close to vanilla | vanilla server form shell | `references/official/bedrock-samples-ui/server_form.json` |
| PMMP menu with custom form routing | token-routed server form | `references/source-packs/rpg-server-ui-reference/ui/server_form.json` |
| NPC dialogue, quest text, story message | bottom dialogue box | `references/local-examples/npc-dialogue/ui/server_form.json` |
| NPC or shop panel with side buttons and large body text | framed NPC panel | `references/upstreams/minecraft-bedrock-json-ui-sample/CNPC.UI.RP/CNPC UI [RP]/ui/npc_interact_screen.json` |
| RPG stats, skills, profile, currency, shop categories | dark stat/card menu | `references/source-packs/rpg-server-ui-reference/ui/stat.json` |
| inventory-like custom form | chest-like form | `references/source-packs/rpg-server-ui-reference/ui/chest_server_form.json` |
| smelting, upgrade, craft, process UI | furnace-like form | `references/source-packs/rpg-server-ui-reference/ui/furnace_server_form.json` |
| settings/search/toggle/slider/text input style | RainbowPie form controls | `references/upstreams/minecraft-bedrock-json-ui-sample/json ui 개발/ui/RainbowPieUI/ui_extras/server_form_controls.json` |
| large reusable custom form library pattern | StarLib form library | `references/upstreams/minecraft-bedrock-json-ui-sample/starLib/StarLibV2-1.0.3.3/StarLibV2-1.0.3.3/starlib2/package_custom/common_custom.jsonc` |
| polished modern cloud form system | Modern Cloud forms | `references/source-packs/modern-cloud-ui-reference/ui/server_form.json` |
| modern inbox/mail/notification forms | Modern Cloud communication forms | `references/source-packs/modern-cloud-ui-reference/ui/form/inbox_cloud_action_form.json` |
| modern large shop/recipe grid | Modern Cloud shop/recipe forms | `references/source-packs/modern-cloud-ui-reference/ui/form/redesign_shop_cloud_action_form.json` |
| modern process/machine UI | Modern Cloud furnace form | `references/source-packs/modern-cloud-ui-reference/ui/form/food_furnace_cloud_action_form.json` |

## Feature-Labeled Examples

If the user names a concrete server feature, prefer the example index:

- `docs/40-server-form-example-index.md`

That document labels examples as quest window, shop window, stat window, skill window, NPC dialogue, settings/config form, chest form, furnace/process form, Modern Cloud forms, inbox/mail forms, notification lists, and modern shop grids. This helps the AI choose a reference before inspecting source JSON.

## Size And Layout Rules

These are starting values, not universal laws. Confirm against the target screen and device mode.

| UI part | Practical starting size | Notes |
| --- | --- | --- |
| Full modal root panel | `["100%", "100%"]` | Use as the screen-level container. Do not put fixed-size content directly at root without anchors. |
| Center modal body | width `220px` to `320px`, height `140px` to `220px` | Good for simple server forms, confirmation dialogs, and small admin menus. |
| Wide content modal | width `60%` to `75%`, max visual width around `420px` | Better for NPC dialogue, quest text, shop details, and scrollable descriptions. |
| Bottom dialogue panel | width `80%` to `95%`, height `55px` to `95px` | Anchor to bottom center. Keep text scrollable or clipped; do not let long lines overlap buttons. |
| Side navigation column | width `70px` to `110px` | Use for category buttons. Keep labels short or use icons plus tooltip-like labels when possible. |
| Body text scroll region | width `100%`, height `100%c` or fixed `90px` to `170px` | Prefer a `scroll_view` when server text can exceed one paragraph. |
| Form button row | height `24px` to `36px` | Small lists use `24px`; touch-friendly menus use `30px` or more. |
| Icon button | `16px` to `24px` square | Use verified `textures/ui/*` paths. Keep close/back/search buttons consistent. |
| List item/card | height `28px` to `48px` | Use larger rows when item icons, prices, cooldowns, or descriptions are included. |
| Horizontal carousel item | width `80px` to `120px`, height `40px` to `70px` | Clip the parent panel and animate offset instead of relying on true free horizontal scroll. |
| Outer padding | `4px` to `10px` | Bedrock UI often needs tighter spacing than web UI. Use more padding only on wide panels. |
| Gap between stacked controls | `2px` to `6px` | Large gaps make JSON UI forms look empty on small screens. |

## Server Form Design Families

### Vanilla Shell

Use this when stability matters more than originality.

References:

- `references/official/bedrock-samples-ui/server_form.json`
- `references/source-packs/rpg-server-ui-reference/ui/server_form.json`

Recommended use:

- basic command menus
- yes/no confirmation
- admin tools
- menus where custom assets are not ready

Design notes:

- keep the default title/body/button hierarchy
- customize button templates cautiously
- preserve `form_buttons` and the form collection binding shape
- use this as the fallback route when a custom title prefix is not matched

### Bottom NPC Dialogue

Use this for story, NPC speech, and lightweight quest prompts.

Reference:

- `references/local-examples/npc-dialogue/ui/server_form.json`

Recommended size:

- dialogue panel: `80%` to `95%` width
- panel height: `55px` to `95px`
- portrait/icon area, if added: `40px` to `64px` square
- text region: remaining width, clipped or scrollable

Design notes:

- anchor the panel to bottom center
- keep choices as short buttons below or beside the text
- let PMMP send a title prefix such as `npc:` or `dialogue:` so the UI can route safely
- do not overload this style with inventory grids or many categories

### Framed NPC Or Shop Panel

Use this when the form needs both navigation and a large reading area.

Reference:

- `references/upstreams/minecraft-bedrock-json-ui-sample/CNPC.UI.RP/CNPC UI [RP]/ui/npc_interact_screen.json`

Recommended size:

- outer panel: `60%` to `75%` width
- header height: `20px` to `30px`
- side button column: `70px` to `110px`
- content body: `100%c` remaining width
- close button: `16px` to `22px` square

Design notes:

- use the side column for categories such as `Talk`, `Shop`, `Quest`, `Reward`
- put long descriptions in a scrollable body area
- use a clear header and a close/back button
- avoid nested card-inside-card structure; use one framed panel and repeated list/card items inside it

### RPG Stat Or Card Menu

Use this for player profile, stats, skill pages, quest entries, shops, and currency displays.

References:

- `references/source-packs/rpg-server-ui-reference/ui/stat.json`
- `references/source-packs/rpg-server-ui-reference/ui/skill.json`
- `references/source-packs/rpg-server-ui-reference/ui/shop.json`
- `references/source-packs/rpg-server-ui-reference/ui/quest.json`

Recommended size:

- page body: `240px` to `360px` wide for compact forms
- stat row: `18px` to `28px` tall
- card/list item: `32px` to `48px` tall
- icon: `16px` to `24px`

Design notes:

- use repeated rows for values instead of huge paragraphs
- reserve one side or header area for currency/level/progress
- use verified item or UI textures for icons
- if PMMP drives values, prefer prepared text slices or scoreboard/title data instead of complex JSON UI parsing loops

### Chest-Like Inventory Form

Use this when the form represents slots, rewards, storage, kit selection, or item picking.

References:

- `references/source-packs/rpg-server-ui-reference/ui/chest_server_form.json`
- `references/source-packs/rpg-server-ui-reference/ui/chest_inventory_system.json`
- `references/official/bedrock-samples-ui/chest_screen.json`

Recommended size:

- slot: match vanilla-like square slot sizing from the source screen
- grid columns: keep familiar Minecraft inventory proportions when possible
- label/header: `18px` to `28px` tall

Design notes:

- make the screen look like an inventory only when the interaction is actually item-like
- use a title prefix route for chest substitution
- keep slot textures and item icons verified against vanilla or bundled pack assets
- avoid using chest style for normal text-heavy forms

### Furnace Or Process Form

Use this for crafting, upgrading, smelting, timers, machines, and conversion menus.

References:

- `references/source-packs/rpg-server-ui-reference/ui/furnace_server_form.json`
- `references/official/bedrock-samples-ui/furnace_screen.json`

Recommended size:

- process panel: `180px` to `260px` wide
- input/output slots: vanilla slot scale
- arrow/progress region: `20px` to `40px` wide
- status label: `18px` to `24px` tall

Design notes:

- show input, process, output, and status as separate areas
- use progress bars from `docs/33-animation-patterns-and-dumper-values.md` if the process needs animation
- keep the server-side state simple: current item, output item, progress, allowed action

### Modern Control Panel

Use this for settings, search, toggles, sliders, text input, filters, and server-side configuration forms.

Reference:

- `references/upstreams/minecraft-bedrock-json-ui-sample/json ui 개발/ui/RainbowPieUI/ui_extras/server_form_controls.json`

Recommended size:

- search/input row: `24px` to `32px` tall
- toggle row: `22px` to `30px` tall
- slider row: `26px` to `36px` tall
- settings section header: `18px` to `24px` tall

Design notes:

- group related controls into sections
- keep labels short and values visible
- put destructive commands behind confirmation
- if using custom input behavior, document which vanilla binding or collection source drives it

## Choosing A Style For PMMP Menus

| PMMP feature | Best starting style | Why |
| --- | --- | --- |
| `/menu` main server menu | vanilla shell or framed panel | readable, stable, easy to route |
| NPC conversation | bottom NPC dialogue | natural in-game placement |
| quest board | framed NPC panel or RPG card menu | supports category list and description body |
| shop categories | RPG card menu or framed panel | can show icon, price, stock, and action |
| kit selector | chest-like form | item-grid mental model matches kits |
| machine/crop processing | furnace/process form | input-output-progress model is clear |
| player profile/stats | RPG stat menu | dense values without long paragraphs |
| settings/config | modern control panel | search/toggle/slider/input patterns fit |

## Implementation Checklist

Before editing JSON UI:

1. Choose the design family.
2. If the user did not choose a style, present 2-3 recommended design directions before implementation.
3. Choose the route condition: title prefix, form type, or screen replacement.
4. Verify the target pack loads the file from `_ui_defs.json`.
5. Verify texture paths through `docs/13-vanilla-asset-workflow.md` or bundled assets.
6. Decide fixed sizes only for repeated elements such as slots, icon buttons, list rows, and headers.
7. Use `%`, `%c`, anchors, and scroll panels for content that must survive different window sizes.
8. Preserve vanilla collection bindings such as `form_buttons` unless the source pattern intentionally replaces them.

## Prompt Shape For AI

When asking Codex to design a form, give this shape:

```text
Use mcbe-json-ui-master.
Design a <server_form / chest-like form / NPC dialogue / settings form> for <feature>.
Use docs/39-design-recommendation-catalog.md.
Preferred style: <one design family>.
Target pack: <path>.
Route prefix: <prefix in form title, if any>.
Required data: <button names, values, icons, PMMP payload fields>.
Do not invent texture paths; verify vanilla or bundled texture paths first.
Keep the layout safe on small screens.
```

## Anti-Patterns

- Do not use a chest-style UI for plain text menus.
- Do not put many long labels into fixed-width buttons without clipping or dynamic sizing.
- Do not invent `textures/ui/*` paths.
- Do not hardcode one screen-size assumption into the root screen.
- Do not make every server form a full custom UI if vanilla shell routing is enough.
- Do not merge multiple form systems by overwriting `server_form.json` blindly; route by title prefix or extracted condition.
