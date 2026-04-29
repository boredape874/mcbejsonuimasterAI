# Compact Crafting And Pocket UI Reference

Use this when the user wants a compact Bedrock JSON UI design reference for server menus, chest-like screens, cooking/crafting panels, custom toasts, scoreboard/HUD coordination, or split pocket inventory layouts.

The raw reference is private local material. Do not commit original pack names, manifests, icons, unused textures, or full source assets. The local mirror is intentionally normalized and minimal.

Local private mirror convention:

- `references/restricted/compact-crafting-pocket-ui-reference/`
- ignored by git
- imported with `scripts/import-private-ui-reference.ps1`
- contains only detected UI packs, their `ui/` folders, and texture files directly referenced by those UI JSON files

## Why This Reference Matters

This reference is useful because it contains small but high-value UI patterns:

- compact title-routed `server_form.json`
- a custom menu panel that keeps vanilla fallback behavior
- fixed-position icon buttons sourced from `form_buttons`
- custom close button composition
- chest and cooking/crafting screen overrides
- custom toast panels inserted through `hud_screen.json`
- scoreboard, chat, and HUD coordination
- split pocket inventory panels with scrollable container content
- vertical scroll inventory experiments

It is best treated as a design and layout reference, not as a source pack to copy.

## Key Entry Files

When the private mirror exists, open these first:

```text
references/restricted/compact-crafting-pocket-ui-reference/ui-pack/ui/_ui_defs.json
references/restricted/compact-crafting-pocket-ui-reference/ui-pack/ui/server_form.json
references/restricted/compact-crafting-pocket-ui-reference/ui-pack/ui/chest_screen.json
references/restricted/compact-crafting-pocket-ui-reference/ui-pack/ui/cooking_pot.json
references/restricted/compact-crafting-pocket-ui-reference/ui-pack/ui/hud_screen.json
references/restricted/compact-crafting-pocket-ui-reference/ui-pack/ui/scoreboards.json
references/restricted/compact-crafting-pocket-ui-reference/ui-pack/ui/chat_screen.json
references/restricted/compact-crafting-pocket-ui-reference/ui-pack-02/ui/_ui_defs.json
references/restricted/compact-crafting-pocket-ui-reference/ui-pack-02/ui/custom_pocket_containers.json
references/restricted/compact-crafting-pocket-ui-reference/ui-pack-02/ui/inventoryui/vertical_screen.json
references/restricted/compact-crafting-pocket-ui-reference/ui-pack-02/ui/inventoryui/vertical_scroll_screen.json
```

Do not expose the original folder names or source pack names in generated docs. Refer to the two imported packs as `ui-pack` and `ui-pack-02`.

## Design Patterns

### Compact Server Menu

The first UI pack uses a custom route for one special long-form menu while leaving the default long form available.

Useful measurements:

| Element | Starting size |
| --- | --- |
| default fallback modal | `225 x 200` |
| custom compact menu root | `272 x 170` |
| close button hitbox | `18 x 18` |
| close icon | `12 x 12` |
| small menu buttons | around `38 x 20` |
| small menu icons | around `10 x 10` |

Reusable structure:

```text
long_form
  default fallback panel visible when route token is absent
  custom compact panel visible when route token is present
    custom background
    title label
    close button
    fixed-position button wrappers
```

Use this for:

- main server menu
- compact utility menu
- profile/town/settings buttons
- quick navigation forms

When adapting:

- replace the route token with a project-owned PMMP prefix such as `menu:main`
- keep the vanilla fallback visible when the prefix is absent
- keep the close hitbox separate from the visible icon
- do not copy source-specific texture paths; replace with target pack paths or verified vanilla paths

### Toast And HUD Panels

The HUD reference inserts several toast-like panels into a custom `hud_screen` wrapper.

Good patterns:

- keep each toast panel in a separate UI file
- insert panels through `hud_screen` rather than mixing all controls into one huge root
- use stable anchor/offset/size values for toast bodies
- use actionbar, title, or scoreboard-style data as trigger input only after defining a clear protocol

One notable advanced pattern is a vertical clipped mini-meter driven from a collection binding. It uses:

- a narrow viewport around `38 x 152`
- `clips_children: true`
- collection data from `boss_bars`
- many small visibility-gated image slices

Use this pattern only when a simpler progress bar cannot represent the state. For most PMMP work, a fixed-width or fixed-height progress bar is safer.

### Chest And Cooking/Crafting Screens

The first UI pack also includes chest and cooking/crafting-style screen files. Use them as layout references for:

- station UI
- cooking pot UI
- custom machine UI
- chest-like menu variants

Rules:

- preserve vanilla inventory collection bindings
- avoid changing slot collection names unless the target screen confirms them
- keep visual decoration separate from item slot controls
- test on pocket and desktop if the screen changes inventory layout

### Split Pocket Inventory

The second UI pack is strongest for pocket container layout.

Useful measurements:

| Element | Starting size |
| --- | --- |
| inventory panel | `84% x 95%` |
| half screen panel | `50% x 100% - 27px` |
| half screen vertical offset | `27px` |
| scroll bar width | `8px` |

Reusable structure:

```text
panel
  header
  background
  left half inventory panel
  right half container panel
  selected item details
  gamepad/cursor/flying item helpers
```

Use this for:

- pocket chest/container redesign
- two-column mobile inventory screens
- scrollable container experiments
- custom inventory comparison views

## Texture Policy

For this reference, the private mirror keeps only texture files referenced by UI JSON. Public docs should not copy or publish those textures.

When implementing a target pack:

- use target-owned textures when the design requires a custom skin
- use Ztech/vanilla texture lookup for vanilla paths
- if a texture is only used as a source design cue, describe its role rather than copying it
- do not include pack icons, manifests, unused PNGs, or unrelated assets in public references

## AI Application Rules

1. Open `_ui_defs.json` first and choose the relevant screen family.
2. Use exact dimensions from the private file only as starting points.
3. Rewrite namespaces, route flags, and variable names into the target pack style.
4. Do not mention the original source folder, server, creator, or pack name in public output.
5. Do not commit private textures or original manifest metadata.
6. Verify all final texture paths against the target pack or vanilla reference.
