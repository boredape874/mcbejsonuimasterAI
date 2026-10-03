# Common Failure Modes

Use this as the first debugging map before deep source chasing.

## Screen does not change

Likely causes:

- file is not listed in `ui/_ui_defs.json`
- wrong namespace
- wrong screen filename
- pack is not active or has lower priority
- another pack overrides the same screen

Check:

- `_ui_defs.json`
- manifest and pack stack
- exact screen file name from vanilla or Mojang samples

## Control is invisible

Likely causes:

- `#visible` binding resolves false
- parent is invisible
- parent size is zero
- wrong collection index
- inserted into a parent that is not active in this device mode
- alpha is zero or color alpha is zero

Check:

- parent chain
- `bindings`
- `size`
- `ignored`
- touch/pocket/classic branches

## Texture is missing or wrong

Likely causes:

- invented `textures/ui/*` path
- missing `.png`
- path exists only in a different pack
- item/block atlas mismatch
- pack priority hides texture

Check with:

- `ZtechNetwork/MCBVanillaResourcePack`
- local `textures/`
- `textures/item_texture.json`
- `textures/terrain_texture.json`

## Button does not click

Likely causes:

- no `button_mappings`
- wrong `pressed_button_name`
- parent screen does not accept input
- overlay absorbs input
- HUD screen is not in an interactable mode

Check:

- `button_mappings`
- `always_accepts_input`
- `always_listen_to_input`
- `absorbs_input`
- input mode and screen focus

## Server form customization does not apply

Likely causes:

- `server_form.json` not loaded
- title-prefix routing does not match
- form type differs from expected
- factory points to the wrong control
- the BP or server sender sends a different title/body/button layout

Check:

- raw server form title/body/buttons
- `server_form.json` factory controls
- `#form_title`, `#form_text`, button collection bindings
  - confirmed from official bedrock-samples v1.26.50.4: vanilla `server_form.json` binds the title through `$text_name: "#title_text"`, the body through `#form_text`, and buttons through the `form_buttons` collection (`#form_button_text`, `#form_button_texture`, `#form_button_contents`); `#form_title` is not a vanilla binding name, so verify any project binding with `node tools/vanilla-name-check.mjs <name>` before relying on it

## `[UI][error] Type not specified (or @-base not found)` inside a modification

Observed error path example:

```
/.../long_form/ssc_router/ssc_screen | Type not specified (or @-base not found) for control: ssc_screen
```

This is a historical local failure, not proof that cross-namespace inheritance is forbidden inside modifications. The abbreviated log does not establish the client version, complete pack stack or engine parsing order. Adding a `type` may hide the missing base's required behavior; resolve the base first.

Trace these before changing the screen:

1. Confirm `_ui_defs.json` registration, namespace and base declaration in the active pack stack.
2. Check whether the patch uses the same resource path as the target definition.
3. Identify which declaration owns the target `controls` array. In the pinned Mojang `server_form.json`, `long_form` inherits `common_dialogs.main_panel_no_buttons` and has no own `controls`; insertion into an inherited array is a distinct case.
4. Reduce the failing insertion to one control, capture the exact client version and fresh Content Log, then restore dependencies one at a time.

Source evidence reviewed on 2026-09-27 contradicts a blanket syntax ban:

- `references/source-packs/modern-cloud-ui-reference/ui/hud_screen.json` lines 9–20 nests three `@scoreboard.*` controls inside a modification value.
- The pinned `bedrock-core-ui` source (`6977e257cb874087b22cfc506ae9db3440d17bda`) uses `gamepad_cursor@core_ui_common.gamepad_cursor_button` directly in `packages/resource-pack/packs/RP/ui/server_form.json` lines 73–91. Its `core-ui/hosts/form/mount.json` lines 13–18 describes same-path and inherited-array constraints as the author's observations.
- `references/source-packs/rpg-server-ui-reference/ui/server_form.json` uses a modification to insert its factory. It does not establish that whole-screen replacement is required.

These are static examples, not current Bedrock runtime proof. See [pinned source analysis](73-bedrock-source-review.md) for acquisition, revision and reuse boundaries. The local v2 renderer explicitly blocks unsupported cross-file or inherited-array cases; that tool limitation is also not an engine-wide prohibition.

If the target client reproduces the failure and a content replacement is needed, preserve the vanilla outer shell, long-form and custom-form routes, close/back behavior and unselected title fallback. Adapt a verified inner-content pattern and test both custom and ordinary forms. Do not replace the screen solely because an inherited control uses a different namespace.

## HUD value stops updating

Likely causes:

- server stopped sending changed values
- binding condition is only `visible`
- preserved text logic holds stale value
- string split state never resets
- actionbar/title source changed

Check:

- raw actionbar/title text
- `binding_condition`
- property bag counters
- delimiter and fixed-width slicing logic

## Mobile layout breaks

Likely causes:

- desktop-only offsets
- classic inventory file edited but pocket file ignored
- touch controls overlap the panel
- fixed size too large for narrow aspect ratios

Check:

- `inventory_screen_pocket.json`
- touch-specific controls
- anchors
- max/min sizes
- safe area and scaling

