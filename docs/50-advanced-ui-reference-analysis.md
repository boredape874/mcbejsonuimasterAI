# Advanced Adventure UI Reference Analysis

Use this when the user wants a polished, large-scale Bedrock JSON UI system: RPG menus, battle pass, store pages, equipment windows, quest pages, NPC vendor forms, map screens, reward screens, custom HUD status panels, and premium-feeling button/texture systems.

The raw reference is intentionally treated as a private local source. Do not commit the original JSON, textures, sounds, or pack assets unless redistribution rights are clear.

Local private mirror convention:

- `references/private/advanced-ui-reference/`
- ignored by git
- imported with `scripts/import-private-advanced-ui-reference.ps1`
- the import script normalizes the first detected Bedrock UI pack to `ui-pack`

## Why This Reference Matters

This reference is valuable because it is not a small single-screen snippet. It demonstrates a full production-style UI architecture:

- `_ui_defs.json` registers templates before concrete screens.
- `server_form.json` acts as a high-level router for many form families.
- shared template files centralize labels, windows, dialogs, buttons, toggles, gradients, and generated controls.
- form screens are grouped by feature domain: battle pass, camp customization, crafting, dungeon, map, NPC, PDA/equipment, quest, store, start/news, and loading.
- HUD overlays and vanilla screen skins are integrated with the same visual language.
- textures are organized as a real UI design system under `textures/ui/n/*`.

## Key Entry Files

When the private mirror exists, open these first:

```text
references/private/advanced-ui-reference/ui-pack/ui/_ui_defs.json
references/private/advanced-ui-reference/ui-pack/ui/server_form.json
references/private/advanced-ui-reference/ui-pack/ui/<feature_root>/templates/common.json
references/private/advanced-ui-reference/ui-pack/ui/<feature_root>/templates/buttons.json
references/private/advanced-ui-reference/ui-pack/ui/<feature_root>/templates/dialogs.json
references/private/advanced-ui-reference/ui-pack/ui/<feature_root>/templates/toggle.json
references/private/advanced-ui-reference/ui-pack/ui/hud_screen.json
references/private/advanced-ui-reference/ui-pack/ui/inventory_screen.json
references/private/advanced-ui-reference/ui-pack/ui/npc_interact_screen.json
```

Do not start by opening every file. Start from `_ui_defs.json`, find the concrete feature-root folder registered there, then jump to the exact form family. Public docs intentionally call that folder `<feature_root>` so the repository stays source-neutral.

## Architecture

### Registration

The `_ui_defs.json` pattern is:

1. register template modules
2. register every feature-specific form module
3. register HUD modules
4. register store/start/loading modules

This ordering matters because many concrete forms depend on shared template controls.

Template groups:

```text
templates/n_common.json
templates/common.json
templates/dialogs.json
templates/buttons.json
templates/toggle.json
templates/legacy_common.json
```

Feature groups:

```text
forms/battlepass
forms/camp
forms/crafting
forms/dungeon
forms/freeroam
forms/npc
forms/pda
forms/quest
forms/start
forms/store
hud
```

### Server Form Router

`server_form.json` is the strongest pattern in the set.

Important ideas:

- the vanilla `long_form` and `custom_form` are not blindly replaced
- visibility is controlled by title flags
- the original title is preserved in a separate binding
- the title is transformed before parsing to avoid JSON UI numeric-string edge cases
- `collection_panel` plus `factory.control_ids` dispatches many form types from one router
- each route maps to a named feature panel such as reward, character, vendor, quest, store, crafting, navigation, loading, or battle pass

Reusable pattern:

```text
title flag -> visibility condition -> collection length -> factory control id -> feature form panel
```

Use this when a PMMP plugin needs many custom form pages but should keep a vanilla fallback.

### Template System

The shared templates provide:

- auto-sizing labels
- binding-driven labels
- gradient-backed panels
- horizontal windows
- dividers
- reusable icon and color variants
- button state presets
- toggle state presets
- dialog shells

Important design lesson:

- create a small template vocabulary first
- route every form through that vocabulary
- avoid copying large visual structures into every form file

## Concrete Layout Lessons

These measurements are source-derived patterns, not hard requirements. Use them as starting dimensions when adapting a similar design into a target pack.

### Form Size Bands

The reference keeps most complex long-form pages inside compact desktop-safe sizes:

| Form family | Useful starting size |
| --- | --- |
| confirmation, reward, NPC vendor/dialogue, premium pass | `380 x 260` |
| equipment, crafting, ability, inventory modal, battle pass | `370 x 250` |
| tall camp/customization page | `355 x min(100% - 10px, 380px)` |
| store pages | full-screen shell, then page-local panels |

Practical rule:

- keep classic server form replacements at or under roughly `260px` high when the UI must behave like a modal
- use a full-screen shell only when the form has its own page navigation, tutorial, store, or battle-pass structure
- split feature pages into form-family files instead of adding every state to one huge `server_form.json`

### Useful Ratios

Patterns worth reusing:

- store landing: left feature column near `30%`, right option/content area uses `fill`
- battle pass: side reward rail around `30px`, reward-node column width around `14.28%` for seven-step tracks
- battle pass pass selector: two stacked halves, free on top and premium on bottom
- quest board: header around `27%` height, content around `73%`, quest grid `3 x 3`
- equipment character page: large character panel around `55% x 70%`, category/header strip around `24px`
- top icon buttons: square `26 x 26`, inner glyphs around `9-13px`
- small UI icons inside labels or headers: usually `16 x 16`

Use these as design references, then adapt to the target pack's actual content density and mobile behavior.

### Binding And Payload Strategy

The router demonstrates three important JSON UI survival techniques:

- preserve the original `#title_text` in a separate binding before transforming it
- add a non-numeric sentinel before parsing title/body text so numeric-only payload chunks do not break expression logic
- keep `#form_text` in a holder control before deriving sliced or routed values, because it behaves like a global binding

For PMMP, prefer a clear route convention:

```text
<route-prefix><payload>
```

Examples:

```text
quest:campaign:<encoded payload>
store:list:<encoded payload>
equip:character:<encoded payload>
bp:track:<encoded payload>
```

Then adapt the reference pattern as:

```text
route prefix -> visibility -> collection length -> factory control id -> feature panel
```

Do not reuse source-specific route flags. Define your own prefix set in `_global_variables.json` or in the target form module.

## Design Families

### Battle Pass / Reward Track

Open:

```text
ui/<feature_root>/forms/battlepass/battle_pass.json
ui/<feature_root>/forms/battlepass/premium_pass.json
```

Good for:

- seasonal pass pages
- reward tracks
- free/premium split panels
- node state visuals
- XP/progress bars
- reward cards

Pattern notes:

- uses `form_buttons` collection heavily
- maps button texture payloads into visual state
- uses a themed texture family under `textures/ui/n/battlepass/*`

### Store / Purchase Flow

Open:

```text
ui/<feature_root>/forms/store/landing_page.json
ui/<feature_root>/forms/store/list_page.json
ui/<feature_root>/forms/store/purchase_page.json
ui/<feature_root>/forms/store/purchase_error_page.json
ui/<feature_root>/forms/store/tutorial_page.json
ui/<feature_root>/forms/store/store_common.json
```

Good for:

- server shop landing pages
- category grids
- purchase confirmations
- purchase error handling
- tutorial/onboarding pages

Pattern notes:

- keep store common controls separate from page implementations
- route each state into a separate panel rather than one huge conditional form
- use clear error pages instead of silently failing

### Quest And NPC

Open:

```text
ui/<feature_root>/forms/quest/quest_default.json
ui/<feature_root>/forms/quest/quest_campaign.json
ui/<feature_root>/forms/quest/tracked_quest_hud.json
ui/<feature_root>/forms/npc/vendor.json
ui/<feature_root>/forms/npc/npc_quest.json
ui/npc_interact_screen.json
```

Good for:

- quest board
- campaign quest list
- tracked quest HUD
- NPC vendor
- NPC quest dialogue
- full NPC interaction skin

Pattern notes:

- use separate form files for quest list, quest detail, and tracked HUD
- do not mix NPC vendor and NPC dialogue logic in one template
- keep title/body parsing in router or data holder controls

### Crafting / Equipment / Inventory

Open:

```text
ui/<feature_root>/forms/crafting/crafting_armor.json
ui/<feature_root>/forms/crafting/crafting_modal.json
ui/<feature_root>/forms/crafting/crafting_confirmation.json
ui/<feature_root>/forms/crafting/dismantler_modal.json
ui/<feature_root>/forms/pda/equip_character.json
ui/<feature_root>/forms/pda/equip_modal.json
ui/<feature_root>/forms/pda/inv_modal.json
ui/inventory_screen.json
```

Good for:

- RPG equipment screen
- armor/weapon/accessory crafting
- dismantle/transfer confirmation
- item modal details
- character stats panel

Pattern notes:

- use grids for item choices
- use modal forms for confirmation and item details
- separate equipment tabs by category
- keep character/inventory screen skinning separate from server form routing

### Map / Navigation

Open:

```text
ui/<feature_root>/forms/freeroam/area_map.json
ui/<feature_root>/forms/pda/navigation.json
ui/<feature_root>/forms/pda/navigation_confirm.json
```

Good for:

- waypoint map
- zone select
- travel confirmation
- compass/navigation UI

Pattern notes:

- use texture-index mapping for directional or map state icons
- keep confirm step as its own route
- avoid embedding all navigation states in one visible panel

### Camp / Base Customization

Open:

```text
ui/<feature_root>/forms/camp/campsite_default.json
ui/<feature_root>/forms/camp/campsite_layout.json
ui/<feature_root>/forms/camp/campsite_customize.json
```

Good for:

- base customization
- layout selection
- feature unlocks
- side tab menus

Pattern notes:

- side tabs can be stateful and texture-backed
- locked/unlocked states should be explicit
- separate default/layout/customize screens

### HUD Status And Toasts

Open:

```text
ui/<feature_root>/hud/custom_status.json
ui/<feature_root>/hud/player_stats.json
ui/<feature_root>/hud/rewards_toast_notification.json
ui/hud_screen.json
```

Good for:

- custom player status
- RPG stats HUD
- reward toast notification
- actionbar/subtitle overlay skinning

Pattern notes:

- HUD additions should be inserted through `root_panel.modifications`
- keep reward toast as a reusable control
- use small dedicated HUD files instead of bloating `hud_screen.json`

## Texture Design System

The texture hierarchy is one of the best parts of the reference.

Common families:

```text
textures/ui/n/common
textures/ui/n/battlepass
textures/ui/n/character
textures/ui/n/craft
textures/ui/n/inv_modal
textures/ui/n/nav
textures/ui/n/rewards
textures/ui/n/start
textures/ui/n/store
textures/ui/n/icon/ui
```

Design lessons:

- use white mask textures plus color variables for reusable panels
- keep button colors as texture families: dark, blue, pink, green, gold, red
- keep pressed/locked/default states as parallel assets
- put feature-specific icons under feature folders
- do not hardcode random texture paths in form files when a shared template variable can select the state

## When To Use This Reference

Use it for:

- premium RPG server menu
- battle pass UI
- quest campaign UI
- NPC vendor and NPC quest UI
- store pages and purchase flow
- equipment/inventory modal UI
- map/navigation UI
- reward toast notifications
- large multi-form PMMP routing systems

Do not use it for:

- tiny one-off admin forms
- vanilla-safe minimal forms
- public examples that must include copyable raw assets
- packs where redistribution rights for the reference assets are unclear

## AI Application Rules

1. If the private mirror exists, inspect exact files from this doc.
2. Do not paste large original JSON blocks into public docs or generated output.
3. Extract architecture and dimensions, then rewrite in the target namespace.
4. Preserve target pack paths and `_ui_defs.json` style.
5. Replace source-specific flags with project-owned prefixes such as `menu.quest`, `shop:`, `customUI_`, or another PMMP-controlled protocol.
6. Verify every texture path against the target pack, not the private reference.
