# 52 - JSON UI Intake Questionnaire

Use this when the user says they want to make a Bedrock JSON UI but has not yet supplied a complete spec.

The goal is not to interrogate the user. The goal is to turn beginner-friendly choices into an implementation-ready plan that can drive:

1. IR/tools for geometry: position, size, alignment, spacing, symmetry.
2. Hand-finished Bedrock JSON UI: bindings, collections, factories, animations, screen modifications, and PMMP or Script API payloads.

## Operating rule

Ask the fewest questions that remove the biggest ambiguity first. Offer simple choices, but allow free-form answers.

When the request includes exact layout, alignment, image reference, form design, HUD composition, or repeated elements, treat `workspace/<task>/ir.yaml` as the geometry source of truth. The AI may hand-finish the final JSON UI, but must preserve solved layout values from `solved.json` or compiled `ui.json`. If geometry is wrong, update `ir.yaml` and rerun tools.

## Quick intake

Use this compact version when the user is a beginner or just says "I want to make JSON UI".

Ask in stages. Do not dump every question at once unless the user explicitly asks for a full planning sheet.

Recommended stage flow:

1. Purpose and UI type.
2. Where it appears.
3. Data and dynamic behavior.
4. Visual references and style.
5. Control skinning: button, scrollbar, icon, progress bar, panel textures.
6. Layout rules.
7. Output target and implementation plan.

After each stage, summarize what is known in plain language and ask the next smallest set of questions.

### 1. What are we making?

Ask:

> What kind of Bedrock JSON UI do you want to make?

Offer:

- HUD overlay: scoreboard, status panel, topbar, notification, actionbar UI.
- Server form redesign: menu, shop, quest, ranking, skill tree, NPC dialogue, confirmation popup.
- Inventory-like UI: chest UI, custom container, item grid, recipe/crafting UI.
- Full screen menu: profile, guidebook, settings, map, collection book.
- Existing UI fix: current UI is misaligned, invisible, clipped, or broken.

Implementation routing:

- HUD overlay -> `hud_screen.json`, `docs/17`, `docs/25`, tools if layout-heavy.
- Server form -> `server_form.json`, `docs/39`, `docs/40`, tools for static form geometry.
- Inventory-like UI -> sample-first, `docs/38`, `docs/47`, raw JSON for hardcoded slots.
- Full screen menu -> tools first for layout, then raw JSON for interactions.
- Existing UI fix -> debugging first, then tools only for geometry refactor.

### 2. Where should it appear?

Ask:

> When and where should this UI appear?

Offer:

- Always visible on HUD.
- Only when server sends title/actionbar/chat/form text.
- Only inside `server_form.json`.
- Only on a specific vanilla screen.
- Replaces or modifies an existing pack UI.

Need to capture:

- Target screen file.
- Whether `_ui_defs.json` needs a new entry.
- Whether the UI is passive display or server-controlled.
- Whether the user expects mouse/controller/touch interaction.

### 3. What information does it show?

Ask:

> What information should be visible on the screen?

Offer:

- Static text.
- Player score or stats.
- Money, level, exp, job, skill, quest progress.
- Buttons with icons.
- Item or block icons.
- Dynamic list of players/items/quests.
- Images, backgrounds, badges, progress bars.

Need to capture:

- Each field name.
- Example value.
- Whether it changes often.
- Whether it comes from PMMP, Script API, scoreboard collection, or vanilla binding.

### 3.5. Does anything change size, color, visibility, or count?

Ask:

> Should any panel, bar, text, image, or button change depending on the value or content?

Offer:

- Fixed size: the UI always keeps the same size.
- Content-sized: the panel grows or shrinks to fit text/buttons/icons.
- Value bar: progress/HP/EXP/cooldown changes width or fill amount.
- Conditional color: color changes when value is low/high/complete/locked.
- Conditional visibility: show or hide parts depending on state.
- Dynamic list: number of rows/buttons/items can change.
- Animated change: fade, slide, pulse, scroll, or carousel movement.
- Unknown: AI chooses the safest stable layout.

Translate answers:

- Fixed size -> IR/tools first with numeric `size`.
- Content-sized -> raw JSON UI sizing such as `"100%c"`, `"100%cm"`, stack panels, or vanilla content templates; use tools only for the static outer skeleton.
- Value bar -> `clip_ratio`, `clip_direction`, bindings, or PMMP-provided normalized value.
- Conditional color/visibility -> view bindings, server-provided state fields, or separate controls with `#visible`.
- Dynamic list -> collection/factory pattern; tools may define the row/card skeleton, but collection behavior is hand-finished.
- Animated change -> `anims`, `anim_type`, `play_event`, `reset_event`, or offset/alpha/clip animation recipes.

Need to capture:

- Which element changes.
- What value controls it.
- Example states, for example `hp=20/100`, `quest=complete`, `locked=true`.
- Minimum and maximum expected size or count.
- Whether changing size may push nearby elements or should clip/scroll instead.

### 4. What style should it follow?

Ask:

> What visual style should it use?

Offer:

- Vanilla-like: Minecraft default dialog/button frame.
- RPG fantasy: quest, skill, NPC, stat window.
- Modern clean: flat cards, clear spacing, readable panels.
- Cute/farm/life: soft colors, rounded panels, item icons.
- Compact utility: small HUD, scoreboard, admin panel.
- Reference-based: user provides screenshot or existing JSON UI.

Rule:

- If user has no style, offer 2-3 design families from `docs/39` and `docs/40` before implementing.
- Do not expose restricted source pack names. Describe reusable design families, not original pack identity.
- Show the user reference category names and what each is good for. Do not require them to read raw JSON unless they ask.

Reference choices to show:

- Vanilla-safe form: safest compatibility, good for admin/menu/confirm UI.
- RPG quest/shop/stat panel: good for PMMP economy, quests, stats, skills.
- NPC dialogue panel: good for story text and choices.
- Compact HUD/status panel: good for always-visible score, money, level, cooldown.
- Inventory-like grid: good for shop, recipe, storage, custom item menus.
- Modern card/list UI: good for mail, notification, battle pass, guidebook.

### 4.5. Should controls use custom textures?

Ask:

> Should buttons, scrollbars, panels, icons, and progress bars use vanilla textures, custom textures, or simple solid panels?

Offer:

- Vanilla textures only: safest, uses verified `textures/ui/*`.
- Custom pack textures: user provides or wants new textures under `textures/ui/...`.
- Mixed: vanilla frame plus custom icons/backgrounds.
- Simple JSON UI shapes: minimal images/panels, fewer texture dependencies.
- Match existing RP style: reuse textures already in the target pack.
- Unknown: AI chooses vanilla-safe defaults.

Ask per control when relevant:

- Buttons: default, hover, pressed, locked, selected textures?
- Icon buttons: close, back, search, refresh, plus, minus, confirm, cancel?
- Scrollbar: visible track and thumb, hidden scrollbar, or vanilla default?
- Progress bars: vanilla XP-style, custom bar, clipped image, segmented bar?
- Panels/cards: flat background, nineslice frame, vanilla dialog frame, transparent panel?
- List rows: separate row background, selected row texture, hover row texture?
- Toggles/sliders/dropdowns: vanilla-like or custom skinned?

Need to capture:

- Texture source: vanilla, current RP, new custom texture, or none.
- Exact texture paths if known.
- Whether missing custom textures should be generated later or replaced with vanilla paths.
- Whether hover/pressed/locked states matter for mouse/controller users.

Implementation routing:

- Vanilla texture lookup -> `docs/13-vanilla-asset-workflow.md` and `mcbe-json-ui-vanilla-assets`.
- Existing RP texture reuse -> inspect target `textures/`, `textures/ui/`, `textures/item_texture.json`, and `textures/terrain_texture.json`.
- Button states -> raw JSON UI `default_control`, `hover_control`, `pressed_control`, `locked_control`.
- Scrollbar skin -> raw JSON UI scroll view/scrollbar controls; tools may define the scroll area but not the final state controls.
- Progress bar skin -> `clip_direction`, `clip_ratio`, and foreground/background image controls.

### 5. What layout matters most?

Ask:

> Which layout rules must be preserved?

Offer:

- Centered modal.
- Equal button sizes.
- Equal gaps.
- Left/right symmetry.
- Top/bottom safe margin.
- Scrollable list.
- Grid with fixed card size.
- Mobile-friendly compact layout.
- PC large-screen layout.
- Content can grow but must stay inside a fixed safe area.
- Text can be long and should scroll or clip safely.
- List can have many entries and should scroll.

Convert answers to IR constraints:

- Equal button sizes -> `same_size`.
- Equal gaps -> `equal_gap_x` or `equal_gap_y`.
- Left/right symmetry -> `symmetric_x`.
- Same row baseline -> `align_y`.
- Same column edge -> `align_x`.
- Fixed inset from panel edge -> `edge_offset`.

Convert answers to dynamic layout rules:

- Long text -> scroll region or clipped label; do not let it overlap buttons.
- Many entries -> collection/factory plus scroll view.
- Growing panel -> use content-size expressions only inside a bounded outer panel.
- Progress/HP/EXP -> fixed background with clipped foreground; do not resize the entire parent unless explicitly requested.

### 6. How is it controlled?

Ask:

> How should the server or script control this UI?

Offer:

- PMMP sends title/actionbar payload.
- PMMP sends server form title/body/button text.
- Script API sends title/actionbar/form text.
- Vanilla scoreboard/list collection.
- Static RP-only UI.

Need to capture:

- Payload example.
- Separator format if strings are parsed.
- Update frequency.
- Whether values must preserve spaces, colors, icons, or numeric text.
- Whether each value is a number, plain text, boolean state, enum state, or list item.
- Whether values can contain the separator character.

Beginner-friendly data explanation:

- Number: money, level, percent, cooldown.
- Text: player name, quest name, message.
- Yes/no: locked, selected, completed, visible.
- Choice: rank type, category, rarity, job.
- List: shop items, quests, players, rewards.

### 7. What files should be changed?

Ask:

> Should this become a new sample resource pack, or should it patch the current RP?

Offer:

- New standalone sample pack.
- Patch current RP.
- Create only reusable JSON fragments.
- Create IR workspace first, then patch target files.

Need to capture:

- Target RP path.
- Target file names.
- Namespace preference.
- Whether existing pack naming must be preserved.

## Full planning questionnaire

Use this when the user explicitly asks to plan the UI before implementation.

The AI should ask this in rounds, not as one wall of text:

- Round 1: purpose, UI type, target screen.
- Round 2: data fields and dynamic behavior.
- Round 3: visual references and layout rules.
- Round 4: implementation target and validation.

After each round, produce a small "current spec" block.

### A. Purpose

- What problem does this UI solve?
- Who uses it: normal player, admin, developer, tester, shop user, quest player?
- Is it for gameplay, information display, monetization/shop, tutorial, debugging, or server branding?
- What action should the player take after seeing it?

### B. Screen target

- Target screen: `hud_screen.json`, `server_form.json`, `chat_screen.json`, `inventory_screen.json`, custom screen, or unknown.
- Should it replace vanilla controls or insert additional controls?
- Should it be visible behind gameplay?
- Should it accept input?
- Does it need mouse and keyboard only, or touch/controller too?

### C. Data model

For every displayed value, collect:

- Name: for example money, level, exp, quest_name, quest_progress.
- Example: for example `1200`, `Lv. 15`, `3/10`, `Farmer`.
- Source: PMMP, Script API, scoreboard, vanilla binding, static.
- Update timing: once, every second, on event, on open, on close.
- Parsing: direct value, separator split, fixed-width slice, collection binding.
- Value type: number, text, boolean, enum, list.
- Dynamic effect: changes text, size, progress fill, color, visibility, animation, or list count.
- Bounds: minimum value, maximum value, max text length, max list rows.
- Fallback: what to show when the value is missing or invalid.

Simple field table:

| Field | Example | Type | Source | Effect |
| --- | --- | --- | --- | --- |
| `money` | `1200` | number | PMMP actionbar | text only |
| `hp_percent` | `0.75` | number 0-1 | PMMP title/actionbar | progress bar fill |
| `quest_state` | `complete` | enum | PMMP form body | color and visible reward button |
| `items` | `Sword,Apple,...` | list | form buttons or Script API | repeated cards |

### D. Layout model

Collect:

- Base resolution assumption, usually 1920x1080.
- Main container position.
- Main container size.
- Number of rows/columns.
- Repeated card or button count.
- Required spacing.
- Required symmetry.
- Safe margins.
- Scroll behavior.
- Which elements must not overlap.
- Which elements are fixed size.
- Which elements may grow with content.
- Which elements must clip instead of grow.
- Which dynamic elements have min/max size.

Convert this to IR first when possible.

Important split:

- Static outer skeleton -> IR/tools.
- Dynamic inner content -> hand-finished JSON UI using Bedrock sizing/bindings.
- If a dynamic panel must grow, tools should define its maximum safe parent area and the raw JSON should use content-relative sizing inside that area.

### E. Visual style

Collect:

- Vanilla frame or custom frame.
- Background texture.
- Button style.
- Button state textures: default, hover, pressed, locked, selected.
- Scrollbar style: vanilla, custom track/thumb, hidden, always visible.
- Icon style.
- Font size.
- Text color.
- Progress bar style.
- Whether to use vanilla `textures/ui/*`.
- Whether custom textures are allowed.

When using vanilla assets, verify paths through the vanilla asset workflow. Do not invent paths.

Reference presentation rule:

- Show 2-3 short reference options when style is unclear.
- Explain each option in user-facing terms.
- Then ask the user to choose one, provide their own image/file, or let AI choose.
- Do not expose restricted or original server/project names in the answer.

### F. Interaction

Collect:

- Button count and each button action.
- Toggle/slider/dropdown needs.
- Whether server form buttons must route to PMMP commands.
- Whether HUD needs interactable controls.
- Input modes to support.
- Close/back behavior.

### G. Implementation output

Decide the output shape:

- IR workspace only.
- Compiled JSON UI only.
- Patch existing RP.
- Standalone RP example.
- PMMP payload format plus JSON UI parser.
- Documentation/example prompt for future AI use.

## Stage-by-stage conversation template

Use this when interacting with the user directly.

### Stage 1 - Goal

Ask:

```text
First, what are we making?
1. HUD/status overlay
2. Server form/menu
3. Chest/inventory-like UI
4. Full screen menu
5. Fix/redesign an existing UI

Also tell me the purpose in one sentence, for example "show player money and level" or "make a quest menu".
```

### Stage 2 - Display and data

Ask:

```text
When should it appear, and what values should it show?

For each value, a rough example is enough:
- money: 1200
- level: 15
- quest: collect wheat 3/10
- hp: 75%
```

### Stage 3 - Dynamic behavior

Ask:

```text
Should anything change depending on the value?
1. No, fixed layout is fine.
2. A progress bar should fill/empty.
3. Text/panel should grow with content.
4. Parts should show/hide.
5. Color should change by state.
6. List/button count can change.
7. Animation is needed.
```

### Stage 4 - Design reference

Ask:

```text
Choose a visual direction, or send a screenshot/file:
1. Vanilla-safe
2. RPG quest/shop/stat
3. NPC dialogue
4. Compact HUD
5. Inventory-like grid
6. Modern card/list
7. Let AI choose based on the feature
```

Then show relevant reference docs:

- `docs/39-design-recommendation-catalog.md`
- `docs/40-server-form-example-index.md`
- `docs/44-design-to-ir-mapping.md`
- `docs/17-community-patterns-string-score-hud.md`
- `docs/33-animation-patterns-and-dumper-values.md`
- `docs/35-scroll-and-carousel-patterns.md`

### Stage 5 - Control textures

Ask:

```text
Do you want custom textures for controls?
1. Use vanilla textures only
2. Reuse textures already in the RP
3. Add custom textures later
4. Simple panels/buttons without special textures
5. Mix vanilla frame + custom icons

For buttons/scrollbars:
- button states: default/hover/pressed/locked needed?
- scrollbar: visible, hidden, vanilla, or custom?
- progress bar: vanilla XP style, custom bar, or simple clipped image?
```

### Stage 6 - Layout rules

Ask:

```text
What layout rules matter?
1. Centered panel
2. Same button/card size
3. Equal gaps
4. Left/right symmetry
5. Scroll list
6. Fixed safe area with clipped content
7. Mobile-friendly compact layout
8. PC/wide layout
```

### Stage 7 - Output

Ask:

```text
Where should I apply it?
1. Make an IR workspace first
2. Patch the current RP directly
3. Make a standalone sample RP
4. Give reusable JSON fragments
```

Once these are known, stop asking broad questions and start implementing with reasonable assumptions.

## Beginner-friendly prompt template

The user can fill this in:

```text
I want to make a [HUD / server form / chest UI / full screen menu / existing UI fix].

Purpose:
-

Information to show:
-

When it appears:
- always / when title-actionbar is sent / when form opens / on a specific screen

Visual style:
- vanilla / RPG / modern / cute farm-life / compact / reference image based

Layout:
- center / top-left / right side / bottom / grid / list / scroll
- same size needed: yes/no
- equal spacing needed: yes/no
- left-right symmetry needed: yes/no
- dynamic size needed: fixed / content-sized / progress bar / changing list
- long text behavior: clip / scroll / grow panel / unknown

Data source:
- PMMP / Script API / scoreboard / static UI / unknown

Output target:
- new sample RP / patch current RP / make IR first
```

## AI response pattern after intake

After enough answers are collected, the AI should output:

1. Confirmed target files.
2. Data protocol or binding plan.
3. Layout constraints that will become IR.
4. Dynamic behavior plan: fixed, content-sized, progress fill, visibility, color, list, or animation.
5. Design family and texture policy.
6. Implementation steps.
7. Validation steps.

Example:

```text
Plan:
- Target: RP/ui/hud_screen.json with namespace `hud`.
- Data: PMMP actionbar payload `money|level|quest`.
- Layout: bottom-right compact panel, 3 rows, same width labels, equal vertical gap.
- Dynamic: EXP bar uses fixed background + clipped foreground; quest text clips to a safe area.
- Geometry: create `workspace/hud_status/ir.yaml`, then run `node tools/run.mjs`.
- Hand finish: add actionbar string split bindings after compile.
- Verify: `npm test`, `node tools/doctor.mjs --quick`, then in-game HUD check.
```

## What not to ask first

Avoid starting with technical-only questions such as:

- "What namespace do you want?"
- "What is the exact JSON UI binding?"
- "What is the exact `anchor_from`?"
- "What is the exact texture path?"

Ask user-intent questions first, then translate answers into technical JSON UI terms.

## When to stop asking and start building

Start building once these are known:

- UI type.
- Target screen or likely target screen.
- Main displayed data.
- General visual style.
- Main layout constraints.
- Whether data is static or server-driven.
- Whether dynamic size/value behavior exists.

Unspecified details should use conservative defaults and be listed as assumptions.
