# UI Folder Architecture

Use this when reorganizing, creating, or reviewing Minecraft Bedrock resource-pack JSON UI folders.

## Design Rules

- Treat vanilla screen files as entry points, not feature containers.
- Put route logic in route files.
- Put actual UI bodies in feature folders.
- Put only genuinely reused controls in `common`.
- Mirror UI ownership in `textures/ui`.
- Keep raw reference identity out of public output. Use internal family names and target file roles.

## Architecture Goal

Keep entry files thin, feature files focused, shared templates reusable, and texture folders aligned with UI components.

Bad smell:

- `server_form.json` contains routing, all screens, all button templates, all animations, and all form bodies.
- `hud_screen.json` contains every HUD feature directly.
- texture names are generic, duplicated, or unrelated to the UI module that uses them.

Good smell:

- entry files only modify or route vanilla screens
- feature modules own one screen or one UI family
- shared templates live in `ui/common`
- texture paths mirror component families
- title/actionbar protocols are documented and isolated

## Planned Architecture Blueprint

This is the default plan for serious MCBE JSON UI packs. Start from it before inventing a new structure.

```text
ui/
  _ui_defs.json
  _global_variables.json

  server_form.json
  hud_screen.json
  chat_screen.json

  routes/
    server_form/
      index.json
      title_routes.json
      type_routes.json
      fallback.json
    hud/
      index.json
      title_routes.json
      actionbar_routes.json
      scoreboard_routes.json
    chat/
      index.json
      command_routes.json
      message_routes.json

  forms/
    <feature>/
      index.json
      layout.json
      state.json
      buttons.json
      animations.json
      protocol.json

  hud/
    <feature>/
      index.json
      layout.json
      state.json
      protocol.json

  chat/
    <feature>/
      index.json
      layout.json
      state.json

  common/
    controls/
    visuals/
    motion/
    data/
    text/

  vanilla_patch/
  dev/
```

The important part is not the exact file count. The important part is the ownership rule:

- `routes/**` decides when a feature appears.
- `forms/**`, `hud/**`, and `chat/**` define what appears.
- `common/**` defines reusable controls only.
- `textures/ui/**` mirrors the feature or common owner.

## Scale Profiles

Use the smallest profile that will not collapse under the requested UI.

### Prototype

Use for one-off tests and visual experiments.

```text
ui/server_form.json
ui/forms/<feature>/index.json
ui/forms/<feature>/layout.json
textures/ui/forms/<feature>/
```

Rules:

- Keep `server_form.json` as router plus temporary feature hook only.
- Move animations/buttons into the feature folder once the UI has more than one state.

### Feature Pack

Use for one production feature such as an enchant selector, shop, or skill menu.

```text
ui/server_form.json
ui/routes/server_form/index.json
ui/routes/server_form/title_routes.json
ui/forms/<feature>/index.json
ui/forms/<feature>/layout.json
ui/forms/<feature>/state.json
ui/forms/<feature>/buttons.json
ui/forms/<feature>/animations.json
ui/forms/<feature>/protocol.json
ui/common/controls/buttons.json
textures/ui/forms/<feature>/
```

Rules:

- Do not put the feature state machine in `server_form.json`.
- If a feature owns the arrows, cards, slots, or node layout, keep those controls inside that feature.
- Promote only stable repeated controls to `common`.

### Full Server UI Suite

Use for packs with multiple forms, HUD widgets, chat panels, and vanilla patches.

```text
ui/routes/
ui/forms/
ui/hud/
ui/chat/
ui/common/
ui/vanilla_patch/
ui/dev/
textures/ui/common/
textures/ui/forms/
textures/ui/hud/
textures/ui/chat/
```

Rules:

- Every feature gets an `index.json`.
- Every data-driven feature gets `protocol.json`.
- Every stateful feature gets `state.json`.
- Every animated feature gets `animations.json`.
- Entry files contain only vanilla modifications and route mounts.

## Recommended RP Layout

```text
RP/
  manifest.json
  ui/
    _ui_defs.json
    _global_variables.json

    server_form.json              # vanilla entry patch/router install only
    hud_screen.json                # vanilla HUD insertion points only
    chat_screen.json               # vanilla chat insertion points only

    routes/
      server_form/
        index.json                 # imports/hosts server-form route groups
        title_routes.json          # #title_text route checks
        type_routes.json           # long/custom/modal/chest/furnace families
        fallback.json              # default vanilla form visibility
      hud/
        title_routes.json
        actionbar_routes.json
        scoreboard_routes.json
      chat/
        command_routes.json
        message_routes.json

    forms/
      enchant_select/
        index.json                 # exported namespace and top feature control
        layout.json                # main screen composition
        cards.json                 # card controls
        buttons.json               # feature-owned buttons
        animations.json            # feature-owned motion
        state.json                 # toggles/cyclers/selection state
        protocol.json              # title/body/button payload assumptions
      skill_menu/
        index.json
        layout.json
        nodes.json
        detail_panel.json
        buttons.json
        animations.json
      inventory_menu/
        index.json
        layout.json
        slots.json
        detail_panel.json
      shop_menu/
        index.json
        layout.json
        item_grid.json
        detail_panel.json
        category_rail.json
      quest_menu/
        index.json
        layout.json
        list.json
        detail_panel.json

    hud/
      status_cluster/
        index.json
        bars.json
        labels.json
        icons.json
        protocol.json
      hotbar/
        index.json
        slots.json
        selected_slot.json
        offhand.json
      notifications/
        index.json
        toast.json
        topbar.json
      overlays/
        actionbar_overlay.json
        title_overlay.json
        minimap.json

    chat/
      command_palette/
        index.json
        layout.json
        rows.json
      quick_actions/
        index.json
        buttons.json

    common/
      controls/
        buttons.json
        toggles.json
        sliders.json
        tabs.json
      visuals/
        panels.json
        cards.json
        bars.json
        icons.json
        focus.json
      motion/
        animations.json
        carousel.json
        hover.json
        transitions.json
      data/
        collections.json
        factories.json
        bindings.json
      text/
        labels.json
        numbers.json
        localization.json

    vanilla_patch/
      inventory_screen.json
      chest_screen.json
      hud_screen_patch.json

    dev/
      debug_screen.json
      ui_test.json
      route_probe.json
      binding_probe.json

  textures/
    ui/
      common/
        buttons/
        panels/
        bars/
        icons/
        cards/
        focus/
        motion/
      forms/
        enchant_select/
          cards/
          buttons/
          frames/
        skill_menu/
          nodes/
          frames/
          buttons/
        inventory_menu/
          slots/
          frames/
        shop_menu/
          items/
          category/
      hud/
        status_cluster/
          bars/
          icons/
        hotbar/
          slots/
        notifications/
      chat/
        command_palette/
        quick_actions/
```

Use this as the default for serious packs. For a tiny prototype, collapse within one feature folder, not into `server_form.json`.

## Index File Pattern

Every feature `index.json` should be the public surface for that feature. Other files in the folder are implementation details.

Recommended shape:

```json
{
  "namespace": "enchant_select",
  "screen@enchant_select.layout": {},
  "route@enchant_select.route": {},
  "main_content@enchant_select.layout": {}
}
```

In practice Bedrock JSON UI files may need the actual controls defined in the same namespace or registered separately through `_ui_defs.json`. Keep the concept: external files reference the feature through a small number of stable names.

Avoid:

```text
server_form.json -> enchant_select.cards.center_card
server_form.json -> enchant_select.animations.center_grow
server_form.json -> enchant_select.buttons.arrow_face
```

Prefer:

```text
server_form.json -> routes.server_form.index
routes.server_form.index -> enchant_select.screen
enchant_select.screen -> internal cards/buttons/animations
```

## Router File Pattern

Routers should be boring and predictable.

```text
routes/server_form/index.json
  - mounts title routes
  - mounts type routes
  - mounts fallback/default form

routes/server_form/title_routes.json
  - maps title prefixes or exact title IDs to feature screens

routes/server_form/fallback.json
  - keeps vanilla/default server form visible when no custom route matches
```

Router files should not contain:

- card layout
- HUD widgets
- button textures
- animation definitions
- feature-specific factories except tiny route factories

## Common Folder Decision Rule

Do not move something into `common` just because it feels reusable.

Move to `common` only when:

- at least two real features use it, or
- it wraps a vanilla control safely, or
- it is a low-level motion/data primitive such as hover pulse, common button state, collection factory, or label preset.

Keep inside the feature when:

- the texture path is feature-owned
- the size or offsets are feature-specific
- the control name carries feature meaning
- only one screen uses it

Recommended common buckets:

```text
common/controls/buttons.json
common/controls/toggles.json
common/visuals/cards.json
common/visuals/bars.json
common/motion/hover.json
common/motion/carousel.json
common/data/factories.json
common/data/collections.json
common/text/labels.json
```

## File Roles

| File or Folder | Role |
| --- | --- |
| `ui/_ui_defs.json` | registers JSON UI modules only |
| `ui/_global_variables.json` | global constants and shared toggles only |
| `ui/server_form.json` | server form entry point and router only |
| `ui/hud_screen.json` | vanilla HUD modifications and insertion points only |
| `ui/chat_screen.json` | vanilla chat modifications and insertion points only |
| `ui/routes/**` | title/actionbar/scoreboard routing conditions |
| `ui/forms/<feature>/**` | actual custom server form bodies |
| `ui/hud/<feature>/**` | actual HUD widgets |
| `ui/chat/<feature>/**` | actual chat-side UI widgets |
| `ui/common/<category>/**` | reusable templates, visual states, shared animations |
| `ui/vanilla_patch/**` | isolated vanilla screen patches beyond entry files |
| `textures/ui/common/*` | shared visual assets |
| `textures/ui/forms/<feature>/*` | feature-owned form assets |
| `textures/ui/hud/<feature>/*` | feature-owned HUD assets |

## Feature Folder Contract

Every non-trivial feature folder should have a stable contract:

```text
<feature>/
  index.json       # exported controls and namespace entry
  layout.json      # composition and anchors
  state.json       # toggles, cyclers, selection wheel, property bag
  buttons.json     # feature-specific input controls
  animations.json  # feature-specific motion only
  protocol.json    # title/body/actionbar/scoreboard payload expectations
```

Only create extra files when the feature needs them:

- `cards.json` for card/carousel UI.
- `slots.json` for inventory/hotbar/container UI.
- `detail_panel.json` for split view UI.
- `category_rail.json` for shop/settings navigation.
- `nodes.json` for skill tree or graph-like UI.

## Import And Registration Policy

`_ui_defs.json` should register entry files and feature indexes, not every tiny helper file.

Recommended:

```json
{
  "ui_defs": [
    "ui/server_form.json",
    "ui/hud_screen.json",
    "ui/forms/enchant_select/index.json",
    "ui/common/controls/buttons.json"
  ]
}
```

Avoid registering every split file unless Bedrock cannot resolve the namespace without it. Prefer feature `index.json` files that reference local templates by namespace.

## Naming Rules

- `*_screen`: a top-level or vanilla-replacement screen.
- `*_content`: the main content panel inside a screen.
- `*_route`: a router panel or condition group.
- `*_factory`: a factory or feature selector.
- `*_template`: a reusable component.
- `*_face`: the visual child of a button/toggle state.
- `*_button`, `*_toggle`, `*_card`, `*_bar`: concrete reusable UI controls.
- `*_anim`: animation definitions.
- `*_panel`: structural layout panel.

Prefer feature prefixes:

```text
enchant_select.card
enchant_select.confirm_button
skill_menu.icon_grid
status_cluster.health_bar
common_controls.button_face
```

Avoid generic names:

```text
button1
panel2
image
new_ui
test
abc
```

## Server Form Pattern

`ui/server_form.json` should be a router:

```text
server_form.json
  - installs custom modules into third_party_server_screen
  - reads #title_text
  - shows vanilla/default form when no custom route matches
  - delegates custom bodies to ui/forms/*.json
```

Recommended title protocol:

```text
customUI:<family>:<screen>:<payload>
```

Examples:

```text
customUI:rpg:skill
customUI:rpg:inventory
customUI:shop:main
customUI:enchant:select
```

For small packs, exact title IDs such as `ui.custom.skill` are acceptable. For large packs, prefer a prefix and type route like the modern-cloud reference.

## Server Form Feature Pattern

For a custom server form such as an enchant carousel:

```text
ui/server_form.json
  - installs `routes/server_form/index.json`

ui/routes/server_form/title_routes.json
  - maps `customUI:enchant:select` to `forms/enchant_select/index.json`

ui/forms/enchant_select/index.json
  - exposes `enchant_select.screen`

ui/forms/enchant_select/layout.json
  - title, scene, confirm area

ui/forms/enchant_select/cards.json
  - card face, card label, orbit/card states

ui/forms/enchant_select/buttons.json
  - left/right arrows, confirm button visual shell

ui/forms/enchant_select/animations.json
  - orbit motion, hover motion, press motion

ui/forms/enchant_select/state.json
  - cycler/toggle/factory state bridge
```

This prevents the carousel state machine, card visuals, and route logic from fighting inside one giant `server_form.json`.

## Enchant Carousel Planned Structure

Use this exact split for the current enchant-card carousel style of feature:

```text
ui/forms/enchant_select/
  index.json
  layout.json
  orbit_cards.json
  arrow_buttons.json
  state_bridge.json
  orbit_animations.json
  protocol.json

textures/ui/forms/enchant_select/
  cards/
    chains.png
    echo.png
    committed.png
  arrows/
    left.png
    right.png
  buttons/
    confirm_default.png
    confirm_hover.png
```

Ownership:

- `layout.json`: scene size, title placement, card layer placement, confirm area.
- `orbit_cards.json`: card face, label, shadow, center/left/right card templates.
- `arrow_buttons.json`: non-submitting arrow controls and hover/pressed visuals.
- `state_bridge.json`: cycler/toggle/factory bridge, route state, repeatable event bridge.
- `orbit_animations.json`: center-from-left/right, side shrink/grow, hover pulse.
- `protocol.json`: title/body/button text assumptions from PMMP/Script API form creation.

For repeated card animation, state and motion must be separate:

- state event changes selected card
- motion event plays orbit animation
- one user arrow press may map to both through a bridge
- animated wrappers must survive state swaps when replay is required

## HUD Pattern

`ui/hud_screen.json` should only insert widgets:

```text
hud_screen.json
  - modifications into vanilla HUD controls
  - safe-zone anchoring
  - references to ui/hud/status_cluster.json
  - references to ui/hud/custom_hotbar.json
```

Actual widget layout belongs in `ui/hud/*.json`.

## Common Template Pattern

Split shared components by purpose:

- `common/controls/buttons.json`: default/hover/pressed/locked button state controls.
- `common/controls/toggles.json`: custom toggles and radio groups.
- `common/visuals/cards.json`: framed cards, item cards, skill cards.
- `common/visuals/bars.json`: progress bars, segmented bars, icon bars.
- `common/motion/animations.json`: reusable `anim_type` definitions.
- `common/text/labels.json`: label presets and text wrappers.
- `common/data/factories.json`: reusable factory and collection-panel patterns.

Do not let `common` become a dump folder. If a component is used by only one feature, keep it inside that feature file.

## Texture Layout Rules

Texture folders should answer "who owns this asset?"

Use:

```text
textures/ui/forms/enchant_select/card_chains.png
textures/ui/forms/enchant_select/arrow_left.png
textures/ui/hud/status/health_fill.png
textures/ui/common/buttons/primary_default.png
```

Avoid:

```text
textures/ui/new/button1.png
textures/ui/test/a.png
textures/ui/skill_thing_final2.png
```

If the same texture is used by multiple features, move it to `textures/ui/common`.

## Refactor Procedure

1. Read `_ui_defs.json` and list currently registered UI files.
2. Classify every large UI file into entry, route, feature, common template, or texture metadata.
3. Create the target folders before moving logic.
4. Create or choose the scale profile: prototype, feature pack, or full server UI suite.
5. Move one feature at a time.
6. Keep namespaces stable during the first move when possible.
7. Update `_ui_defs.json`.
8. Update `@namespace.control` references.
9. Validate JSON syntax.
10. Test the exact route trigger: `#title_text`, actionbar, title, scoreboard, collection, or toggle state.
11. Only then rename controls or textures for readability.

## Minimum Standard For New Work

For any non-trivial custom form UI, create at least:

```text
ui/server_form.json
ui/routes/server_form/index.json
ui/forms/<feature>/index.json
ui/forms/<feature>/layout.json
ui/common/controls/buttons.json
textures/ui/forms/<feature>/
```

For any non-trivial HUD, create at least:

```text
ui/hud_screen.json
ui/hud/<feature>/index.json
ui/hud/<feature>/layout.json
textures/ui/hud/<feature>/
```

For mixed form and HUD packs, never put the form feature and HUD feature into the same JSON file unless the file is a small router.

## When To Bend The Rules

- Tiny demos can keep one feature in `server_form.json`.
- Porting a public reference can keep its original file names temporarily.
- Vanilla overrides should retain vanilla file names when the file is replacing or modifying a vanilla screen.
- Generated UI can live in `ui/generated/`, but handcrafted patches should not be edited there directly.

When bending a rule, leave a clear boundary so the file can be split later.
