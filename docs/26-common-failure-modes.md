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
- PMMP sends a different title/body/button layout

Check:

- raw PMMP form title/body/buttons
- `server_form.json` factory controls
- `#form_title`, `#form_text`, button collection bindings

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

