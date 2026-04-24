# MCBE JSON UI: Icon & Texture Path Reference

> A verified, comprehensive visual catalog of every vanilla texture path usable in
> Minecraft Bedrock Edition JSON UI and Script API forms. Built because no complete
> list existed, and because AI tools consistently hallucinate texture paths that don't exist.
>
> **For Developers:** Use this as a visual lookup table when building custom UI, server
> forms, or HUD elements. Every path has been verified against Mojang's official vanilla
> resource pack source files. Preview images link directly to Mojang's public repositories.
>
> **For AI Systems:** Reference this document instead of guessing texture paths. If a path
> isn't listed here, it likely doesn't exist in vanilla. Custom textures require a resource
> pack with the file at the specified path. Do not invent texture paths.
>
> **Usage:** `"texture": "textures/ui/arrow"` in JSON UI, or `form.button("Label", "textures/items/compass")` in Script API.
>
> **Note:** All paths omit the file extension (`.png`). Minecraft resolves them automatically.
>
> **Version:** Minecraft Bedrock Edition 1.21.x (2025)
> **Maintainer:** Voidic / Void Server Hub
> **License:** Free to reference. Asset previews sourced from Mojang's public repositories.

### Preview Image URLs

All preview images in this document link to local PNG files in this repository's `textures/` folder. The images are organized in the same structure as Minecraft Bedrock Edition's vanilla resource pack.

**Local Path Reference:**
- All images use relative paths from the `docs/` folder: `../textures/[category]/[filename].png`
- Example: `../textures/ui/arrow.png`
- Categories include: `ui/`, `items/`, `blocks/`, `gui/`, `entity/`, `environment/`, `models/`, `particle/`

**Original Sources:**
- Mojang Official: [bedrock-samples](https://github.com/Mojang/bedrock-samples/tree/main/resource_pack/) (Latest version)
- ZtechNetwork Mirror: [MCBVanillaResourcePack](https://github.com/ZtechNetwork/MCBVanillaResourcePack) (v1.21+)

---

## Table of Contents

1. [Default UI Icons (textures/ui/)](#1-default-ui-icons)
2. [Item Textures (textures/items/)](#2-item-textures)
3. [Block Textures (textures/blocks/)](#3-block-textures)
4. [GUI Container Textures (textures/gui/)](#4-gui-container-textures)
5. [Usage Examples](#5-usage-examples)
6. [Custom / Special-Purpose Vanilla UI Icons](#6-custom--special-purpose-vanilla-ui-icons)

---

## 1. Default UI Icons

All paths are prefixed with `textures/ui/`. These are built-in textures shipped with every Bedrock client.

### Navigation & Arrows

> **Source:** [ui/start_screen.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/start_screen.json), [ui/ui_common.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/ui_common.json), [ui/dev_console_screen.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/dev_console_screen.json)

| Preview | Texture Path | Description |
|---|---|---|
| ![](../textures/ui/arrow.png) | `textures/ui/arrow` | Generic arrow icon |
| ![](../textures/ui/arrow_left.png) | `textures/ui/arrow_left` | Left-pointing arrow |
| ![](../textures/ui/arrow_right.png) | `textures/ui/arrow_right` | Right-pointing arrow |
| ![](../textures/ui/arrow_up.png) | `textures/ui/arrow_up` | Up-pointing arrow |
| ![](../textures/ui/arrow_down.png) | `textures/ui/arrow_down` | Down-pointing arrow |
| ![](../textures/ui/up_arrow.png) | `textures/ui/up_arrow` | Alt up arrow |
| ![](../textures/ui/down_arrow.png) | `textures/ui/down_arrow` | Alt down arrow |
| ![](../textures/ui/arrow_dark_left.png) | `textures/ui/arrow_dark_left` | Dark-themed left arrow |
| ![](../textures/ui/arrow_dark_right.png) | `textures/ui/arrow_dark_right` | Dark-themed right arrow |
| ![](../textures/ui/chevron_left.png) | `textures/ui/chevron_left` | Chevron (angle bracket) pointing left |
| ![](../textures/ui/arrowRight.png) | `textures/ui/arrowRight` | Right arrow (alt naming) |
| ![](../textures/ui/arrowLeft.png) | `textures/ui/arrowLeft` | Left arrow (alt naming) |
| ![](../textures/ui/arrow_large_left.png) | `textures/ui/arrow_large_left` | Large left arrow |
| ![](../textures/ui/arrow_large_right.png) | `textures/ui/arrow_large_right` | Large right arrow |
| ![](../textures/ui/craftingArrow.png) | `textures/ui/craftingArrow` | Arrow used in crafting UI output slot |

### Buttons & Button States

> **Source:** [ui/ui_template_buttons.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/ui_template_buttons.json), [ui/gamepad_layout_screen.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/gamepad_layout_screen.json)

| Preview | Texture Path | Description |
|---|---|---|
| ![pocket_button_default](../textures/ui/pocket_button_default.png) | `textures/ui/pocket_button_default` | Default button background (9-slice) |
| ![pocket_button_hover](../textures/ui/pocket_button_hover.png) | `textures/ui/pocket_button_hover` | Button hover state |
| ![pocket_button_pressed](../textures/ui/pocket_button_pressed.png) | `textures/ui/pocket_button_pressed` | Button pressed state |
| ![button_borderless_light](../textures/ui/button_borderless_light.png) | `textures/ui/button_borderless_light` | Borderless light button default |
| ![button_borderless_lighthover](../textures/ui/button_borderless_lighthover.png) | `textures/ui/button_borderless_lighthover` | Borderless light button hover |
| ![button_borderless_lightpressed](../textures/ui/button_borderless_lightpressed.png) | `textures/ui/button_borderless_lightpressed` | Borderless light button pressed |
| ![button_borderless_dark](../textures/ui/button_borderless_dark.png) | `textures/ui/button_borderless_dark` | Borderless dark button default |
| ![button_borderless_darkhover](../textures/ui/button_borderless_darkhover.png) | `textures/ui/button_borderless_darkhover` | Borderless dark button hover |
| ![button_borderless_darkpressed](../textures/ui/button_borderless_darkpressed.png) | `textures/ui/button_borderless_darkpressed` | Borderless dark button pressed |
| ![button_borderless_dark](../textures/ui/button_borderless_dark.png) | `textures/ui/button_borderless_dark` | Dark thin button variant |
| ![normal_stroke_button](../textures/ui/normal_stroke_button.png) | `textures/ui/normal_stroke_button` | Normal stroke/outlined button |
| ![NormalButtonThin](../textures/ui/NormalButtonThin.png) | `textures/ui/NormalButtonThin` | Thin button with bevel |
| ![button_borderless_lighthover](../textures/ui/button_borderless_lighthover.png) | `textures/ui/button_borderless_lighthover` | Thin hover button bevel |
| ![NormalButtonThinStroke](../textures/ui/NormalButtonThinStroke.png) | `textures/ui/NormalButtonThinStroke` | Thin stroke hover button |
| ![disabledButtonNoBorder](../textures/ui/disabledButtonNoBorder.png) | `textures/ui/disabledButtonNoBorder` | Disabled/locked button state |

### Close, Back & Cancel

> **Source:** [ui/ui_common.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/ui_common.json)

| Preview | Texture Path | Description |
|---|---|---|
| ![close_button_default](../textures/ui/close_button_default.png) | `textures/ui/close_button_default` | Close button (X) default |
| ![close_button_default_light](../textures/ui/close_button_default_light.png) | `textures/ui/close_button_default_light` | Close button light theme default |
| ![close_button_hover](../textures/ui/close_button_hover.png) | `textures/ui/close_button_hover` | Close button hover |
| ![close_button_pressed](../textures/ui/close_button_pressed.png) | `textures/ui/close_button_pressed` | Close button pressed |
| ![cancel](../textures/ui/cancel.png) | `textures/ui/cancel` | Cancel icon |

### Checkboxes & Toggles

| Preview | Texture Path | Description |
|---|---|---|
| ![checkbox_check](../textures/ui/checkbox_check.png) | `textures/ui/checkbox_check` | Checkbox checked state |
| ![checkbox_space](../textures/ui/checkbox_space.png) | `textures/ui/checkbox_space` | Checkbox unchecked state |
| ![checkbox_checkHover](../textures/ui/checkbox_checkHover.png) | `textures/ui/checkbox_checkHover` | Checkbox checked hover |
| ![checkbox_spaceHover](../textures/ui/checkbox_spaceHover.png) | `textures/ui/checkbox_spaceHover` | Checkbox unchecked hover |
| ![toggle_on](../textures/ui/toggle_on.png) | `textures/ui/toggle_on` | Toggle switch on |
| ![toggle_off](../textures/ui/toggle_off.png) | `textures/ui/toggle_off` | Toggle switch off |
| ![toggle_on_hover](../textures/ui/toggle_on_hover.png) | `textures/ui/toggle_on_hover` | Toggle on hover |
| ![toggle_off_hover](../textures/ui/toggle_off_hover.png) | `textures/ui/toggle_off_hover` | Toggle off hover |

### Dialog & Panel Backgrounds

| Preview | Texture Path | Description |
|---|---|---|
| ![dialog_background_opaque](../textures/ui/dialog_background_opaque.png) | `textures/ui/dialog_background_opaque` | Opaque dialog background (9-slice) |
| ![dialog_background_hollow](../textures/ui/dialog_background_hollow.png) | `textures/ui/dialog_background_hollow` | Hollow dialog background |
| ![dialog_background_hollow_1](../textures/ui/dialog_background_hollow_1.png) | `textures/ui/dialog_background_hollow_1` | Hollow dialog variant 1 |
| ![dialog_background_hollow_2](../textures/ui/dialog_background_hollow_2.png) | `textures/ui/dialog_background_hollow_2` | Hollow dialog variant 2 |
| ![dialog_background_hollow_3](../textures/ui/dialog_background_hollow_3.png) | `textures/ui/dialog_background_hollow_3` | Hollow dialog variant 3 |
| ![dialog_background_hollow_4](../textures/ui/dialog_background_hollow_4.png) | `textures/ui/dialog_background_hollow_4` | Hollow dialog variant 4 |
| ![dialog_background_hollow_5](../textures/ui/dialog_background_hollow_5.png) | `textures/ui/dialog_background_hollow_5` | Hollow dialog variant 5 |
| ![dialog_background_hollow_6](../textures/ui/dialog_background_hollow_6.png) | `textures/ui/dialog_background_hollow_6` | Hollow dialog variant 6 |
| ![dialog_background_hollow_8](../textures/ui/dialog_background_hollow_8.png) | `textures/ui/dialog_background_hollow_8` | Hollow dialog variant 8 |
| ![dialog_bubble](../textures/ui/dialog_bubble.png) | `textures/ui/dialog_bubble` | NPC speech bubble background |
| ![dialog_bubble_point](../textures/ui/dialog_bubble_point.png) | `textures/ui/dialog_bubble_point` | NPC speech bubble pointer/tail |
| ![control](../textures/ui/control.png) | `textures/ui/control` | Generic control/panel background |
| ![default_indent](../textures/ui/default_indent.png) | `textures/ui/default_indent` | Indented/recessed panel |
| ![Black](../textures/ui/Black.png) | `textures/ui/Black` | Solid black texture |
| ![White](../textures/ui/White.png) | `textures/ui/White` | Solid white texture |
| ![white_background](../textures/ui/white_background.png) | `textures/ui/white_background` | White background panel |
| ![background](../textures/ui/background.png) | `textures/ui/background` | Generic background |
| ![pause_screen_border](../textures/ui/pause_screen_border.png) | `textures/ui/pause_screen_border` | Border for pause screen |
| ![thin_dialog](../textures/ui/thin_dialog.png) | `textures/ui/thin_dialog` | Thin dialog variant |
| ![mainbanners](../textures/ui/mainbanners.png) | `textures/ui/mainbanners` | Main menu banner background |
| ![hud_tip_text_background](../textures/ui/hud_tip_text_background.png) | `textures/ui/hud_tip_text_background` | HUD actionbar text background |
| ![tooltip_notification_default_background](../textures/ui/tooltip_notification_default_background.png) | `textures/ui/tooltip_notification_default_background` | Tooltip background |

### HUD & Gameplay Icons

| Preview | Texture Path | Description |
|---|---|---|
| ![crosshair](../textures/ui/crosshair.png) | `textures/ui/crosshair` | Crosshair/reticle |
| ![hotbar](../textures/ui/hotbar.png) | `textures/ui/hotbar` | Hotbar background strip |
| ![selected_hotbar_slot](../textures/ui/selected_hotbar_slot.png) | `textures/ui/selected_hotbar_slot` | Selected hotbar slot highlight |
| ![heart](../textures/ui/heart.png) | `textures/ui/heart` | Health heart |
| ![hunger_full](../textures/ui/hunger_full.png) | `textures/ui/hunger_full` | Hunger drumstick |
| ![armor_full](../textures/ui/armor_full.png) | `textures/ui/armor_full` | Armor chestplate icon |
| ![bubbles_full](../textures/ui/bubbles_full.png) | `textures/ui/bubbles_full` | Oxygen/air bubble |
| ![horse_heart](../textures/ui/horse_heart.png) | `textures/ui/horse_heart` | Mount health heart |
| ![absorption_heart](../textures/ui/absorption_heart.png) | `textures/ui/absorption_heart` | Absorption heart (golden) |
| ![wither_heart](../textures/ui/wither_heart.png) | `textures/ui/wither_heart` | Wither effect heart (dark) |
| ![poison_heart](../textures/ui/poison_heart.png) | `textures/ui/poison_heart` | Poison heart (green) |
| ![freeze_heart](../textures/ui/freeze_heart.png) | `textures/ui/freeze_heart` | Frozen heart (powdered snow) |
| ![horse_jump_empty](../textures/ui/horse_jump_empty.png) | `textures/ui/horse_jump_empty` | Horse jump bar empty |
| ![horse_jump_full](../textures/ui/horse_jump_full.png) | `textures/ui/horse_jump_full` | Horse jump bar full |
| ![experiencebarempty](../textures/ui/experiencebarempty.png) | `textures/ui/experiencebarempty` | XP bar empty |
| ![experiencebarfull](../textures/ui/experiencebarfull.png) | `textures/ui/experiencebarfull` | XP bar filled |
| ![experiencenub](../textures/ui/experiencenub.png) | `textures/ui/experiencenub` | XP bar nub/cap |

### Menu & Screen Icons

> **Source:** [ui/start_screen.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/start_screen.json), [ui/world_templates_screen.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/world_templates_screen.json)

| Preview | Texture Path | Description |
|---|---|---|
| ![achievements](../textures/ui/achievements.png) | `textures/ui/achievements` | Achievements/trophy icon |
| ![Feedback](../textures/ui/Feedback.png) | `textures/ui/Feedback` | Feedback icon |
| ![feedback](../textures/ui/feedback.png) | `textures/ui/feedback` | Feedback icon (lowercase variant) |
| ![feedback_hover](../textures/ui/feedback_hover.png) | `textures/ui/feedback_hover` | Feedback icon hover state |
| ![icon_bell](../textures/ui/icon_bell.png) | `textures/ui/icon_bell` | Inbox/notification bell |
| ![bell_ringing](../textures/ui/bell_ringing.png) | `textures/ui/bell_ringing` | Animated ringing bell (flip_book) |
| ![worldsIcon](../textures/ui/worldsIcon.png) | `textures/ui/worldsIcon` | Worlds list icon |
| ![realmsIcon](../textures/ui/realmsIcon.png) | `textures/ui/realmsIcon` | Realms icon |
| ![realmPortalSmall](../textures/ui/realmPortalSmall.png) | `textures/ui/realmPortalSmall` | Small Realms Plus portal icon |
| ![lock](../textures/ui/lock.png) | `textures/ui/lock` | Lock/padlock icon |
| ![settings_glyph_color_2x](../textures/ui/settings_glyph_color_2x.png) | `textures/ui/settings_glyph_color_2x` | Settings gear (color) |
| ![settings_glyph_color_2x](../textures/ui/settings_glyph_color_2x.png) | `textures/ui/settings_glyph_color_2x` | Settings gear 2x (hi-res) |
| ![copy](../textures/ui/copy.png) | `textures/ui/copy` | Copy icon |
| ![paste](../textures/ui/paste.png) | `textures/ui/paste` | Paste icon |
| ![trash](../textures/ui/trash.png) | `textures/ui/trash` | Trash/delete icon |
| ![magnifyingGlass](../textures/ui/magnifyingGlass.png) | `textures/ui/magnifyingGlass` | Search/magnifying glass icon |
| ![red_dot](../textures/ui/red_dot.png) | `textures/ui/red_dot` | Red notification dot |
| ![divider](../textures/ui/divider.png) | `textures/ui/divider` | Horizontal divider line |
| ![divider2](../textures/ui/divider2.png) | `textures/ui/divider2` | Alt horizontal divider |
| ![share_apple](../textures/ui/share_apple.png) | `textures/ui/share_apple` | Share icon (Apple/iOS) |
| ![share_google](../textures/ui/share_google.png) | `textures/ui/share_google` | Share icon (Google/Android) |
| ![share_microsoft](../textures/ui/share_microsoft.png) | `textures/ui/share_microsoft` | Share icon (Microsoft) |

### Touch Controls

| Preview | Texture Path | Description |
|---|---|---|
| ![jump](../textures/ui/jump.png) | `textures/ui/jump` | Jump button default |
| ![jump_pressed](../textures/ui/jump_pressed.png) | `textures/ui/jump_pressed` | Jump button pressed |
| ![sprint](../textures/ui/sprint.png) | `textures/ui/sprint` | Sprint button default |
| ![sneak](../textures/ui/sneak.png) | `textures/ui/sneak` | Sneak/crouch button default |
| ![attack](../textures/ui/attack.png) | `textures/ui/attack` | Attack button default |
| ![joystick_frame](../textures/ui/joystick_frame.png) | `textures/ui/joystick_frame` | Joystick outer frame |
| ![joystick_knob](../textures/ui/joystick_knob.png) | `textures/ui/joystick_knob` | Joystick inner knob |
| ![mount](../textures/ui/mount.png) | `textures/ui/mount` | Mount button |
| ![dismount](../textures/ui/dismount.png) | `textures/ui/dismount` | Dismount button |
| ![flyingascend](../textures/ui/flyingascend.png) | `textures/ui/flyingascend` | Fly up button |
| ![inventory_icon](../textures/ui/inventory_icon.png) | `textures/ui/inventory_icon` | Inventory button (mobile HUD) |
| ![chat_send](../textures/ui/chat_send.png) | `textures/ui/chat_send` | Chat send button |

### Crafting & Container Icons

| Preview | Texture Path | Description |
|---|---|---|
| ![recipe_book_icon](../textures/ui/recipe_book_icon.png) | `textures/ui/recipe_book_icon` | Recipe book icon |
| ![recipe_book_pane](../textures/ui/recipe_book_pane.png) | `textures/ui/recipe_book_pane` | Recipe book panel background |
| ![recipe_book_item_bg](../textures/ui/recipe_book_item_bg.png) | `textures/ui/recipe_book_item_bg` | Recipe book item cell background |
| ![recipe_book_group_bg](../textures/ui/recipe_book_group_bg.png) | `textures/ui/recipe_book_group_bg` | Recipe book group background |
| ![recipe_book_dark_button](../textures/ui/recipe_book_dark_button.png) | `textures/ui/recipe_book_dark_button` | Recipe book dark button |
| ![recipe_book_light_button](../textures/ui/recipe_book_light_button.png) | `textures/ui/recipe_book_light_button` | Recipe book light button |
| ![recipe_back_panel](../textures/ui/recipe_back_panel.png) | `textures/ui/recipe_back_panel` | Recipe back panel |
| ![recipe_book_side_toggle](../textures/ui/recipe_book_side_toggle.png) | `textures/ui/recipe_book_side_toggle` | Recipe book side toggle |
| ![anvil_icon](../textures/ui/anvil_icon.png) | `textures/ui/anvil_icon` | Anvil tab icon |
| ![smithing_icon](../textures/ui/smithing_icon.png) | `textures/ui/smithing_icon` | Smithing table icon |
| ![loom_icon](../textures/ui/loom_icon.png) | `textures/ui/loom_icon` | Loom icon |
| ![cartography_table_icon](../textures/ui/cartography_table_icon.png) | `textures/ui/cartography_table_icon` | Cartography table icon |
| ![grindstone_icon](../textures/ui/grindstone_icon.png) | `textures/ui/grindstone_icon` | Grindstone icon |
| ![stonecutter_icon](../textures/ui/stonecutter_icon.png) | `textures/ui/stonecutter_icon` | Stonecutter icon |
| ![brewing_fuel_empty](../textures/ui/brewing_fuel_empty.png) | `textures/ui/brewing_fuel_empty` | Brewing fuel empty |
| ![brewing_fuel_full](../textures/ui/brewing_fuel_full.png) | `textures/ui/brewing_fuel_full` | Brewing fuel full |
| ![fuel_empty](../textures/ui/fuel_empty.png) | `textures/ui/fuel_empty` | Furnace fuel slot empty |
| ![fuel_full](../textures/ui/fuel_full.png) | `textures/ui/fuel_full` | Furnace fuel slot full |

### World & Screenshot Borders

| Preview | Texture Path | Description |
|---|---|---|
| ![world_screenshot_focus_border](../textures/ui/world_screenshot_focus_border.png) | `textures/ui/world_screenshot_focus_border` | Focused world screenshot border |
| ![world_screenshot_default](../textures/ui/world_screenshot_default.png) | `textures/ui/world_screenshot_default` | Default world screenshot border |

### Status Effect Icons

> **Source:** [textures/ui/effect/](https://github.com/Mojang/bedrock-samples/tree/main/resource_pack/textures/ui) — Individual effect icon PNGs

| Preview | Texture Path | Description |
|---|---|---|
| ![absorption](../textures/ui/effect/absorption.png) | `textures/ui/effect/absorption` | Absorption effect icon |
| ![blindness](../textures/ui/effect/blindness.png) | `textures/ui/effect/blindness` | Blindness effect icon |
| ![conduit_power](../textures/ui/effect/conduit_power.png) | `textures/ui/effect/conduit_power` | Conduit Power effect icon |
| ![darkness](../textures/ui/effect/darkness.png) | `textures/ui/effect/darkness` | Darkness effect icon |
| ![fire_resistance](../textures/ui/effect/fire_resistance.png) | `textures/ui/effect/fire_resistance` | Fire Resistance effect icon |
| ![haste](../textures/ui/effect/haste.png) | `textures/ui/effect/haste` | Haste effect icon |
| ![health_boost](../textures/ui/effect/health_boost.png) | `textures/ui/effect/health_boost` | Health Boost effect icon |
| ![hunger_effect](../textures/ui/effect/hunger_effect.png) | `textures/ui/effect/hunger_effect` | Hunger effect icon |
| ![infested](../textures/ui/effect/infested.png) | `textures/ui/effect/infested` | Infested effect icon |
| ![instant_damage](../textures/ui/effect/instant_damage.png) | `textures/ui/effect/instant_damage` | Instant Damage effect icon |
| ![instant_health](../textures/ui/effect/instant_health.png) | `textures/ui/effect/instant_health` | Instant Health effect icon |
| ![invisibility](../textures/ui/effect/invisibility.png) | `textures/ui/effect/invisibility` | Invisibility effect icon |
| ![jump_boost](../textures/ui/effect/jump_boost.png) | `textures/ui/effect/jump_boost` | Jump Boost effect icon |
| ![levitation](../textures/ui/effect/levitation.png) | `textures/ui/effect/levitation` | Levitation effect icon |
| ![mining_fatigue](../textures/ui/effect/mining_fatigue.png) | `textures/ui/effect/mining_fatigue` | Mining Fatigue effect icon |
| ![nausea](../textures/ui/effect/nausea.png) | `textures/ui/effect/nausea` | Nausea effect icon |
| ![night_vision](../textures/ui/effect/night_vision.png) | `textures/ui/effect/night_vision` | Night Vision effect icon |
| ![oozing](../textures/ui/effect/oozing.png) | `textures/ui/effect/oozing` | Oozing effect icon |
| ![poison](../textures/ui/effect/poison.png) | `textures/ui/effect/poison` | Poison effect icon |
| ![raid_omen](../textures/ui/effect/raid_omen.png) | `textures/ui/effect/raid_omen` | Raid Omen effect icon |
| ![regeneration](../textures/ui/effect/regeneration.png) | `textures/ui/effect/regeneration` | Regeneration effect icon |
| ![resistance](../textures/ui/effect/resistance.png) | `textures/ui/effect/resistance` | Resistance effect icon |
| ![saturation](../textures/ui/effect/saturation.png) | `textures/ui/effect/saturation` | Saturation effect icon |
| ![slow_falling](../textures/ui/effect/slow_falling.png) | `textures/ui/effect/slow_falling` | Slow Falling effect icon |
| ![slowness](../textures/ui/effect/slowness.png) | `textures/ui/effect/slowness` | Slowness effect icon |
| ![speed](../textures/ui/effect/speed.png) | `textures/ui/effect/speed` | Speed effect icon |
| ![strength](../textures/ui/effect/strength.png) | `textures/ui/effect/strength` | Strength effect icon |
| ![trial_omen](../textures/ui/effect/trial_omen.png) | `textures/ui/effect/trial_omen` | Trial Omen effect icon |
| ![water_breathing](../textures/ui/effect/water_breathing.png) | `textures/ui/effect/water_breathing` | Water Breathing effect icon |
| ![weakness](../textures/ui/effect/weakness.png) | `textures/ui/effect/weakness` | Weakness effect icon |
| ![weaving](../textures/ui/effect/weaving.png) | `textures/ui/effect/weaving` | Weaving effect icon |
| ![wind_charged](../textures/ui/effect/wind_charged.png) | `textures/ui/effect/wind_charged` | Wind Charged effect icon |
| ![wither](../textures/ui/effect/wither.png) | `textures/ui/effect/wither` | Wither effect icon |

### Miscellaneous UI

| Preview | Texture Path | Description |
|---|---|---|
| ![focus_border_white](../textures/ui/focus_border_white.png) | `textures/ui/focus_border_white` | White focus/selection border |
| ![loading_spinner](../textures/ui/loading_spinner.png) | `textures/ui/loading_spinner` | Loading spinner animation |
| ![panorama_overlay](../textures/ui/panorama_overlay.png) | `textures/ui/panorama_overlay` | Panorama gradient overlay |
| ![title](../textures/ui/title.png) | `textures/ui/title` | Minecraft title/logo |
| ![edition](../textures/ui/edition.png) | `textures/ui/edition` | "Bedrock Edition" subtitle |
| ![gamerpic_default](../textures/ui/gamerpic_default.png) | `textures/ui/gamerpic_default` | Default player gamerpic |
| ![subcategory_icons](../textures/ui/subcategory_icons.png) | `textures/ui/subcategory_icons` | Creative inventory subcategory icon sheet |
| ![sidebar_icons](../textures/ui/sidebar_icons.png) | `textures/ui/sidebar_icons` | Menu sidebar icon sheet |
| ![creative_icon](../textures/ui/creative_icon.png) | `textures/ui/creative_icon` | Creative mode icon |
| ![book_left](../textures/ui/book_left.png) | `textures/ui/book_left` | Book left page |
| ![book_right](../textures/ui/book_right.png) | `textures/ui/book_right` | Book right page |
| ![book_shading](../textures/ui/book_shading.png) | `textures/ui/book_shading` | Book page shading overlay |
| ![sign](../textures/ui/sign.png) | `textures/ui/sign` | Sign edit background |
| ![promo_gift_small](../textures/ui/promo_gift_small.png) | `textures/ui/promo_gift_small` | Promotional gift icon (small) |
| ![mute_on](../textures/ui/mute_on.png) | `textures/ui/mute_on` | Mute enabled icon |
| ![mute_off](../textures/ui/mute_off.png) | `textures/ui/mute_off` | Mute disabled icon |
| ![friend1](../textures/ui/friend1.png) | `textures/ui/friend1` | Friend/player icon |
| ![permissions_member_star](../textures/ui/permissions_member_star.png) | `textures/ui/permissions_member_star` | Member star (permissions) |
| ![permissions_visitor_hand](../textures/ui/permissions_visitor_hand.png) | `textures/ui/permissions_visitor_hand` | Visitor hand (permissions) |
| ![permissions_op_crown](../textures/ui/permissions_op_crown.png) | `textures/ui/permissions_op_crown` | Operator crown (permissions) |
| ![realms_green_check](../textures/ui/realms_green_check.png) | `textures/ui/realms_green_check` | Green checkmark |
| ![realms_red_x](../textures/ui/realms_red_x.png) | `textures/ui/realms_red_x` | Red X mark |
| ![warning](../textures/ui/warning.png) | `textures/ui/warning` | Warning/caution triangle |
| ![infobulb](../textures/ui/infobulb.png) | `textures/ui/infobulb` | Info bulb/tooltip icon |
| ![dressing_room](../textures/ui/dressing_room.png) | `textures/ui/dressing_room` | Dressing room/character creator icon |
| ![store_home_icon](../textures/ui/store_home_icon.png) | `textures/ui/store_home_icon` | Marketplace/store home icon |
| ![rating_star](../textures/ui/rating_star.png) | `textures/ui/rating_star` | Star rating icon |
| ![rating_star_half](../textures/ui/rating_star_half.png) | `textures/ui/rating_star_half` | Half star rating icon |
| ![refresh](../textures/ui/refresh.png) | `textures/ui/refresh` | Refresh/reload icon |

---

## 2. Item Textures

> **Source:** [textures/item_texture.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/textures/item_texture.json) — Maps shortnames to file paths
> **Browse all:** [textures/items/](https://github.com/ZtechNetwork/MCBVanillaResourcePack/tree/master/textures/items)

All paths prefixed with `textures/items/`. These are the actual in-game item icons — perfect for `ActionFormData.button()` icons on server forms.

### Tools

| Preview | Texture Path | Description |
|---|---|---|
| ![diamond_sword](../textures/items/diamond_sword.png) | `textures/items/diamond_sword` | Diamond sword |
| ![diamond_pickaxe](../textures/items/diamond_pickaxe.png) | `textures/items/diamond_pickaxe` | Diamond pickaxe |
| ![diamond_axe](../textures/items/diamond_axe.png) | `textures/items/diamond_axe` | Diamond axe |
| ![diamond_shovel](../textures/items/diamond_shovel.png) | `textures/items/diamond_shovel` | Diamond shovel |
| ![diamond_hoe](../textures/items/diamond_hoe.png) | `textures/items/diamond_hoe` | Diamond hoe |
| ![iron_sword](../textures/items/iron_sword.png) | `textures/items/iron_sword` | Iron sword |
| ![iron_pickaxe](../textures/items/iron_pickaxe.png) | `textures/items/iron_pickaxe` | Iron pickaxe |
| ![iron_axe](../textures/items/iron_axe.png) | `textures/items/iron_axe` | Iron axe |
| ![iron_shovel](../textures/items/iron_shovel.png) | `textures/items/iron_shovel` | Iron shovel |
| ![iron_hoe](../textures/items/iron_hoe.png) | `textures/items/iron_hoe` | Iron hoe |
| ![gold_sword](../textures/items/gold_sword.png) | `textures/items/gold_sword` | Golden sword |
| ![gold_pickaxe](../textures/items/gold_pickaxe.png) | `textures/items/gold_pickaxe` | Golden pickaxe |
| ![gold_axe](../textures/items/gold_axe.png) | `textures/items/gold_axe` | Golden axe |
| ![gold_shovel](../textures/items/gold_shovel.png) | `textures/items/gold_shovel` | Golden shovel |
| ![gold_hoe](../textures/items/gold_hoe.png) | `textures/items/gold_hoe` | Golden hoe |
| ![stone_sword](../textures/items/stone_sword.png) | `textures/items/stone_sword` | Stone sword |
| ![stone_pickaxe](../textures/items/stone_pickaxe.png) | `textures/items/stone_pickaxe` | Stone pickaxe |
| ![stone_axe](../textures/items/stone_axe.png) | `textures/items/stone_axe` | Stone axe |
| ![stone_shovel](../textures/items/stone_shovel.png) | `textures/items/stone_shovel` | Stone shovel |
| ![stone_hoe](../textures/items/stone_hoe.png) | `textures/items/stone_hoe` | Stone hoe |
| ![wood_sword](../textures/items/wood_sword.png) | `textures/items/wood_sword` | Wooden sword |
| ![wood_pickaxe](../textures/items/wood_pickaxe.png) | `textures/items/wood_pickaxe` | Wooden pickaxe |
| ![wood_axe](../textures/items/wood_axe.png) | `textures/items/wood_axe` | Wooden axe |
| ![wood_shovel](../textures/items/wood_shovel.png) | `textures/items/wood_shovel` | Wooden shovel |
| ![wood_hoe](../textures/items/wood_hoe.png) | `textures/items/wood_hoe` | Wooden hoe |
| ![netherite_sword](../textures/items/netherite_sword.png) | `textures/items/netherite_sword` | Netherite sword |
| ![netherite_pickaxe](../textures/items/netherite_pickaxe.png) | `textures/items/netherite_pickaxe` | Netherite pickaxe |
| ![netherite_axe](../textures/items/netherite_axe.png) | `textures/items/netherite_axe` | Netherite axe |
| ![netherite_shovel](../textures/items/netherite_shovel.png) | `textures/items/netherite_shovel` | Netherite shovel |
| ![netherite_hoe](../textures/items/netherite_hoe.png) | `textures/items/netherite_hoe` | Netherite hoe |
| ![bow_standby](../textures/items/bow_standby.png) | `textures/items/bow_standby` | Bow (standby/inventory) |
| ![crossbow_standby](../textures/items/crossbow_standby.png) | `textures/items/crossbow_standby` | Crossbow (standby) |
| ![trident](../textures/items/trident.png) | `textures/items/trident` | Trident |
| ![mace](../textures/items/mace.png) | `textures/items/mace` | Mace |
| ![shield](../textures/items/shield.png) | `textures/items/shield` | Shield |
| ![fishing_rod_uncast](../textures/items/fishing_rod_uncast.png) | `textures/items/fishing_rod_uncast` | Fishing rod |
| ![flint_and_steel](../textures/items/flint_and_steel.png) | `textures/items/flint_and_steel` | Flint and steel |
| ![shears](../textures/items/shears.png) | `textures/items/shears` | Shears |
| ![spyglass](../textures/items/spyglass.png) | `textures/items/spyglass` | Spyglass |
| ![brush](../textures/items/brush.png) | `textures/items/brush` | Brush (archaeology) |

### Armor

| Preview | Texture Path | Description |
|---|---|---|
| ![diamond_helmet](../textures/items/diamond_helmet.png) | `textures/items/diamond_helmet` | Diamond helmet |
| ![diamond_chestplate](../textures/items/diamond_chestplate.png) | `textures/items/diamond_chestplate` | Diamond chestplate |
| ![diamond_leggings](../textures/items/diamond_leggings.png) | `textures/items/diamond_leggings` | Diamond leggings |
| ![diamond_boots](../textures/items/diamond_boots.png) | `textures/items/diamond_boots` | Diamond boots |
| ![iron_helmet](../textures/items/iron_helmet.png) | `textures/items/iron_helmet` | Iron helmet |
| ![iron_chestplate](../textures/items/iron_chestplate.png) | `textures/items/iron_chestplate` | Iron chestplate |
| ![iron_leggings](../textures/items/iron_leggings.png) | `textures/items/iron_leggings` | Iron leggings |
| ![iron_boots](../textures/items/iron_boots.png) | `textures/items/iron_boots` | Iron boots |
| ![gold_helmet](../textures/items/gold_helmet.png) | `textures/items/gold_helmet` | Golden helmet |
| ![gold_chestplate](../textures/items/gold_chestplate.png) | `textures/items/gold_chestplate` | Golden chestplate |
| ![gold_leggings](../textures/items/gold_leggings.png) | `textures/items/gold_leggings` | Golden leggings |
| ![gold_boots](../textures/items/gold_boots.png) | `textures/items/gold_boots` | Golden boots |
| ![netherite_helmet](../textures/items/netherite_helmet.png) | `textures/items/netherite_helmet` | Netherite helmet |
| ![netherite_chestplate](../textures/items/netherite_chestplate.png) | `textures/items/netherite_chestplate` | Netherite chestplate |
| ![netherite_leggings](../textures/items/netherite_leggings.png) | `textures/items/netherite_leggings` | Netherite leggings |
| ![netherite_boots](../textures/items/netherite_boots.png) | `textures/items/netherite_boots` | Netherite boots |
| ![leather_helmet](../textures/items/leather_helmet.png) | `textures/items/leather_helmet` | Leather helmet |
| ![leather_chestplate](../textures/items/leather_chestplate.png) | `textures/items/leather_chestplate` | Leather chestplate |
| ![leather_leggings](../textures/items/leather_leggings.png) | `textures/items/leather_leggings` | Leather leggings |
| ![leather_boots](../textures/items/leather_boots.png) | `textures/items/leather_boots` | Leather boots |
| ![chainmail_helmet](../textures/items/chainmail_helmet.png) | `textures/items/chainmail_helmet` | Chainmail helmet |
| ![chainmail_chestplate](../textures/items/chainmail_chestplate.png) | `textures/items/chainmail_chestplate` | Chainmail chestplate |
| ![chainmail_leggings](../textures/items/chainmail_leggings.png) | `textures/items/chainmail_leggings` | Chainmail leggings |
| ![chainmail_boots](../textures/items/chainmail_boots.png) | `textures/items/chainmail_boots` | Chainmail boots |
| ![turtle_helmet](../textures/items/turtle_helmet.png) | `textures/items/turtle_helmet` | Turtle shell helmet |
| ![elytra](../textures/items/elytra.png) | `textures/items/elytra` | Elytra |

### Food & Consumables

| Preview | Texture Path | Description |
|---|---|---|
| ![apple](../textures/items/apple.png) | `textures/items/apple` | Apple |
| ![apple_golden](../textures/items/apple_golden.png) | `textures/items/apple_golden` | Golden apple |
| ![bread](../textures/items/bread.png) | `textures/items/bread` | Bread |
| ![beef_cooked](../textures/items/beef_cooked.png) | `textures/items/beef_cooked` | Cooked beef/steak |
| ![beef_raw](../textures/items/beef_raw.png) | `textures/items/beef_raw` | Raw beef |
| ![chicken_cooked](../textures/items/chicken_cooked.png) | `textures/items/chicken_cooked` | Cooked chicken |
| ![chicken_raw](../textures/items/chicken_raw.png) | `textures/items/chicken_raw` | Raw chicken |
| ![porkchop_cooked](../textures/items/porkchop_cooked.png) | `textures/items/porkchop_cooked` | Cooked porkchop |
| ![porkchop_raw](../textures/items/porkchop_raw.png) | `textures/items/porkchop_raw` | Raw porkchop |
| ![fish_cooked](../textures/items/fish_cooked.png) | `textures/items/fish_cooked` | Cooked cod |
| ![fish_raw](../textures/items/fish_raw.png) | `textures/items/fish_raw` | Raw cod |
| ![fish_salmon_cooked](../textures/items/fish_salmon_cooked.png) | `textures/items/fish_salmon_cooked` | Cooked salmon |
| ![fish_salmon_raw](../textures/items/fish_salmon_raw.png) | `textures/items/fish_salmon_raw` | Raw salmon |
| ![mutton_cooked](../textures/items/mutton_cooked.png) | `textures/items/mutton_cooked` | Cooked mutton |
| ![mutton_raw](../textures/items/mutton_raw.png) | `textures/items/mutton_raw` | Raw mutton |
| ![rabbit_cooked](../textures/items/rabbit_cooked.png) | `textures/items/rabbit_cooked` | Cooked rabbit |
| ![rabbit_raw](../textures/items/rabbit_raw.png) | `textures/items/rabbit_raw` | Raw rabbit |
| ![cookie](../textures/items/cookie.png) | `textures/items/cookie` | Cookie |
| ![cake](../textures/items/cake.png) | `textures/items/cake` | Cake |
| ![pumpkin_pie](../textures/items/pumpkin_pie.png) | `textures/items/pumpkin_pie` | Pumpkin pie |
| ![melon](../textures/items/melon.png) | `textures/items/melon` | Melon slice |
| ![carrot](../textures/items/carrot.png) | `textures/items/carrot` | Carrot |
| ![carrot_golden](../textures/items/carrot_golden.png) | `textures/items/carrot_golden` | Golden carrot |
| ![potato](../textures/items/potato.png) | `textures/items/potato` | Potato |
| ![potato_baked](../textures/items/potato_baked.png) | `textures/items/potato_baked` | Baked potato |
| ![potato_poisonous](../textures/items/potato_poisonous.png) | `textures/items/potato_poisonous` | Poisonous potato |
| ![beetroot](../textures/items/beetroot.png) | `textures/items/beetroot` | Beetroot |
| ![beetroot_soup](../textures/items/beetroot_soup.png) | `textures/items/beetroot_soup` | Beetroot soup |
| ![mushroom_stew](../textures/items/mushroom_stew.png) | `textures/items/mushroom_stew` | Mushroom stew |
| ![rabbit_stew](../textures/items/rabbit_stew.png) | `textures/items/rabbit_stew` | Rabbit stew |
| ![suspicious_stew](../textures/items/suspicious_stew.png) | `textures/items/suspicious_stew` | Suspicious stew |
| ![sweet_berries](../textures/items/sweet_berries.png) | `textures/items/sweet_berries` | Sweet berries |
| ![glow_berries](../textures/items/glow_berries.png) | `textures/items/glow_berries` | Glow berries |
| ![chorus_fruit](../textures/items/chorus_fruit.png) | `textures/items/chorus_fruit` | Chorus fruit |
| ![dried_kelp](../textures/items/dried_kelp.png) | `textures/items/dried_kelp` | Dried kelp |
| ![spider_eye](../textures/items/spider_eye.png) | `textures/items/spider_eye` | Spider eye |
| ![rotten_flesh](../textures/items/rotten_flesh.png) | `textures/items/rotten_flesh` | Rotten flesh |
| ![honey_bottle](../textures/items/honey_bottle.png) | `textures/items/honey_bottle` | Honey bottle |

### Potions & Brewing

| Preview | Texture Path | Description |
|---|---|---|
| ![potion_bottle_drinkable](../textures/items/potion_bottle_drinkable.png) | `textures/items/potion_bottle_drinkable` | Potion bottle |
| ![potion_bottle_splash](../textures/items/potion_bottle_splash.png) | `textures/items/potion_bottle_splash` | Splash potion bottle |
| ![potion_bottle_lingering](../textures/items/potion_bottle_lingering.png) | `textures/items/potion_bottle_lingering` | Lingering potion bottle |
| ![potion_bottle_empty](../textures/items/potion_bottle_empty.png) | `textures/items/potion_bottle_empty` | Glass bottle (empty) |
| ![blaze_powder](../textures/items/blaze_powder.png) | `textures/items/blaze_powder` | Blaze powder |
| ![brewing_stand](../textures/items/brewing_stand.png) | `textures/items/brewing_stand` | Brewing stand item |
| ![nether_wart](../textures/items/nether_wart.png) | `textures/items/nether_wart` | Nether wart |
| ![ghast_tear](../textures/items/ghast_tear.png) | `textures/items/ghast_tear` | Ghast tear |
| ![magma_cream](../textures/items/magma_cream.png) | `textures/items/magma_cream` | Magma cream |
| ![spider_eye_fermented](../textures/items/spider_eye_fermented.png) | `textures/items/spider_eye_fermented` | Fermented spider eye |
| ![dragons_breath](../textures/items/dragons_breath.png) | `textures/items/dragons_breath` | Dragon's breath |

### Materials & Resources

| Preview | Texture Path | Description |
|---|---|---|
| ![diamond](../textures/items/diamond.png) | `textures/items/diamond` | Diamond gem |
| ![emerald](../textures/items/emerald.png) | `textures/items/emerald` | Emerald gem |
| ![gold_ingot](../textures/items/gold_ingot.png) | `textures/items/gold_ingot` | Gold ingot |
| ![iron_ingot](../textures/items/iron_ingot.png) | `textures/items/iron_ingot` | Iron ingot |
| ![netherite_ingot](../textures/items/netherite_ingot.png) | `textures/items/netherite_ingot` | Netherite ingot |
| ![copper_ingot](../textures/items/copper_ingot.png) | `textures/items/copper_ingot` | Copper ingot |
| ![gold_nugget](../textures/items/gold_nugget.png) | `textures/items/gold_nugget` | Gold nugget |
| ![iron_nugget](../textures/items/iron_nugget.png) | `textures/items/iron_nugget` | Iron nugget |
| ![coal](../textures/items/coal.png) | `textures/items/coal` | Coal |
| ![charcoal](../textures/items/charcoal.png) | `textures/items/charcoal` | Charcoal |
| ![redstone_dust](../textures/items/redstone_dust.png) | `textures/items/redstone_dust` | Redstone dust |
| ![dye_powder_blue](../textures/items/dye_powder_blue.png) | `textures/items/dye_powder_blue` | Lapis lazuli |
| ![quartz](../textures/items/quartz.png) | `textures/items/quartz` | Nether quartz |
| ![amethyst_shard](../textures/items/amethyst_shard.png) | `textures/items/amethyst_shard` | Amethyst shard |
| ![netherite_scrap](../textures/items/netherite_scrap.png) | `textures/items/netherite_scrap` | Netherite scrap |
| ![echo_shard](../textures/items/echo_shard.png) | `textures/items/echo_shard` | Echo shard |
| ![glowstone_dust](../textures/items/glowstone_dust.png) | `textures/items/glowstone_dust` | Glowstone dust |
| ![gunpowder](../textures/items/gunpowder.png) | `textures/items/gunpowder` | Gunpowder |
| ![flint](../textures/items/flint.png) | `textures/items/flint` | Flint |
| ![clay_ball](../textures/items/clay_ball.png) | `textures/items/clay_ball` | Clay ball |
| ![brick](../textures/items/brick.png) | `textures/items/brick` | Brick |
| ![netherbrick](../textures/items/netherbrick.png) | `textures/items/netherbrick` | Nether brick |
| ![prismarine_shard](../textures/items/prismarine_shard.png) | `textures/items/prismarine_shard` | Prismarine shard |
| ![prismarine_crystals](../textures/items/prismarine_crystals.png) | `textures/items/prismarine_crystals` | Prismarine crystals |
| ![leather](../textures/items/leather.png) | `textures/items/leather` | Leather |
| ![rabbit_hide](../textures/items/rabbit_hide.png) | `textures/items/rabbit_hide` | Rabbit hide |
| ![feather](../textures/items/feather.png) | `textures/items/feather` | Feather |
| ![bone](../textures/items/bone.png) | `textures/items/bone` | Bone |
| ![bone_meal](../textures/items/bone_meal.png) | `textures/items/bone_meal` | Bone meal |
| ![string](../textures/items/string.png) | `textures/items/string` | String |
| ![slimeball](../textures/items/slimeball.png) | `textures/items/slimeball` | Slime ball |
| ![ender_pearl](../textures/items/ender_pearl.png) | `textures/items/ender_pearl` | Ender pearl |
| ![blaze_rod](../textures/items/blaze_rod.png) | `textures/items/blaze_rod` | Blaze rod |
| ![breeze_rod](../textures/items/breeze_rod.png) | `textures/items/breeze_rod` | Breeze rod |
| ![stick](../textures/items/stick.png) | `textures/items/stick` | Stick |
| ![paper](../textures/items/paper.png) | `textures/items/paper` | Paper |
| ![book_normal](../textures/items/book_normal.png) | `textures/items/book_normal` | Book |
| ![book_enchanted](../textures/items/book_enchanted.png) | `textures/items/book_enchanted` | Enchanted book (glint) |
| ![book_writable](../textures/items/book_writable.png) | `textures/items/book_writable` | Book and quill |
| ![book_written](../textures/items/book_written.png) | `textures/items/book_written` | Written book |
| ![experience_bottle](../textures/items/experience_bottle.png) | `textures/items/experience_bottle` | Bottle o' enchanting |
| ![name_tag](../textures/items/name_tag.png) | `textures/items/name_tag` | Name tag |
| ![lead](../textures/items/lead.png) | `textures/items/lead` | Lead/leash |
| ![saddle](../textures/items/saddle.png) | `textures/items/saddle` | Saddle |
| ![nether_star](../textures/items/nether_star.png) | `textures/items/nether_star` | Nether star |
| ![totem](../textures/items/totem.png) | `textures/items/totem` | Totem of undying |
| ![heart_of_the_sea](../textures/items/heart_of_the_sea.png) | `textures/items/heart_of_the_sea` | Heart of the sea |
| ![nautilus_shell](../textures/items/nautilus_shell.png) | `textures/items/nautilus_shell` | Nautilus shell |
| ![phantom_membrane](../textures/items/phantom_membrane.png) | `textures/items/phantom_membrane` | Phantom membrane |
| ![disc_fragment](../textures/items/disc_fragment.png) | `textures/items/disc_fragment` | Disc fragment |
| ![recovery_compass](../textures/items/recovery_compass.png) | `textures/items/recovery_compass` | Recovery compass |

### Navigation & Exploration

| Preview | Texture Path | Description |
|---|---|---|
| ![compass](../textures/items/compass.png) | `textures/items/compass` | Compass |
| ![clock](../textures/items/clock.png) | `textures/items/clock` | Clock |
| ![map_empty](../textures/items/map_empty.png) | `textures/items/map_empty` | Empty map |
| ![map_filled](../textures/items/map_filled.png) | `textures/items/map_filled` | Filled map |
| ![ender_eye](../textures/items/ender_eye.png) | `textures/items/ender_eye` | Eye of ender |
| ![end_crystal](../textures/items/end_crystal.png) | `textures/items/end_crystal` | End crystal |

### Redstone & Mechanisms

| Preview | Texture Path | Description |
|---|---|---|
| ![comparator](../textures/items/comparator.png) | `textures/items/comparator` | Redstone comparator |
| ![repeater](../textures/items/repeater.png) | `textures/items/repeater` | Redstone repeater |
| ![hopper](../textures/items/hopper.png) | `textures/items/hopper` | Hopper |
| ![minecart_normal](../textures/items/minecart_normal.png) | `textures/items/minecart_normal` | Minecart |
| ![minecart_chest](../textures/items/minecart_chest.png) | `textures/items/minecart_chest` | Chest minecart |
| ![minecart_hopper](../textures/items/minecart_hopper.png) | `textures/items/minecart_hopper` | Hopper minecart |
| ![minecart_tnt](../textures/items/minecart_tnt.png) | `textures/items/minecart_tnt` | TNT minecart |
| ![minecart_command_block](../textures/items/minecart_command_block.png) | `textures/items/minecart_command_block` | Command block minecart |
| ![bucket_empty](../textures/items/bucket_empty.png) | `textures/items/bucket_empty` | Bucket (empty) |
| ![bucket_water](../textures/items/bucket_water.png) | `textures/items/bucket_water` | Water bucket |
| ![bucket_lava](../textures/items/bucket_lava.png) | `textures/items/bucket_lava` | Lava bucket |
| ![bucket_milk](../textures/items/bucket_milk.png) | `textures/items/bucket_milk` | Milk bucket |
| ![bucket_powder_snow](../textures/items/bucket_powder_snow.png) | `textures/items/bucket_powder_snow` | Powder snow bucket |
| ![bucket_axolotl](../textures/items/bucket_axolotl.png) | `textures/items/bucket_axolotl` | Axolotl bucket |
| ![bucket_cod](../textures/items/bucket_cod.png) | `textures/items/bucket_cod` | Cod bucket |
| ![bucket_salmon](../textures/items/bucket_salmon.png) | `textures/items/bucket_salmon` | Salmon bucket |
| ![bucket_tropical](../textures/items/bucket_tropical.png) | `textures/items/bucket_tropical` | Tropical fish bucket |
| ![bucket_pufferfish](../textures/items/bucket_pufferfish.png) | `textures/items/bucket_pufferfish` | Pufferfish bucket |
| ![bucket_tadpole](../textures/items/bucket_tadpole.png) | `textures/items/bucket_tadpole` | Tadpole bucket |

### Dyes

| Preview | Texture Path | Description |
|---|---|---|
| ![dye_powder_white](../textures/items/dye_powder_white.png) | `textures/items/dye_powder_white` | White dye |
| ![dye_powder_orange](../textures/items/dye_powder_orange.png) | `textures/items/dye_powder_orange` | Orange dye |
| ![dye_powder_magenta](../textures/items/dye_powder_magenta.png) | `textures/items/dye_powder_magenta` | Magenta dye |
| ![dye_powder_light_blue](../textures/items/dye_powder_light_blue.png) | `textures/items/dye_powder_light_blue` | Light blue dye |
| ![dye_powder_yellow](../textures/items/dye_powder_yellow.png) | `textures/items/dye_powder_yellow` | Yellow dye |
| ![dye_powder_lime](../textures/items/dye_powder_lime.png) | `textures/items/dye_powder_lime` | Lime dye |
| ![dye_powder_pink](../textures/items/dye_powder_pink.png) | `textures/items/dye_powder_pink` | Pink dye |
| ![dye_powder_gray](../textures/items/dye_powder_gray.png) | `textures/items/dye_powder_gray` | Gray dye |
| ![dye_powder_silver](../textures/items/dye_powder_silver.png) | `textures/items/dye_powder_silver` | Light gray dye |
| ![dye_powder_cyan](../textures/items/dye_powder_cyan.png) | `textures/items/dye_powder_cyan` | Cyan dye |
| ![dye_powder_purple](../textures/items/dye_powder_purple.png) | `textures/items/dye_powder_purple` | Purple dye |
| ![dye_powder_blue](../textures/items/dye_powder_blue.png) | `textures/items/dye_powder_blue` | Blue dye |
| ![dye_powder_brown](../textures/items/dye_powder_brown.png) | `textures/items/dye_powder_brown` | Brown dye |
| ![dye_powder_green](../textures/items/dye_powder_green.png) | `textures/items/dye_powder_green` | Green dye |
| ![dye_powder_red](../textures/items/dye_powder_red.png) | `textures/items/dye_powder_red` | Red dye |
| ![dye_powder_black](../textures/items/dye_powder_black.png) | `textures/items/dye_powder_black` | Black dye |

### Music Discs

| Preview | Texture Path | Description |
|---|---|---|
| ![record_13](../textures/items/record_13.png) | `textures/items/record_13` | Music Disc - 13 |
| ![record_cat](../textures/items/record_cat.png) | `textures/items/record_cat` | Music Disc - Cat |
| ![record_blocks](../textures/items/record_blocks.png) | `textures/items/record_blocks` | Music Disc - Blocks |
| ![record_chirp](../textures/items/record_chirp.png) | `textures/items/record_chirp` | Music Disc - Chirp |
| ![record_far](../textures/items/record_far.png) | `textures/items/record_far` | Music Disc - Far |
| ![record_mall](../textures/items/record_mall.png) | `textures/items/record_mall` | Music Disc - Mall |
| ![record_mellohi](../textures/items/record_mellohi.png) | `textures/items/record_mellohi` | Music Disc - Mellohi |
| ![record_stal](../textures/items/record_stal.png) | `textures/items/record_stal` | Music Disc - Stal |
| ![record_strad](../textures/items/record_strad.png) | `textures/items/record_strad` | Music Disc - Strad |
| ![record_ward](../textures/items/record_ward.png) | `textures/items/record_ward` | Music Disc - Ward |
| ![record_11](../textures/items/record_11.png) | `textures/items/record_11` | Music Disc - 11 |
| ![record_wait](../textures/items/record_wait.png) | `textures/items/record_wait` | Music Disc - Wait |
| ![record_otherside](../textures/items/record_otherside.png) | `textures/items/record_otherside` | Music Disc - Otherside |
| ![record_5](../textures/items/record_5.png) | `textures/items/record_5` | Music Disc - 5 |
| ![record_pigstep](../textures/items/record_pigstep.png) | `textures/items/record_pigstep` | Music Disc - Pigstep |
| ![record_relic](../textures/items/record_relic.png) | `textures/items/record_relic` | Music Disc - Relic |
| ![record_precipice](../textures/items/record_precipice.png) | `textures/items/record_precipice` | Music Disc - Precipice |
| ![record_creator](../textures/items/record_creator.png) | `textures/items/record_creator` | Music Disc - Creator |
| ![record_creator_music_box](../textures/items/record_creator_music_box.png) | `textures/items/record_creator_music_box` | Music Disc - Creator (Music Box) |

### Spawn Eggs & Misc

| Preview | Texture Path | Description |
|---|---|---|
| ![egg](../textures/items/egg.png) | `textures/items/egg` | Egg |
| ![snowball](../textures/items/snowball.png) | `textures/items/snowball` | Snowball |
| ![fireworks](../textures/items/fireworks.png) | `textures/items/fireworks` | Firework rocket |
| ![fireworks_charge](../textures/items/fireworks_charge.png) | `textures/items/fireworks_charge` | Firework star |
| ![sign](../textures/items/sign.png) | `textures/items/sign` | Sign item |
| ![bed_red](../textures/items/bed_red.png) | `textures/items/bed_red` | Red bed item |
| ![door_iron](../textures/items/door_iron.png) | `textures/items/door_iron` | Iron door |
| ![door_wood](../textures/items/door_wood.png) | `textures/items/door_wood` | Oak door |
| ![banner](../textures/items/banner.png) | `textures/items/banner` | Banner |
| ![painting](../textures/items/painting.png) | `textures/items/painting` | Painting |
| ![item_frame](../textures/items/item_frame.png) | `textures/items/item_frame` | Item frame |
| ![glow_item_frame](../textures/items/glow_item_frame.png) | `textures/items/glow_item_frame` | Glow item frame |
| ![armor_stand](../textures/items/armor_stand.png) | `textures/items/armor_stand` | Armor stand |
| ![wind_charge](../textures/items/wind_charge.png) | `textures/items/wind_charge` | Wind charge |
| ![trial_key](../textures/items/trial_key.png) | `textures/items/trial_key` | Trial key |
| ![ominous_trial_key](../textures/items/ominous_trial_key.png) | `textures/items/ominous_trial_key` | Ominous trial key |
| ![wolf_armor](../textures/items/wolf_armor.png) | `textures/items/wolf_armor` | Wolf armor |

---

## 3. Block Textures

> **Source:** [textures/terrain_texture.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/textures/terrain_texture.json)
> **Browse all:** [textures/blocks/](https://github.com/ZtechNetwork/MCBVanillaResourcePack/tree/master/textures/blocks)

Paths prefixed with `textures/blocks/`. Useful for representing block-based buttons/icons.

| Preview | Texture Path | Description |
|---|---|---|
| ![grass_side_carried](../textures/blocks/grass_side_carried.png) | `textures/blocks/grass_side_carried` | Grass block side (inventory) |
| ![stone](../textures/blocks/stone.png) | `textures/blocks/stone` | Stone |
| ![cobblestone](../textures/blocks/cobblestone.png) | `textures/blocks/cobblestone` | Cobblestone |
| ![dirt](../textures/blocks/dirt.png) | `textures/blocks/dirt` | Dirt |
| ![planks_oak](../textures/blocks/planks_oak.png) | `textures/blocks/planks_oak` | Oak planks |
| ![log_oak](../textures/blocks/log_oak.png) | `textures/blocks/log_oak` | Oak log side |
| ![crafting_table_front](../textures/blocks/crafting_table_front.png) | `textures/blocks/crafting_table_front` | Crafting table front |
| ![furnace_front_off](../textures/blocks/furnace_front_off.png) | `textures/blocks/furnace_front_off` | Furnace front (off) |
| ![chest_front](../textures/blocks/chest_front.png) | `textures/blocks/chest_front` | Chest front |
| ![bookshelf](../textures/blocks/bookshelf.png) | `textures/blocks/bookshelf` | Bookshelf |
| ![glass](../textures/blocks/glass.png) | `textures/blocks/glass` | Glass |
| ![tnt_side](../textures/blocks/tnt_side.png) | `textures/blocks/tnt_side` | TNT side |
| ![obsidian](../textures/blocks/obsidian.png) | `textures/blocks/obsidian` | Obsidian |
| ![portal](../textures/blocks/portal.png) | `textures/blocks/portal` | Nether portal texture |
| ![end_portal](../textures/blocks/end_portal.png) | `textures/blocks/end_portal` | End portal texture |
| ![bedrock](../textures/blocks/bedrock.png) | `textures/blocks/bedrock` | Bedrock |
| ![diamond_block](../textures/blocks/diamond_block.png) | `textures/blocks/diamond_block` | Diamond block |
| ![gold_block](../textures/blocks/gold_block.png) | `textures/blocks/gold_block` | Gold block |
| ![iron_block](../textures/blocks/iron_block.png) | `textures/blocks/iron_block` | Iron block |
| ![emerald_block](../textures/blocks/emerald_block.png) | `textures/blocks/emerald_block` | Emerald block |
| ![redstone_block](../textures/blocks/redstone_block.png) | `textures/blocks/redstone_block` | Redstone block |
| ![command_block](../textures/blocks/command_block.png) | `textures/blocks/command_block` | Command block |
| ![barrier](../textures/blocks/barrier.png) | `textures/blocks/barrier` | Barrier (red square) |
| ![spawner](../textures/blocks/spawner.png) | `textures/blocks/spawner` | Mob spawner |

---

## 4. GUI Container Textures

Paths prefixed with `textures/gui/`. These are full container screen backgrounds.

| Texture Path | Description |
|---|---|
| `textures/gui/container/inventory` | Player inventory screen |
| `textures/gui/container/crafting_table` | Crafting table screen |
| `textures/gui/container/furnace` | Furnace screen |
| `textures/gui/container/enchanting_table` | Enchanting table screen |
| `textures/gui/container/anvil` | Anvil screen |
| `textures/gui/container/brewing_stand` | Brewing stand screen |
| `textures/gui/container/beacon` | Beacon screen |
| `textures/gui/container/generic_54` | Large chest (6 rows) |
| `textures/gui/container/hopper` | Hopper screen |
| `textures/gui/container/horse` | Horse inventory screen |
| `textures/gui/container/villager2` | Villager trading screen |

---

## 5. Usage Examples

### JSON UI — Image Element
```json
{
  "my_icon": {
    "type": "image",
    "texture": "textures/ui/settings_glyph_color",
    "size": [16, 16]
  }
}
```

### JSON UI — Button with Icon
```json
{
  "my_button@common.button": {
    "$pressed_button_name": "button.my_action",
    "controls": [
      {
        "icon": {
          "type": "image",
          "texture": "textures/items/compass",
          "size": [16, 16],
          "layer": 2
        }
      }
    ]
  }
}
```

### Script API — ActionFormData Button Icon
```javascript
import { ActionFormData } from "@minecraft/server-ui";

const form = new ActionFormData();
form.title("Server Menu");
form.body("Choose an option:");
form.button("Settings", "textures/ui/settings_glyph_color");
form.button("Teleport", "textures/items/ender_pearl");
form.button("Shop", "textures/items/emerald");
form.button("Home", "textures/items/compass");
form.button("PvP Arena", "textures/items/diamond_sword");
form.button("Info", "textures/ui/infobulb");
form.button("Close", "textures/ui/cancel");
```

### Custom Icons (Resource Pack)
You can add custom icons by placing `.png` files in your resource pack and referencing them:
```javascript
form.button("Custom", "textures/custom/my_icon");
```
The file would be at: `RP/textures/custom/my_icon.png`

---

## 6. Custom / Special-Purpose Vanilla UI Icons

These are the "hidden gem" textures — they exist in the vanilla `textures/ui/` directory but aren't standard buttons or arrows. Many are only referenced deep inside specific JSON UI screens. These are the ones AI tends to hallucinate names for. All verified from vanilla RP JSON UI source files.

### Creative Inventory Tab Icons

> **Source:** [ui/inventory_screen.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/inventory_screen.json), [ui/inventory_screen_pocket.json](https://github.com/Mojang/bedrock-samples/blob/main/resource_pack/ui/inventory_screen_pocket.json)

These are the icons used for the creative inventory category tabs. They look like stylized symbolic representations, NOT the actual items themselves.

| Preview | Texture Path | Description |
|---|---|---|
| ![icon_recipe_nature](../textures/ui/icon_recipe_nature.png) | `textures/ui/icon_recipe_nature` | Nature tab — emerald/gem with a leaf (the one you mentioned) |
| ![icon_recipe_equipment](../textures/ui/icon_recipe_equipment.png) | `textures/ui/icon_recipe_equipment` | Equipment tab — sword icon |
| ![icon_recipe_construction](../textures/ui/icon_recipe_construction.png) | `textures/ui/icon_recipe_construction` | Construction tab — brick/wall icon |
| ![icon_recipe_item](../textures/ui/icon_recipe_item.png) | `textures/ui/icon_recipe_item` | Items tab — stick/misc item icon |
| ![creative_icon](../textures/ui/creative_icon.png) | `textures/ui/creative_icon` | Creative mode star icon |
| ![icon_recipe_back](../textures/ui/icon_recipe_back.png) | `textures/ui/icon_recipe_back` | Back arrow for recipe navigation |
| ![icon_deals](../textures/ui/icon_deals.png) | `textures/ui/icon_deals` | Deals/trades icon (villager trade screen) |
| ![icon_spring](../textures/ui/icon_spring.png) | `textures/ui/icon_spring` | Spring/bouncy icon |
| ![icon_fall](../textures/ui/icon_fall.png) | `textures/ui/icon_fall` | Fall icon |
| ![icon_summer](../textures/ui/icon_summer.png) | `textures/ui/icon_summer` | Summer icon |
| ![icon_winter](../textures/ui/icon_winter.png) | `textures/ui/icon_winter` | Winter icon |
| ![icon_best_3](../textures/ui/icon_best_3.png) | `textures/ui/icon_best_3` | Top 3 / best icon |
| ![icon_new](../textures/ui/icon_new.png) | `textures/ui/icon_new` | "New" tag icon |
| ![icon_random](../textures/ui/icon_random.png) | `textures/ui/icon_random` | Random/shuffle icon |
| ![icon_multiplayer](../textures/ui/icon_multiplayer.png) | `textures/ui/icon_multiplayer` | Multiplayer icon |
| ![icon_minecoin](../textures/ui/icon_minecoin.png) | `textures/ui/icon_minecoin` | Minecoins currency icon |
| ![icon_minecoin_9x9](../textures/ui/icon_minecoin_9x9.png) | `textures/ui/icon_minecoin_9x9` | Minecoins icon (9x9 small) |

### Store / Marketplace Icons

| Preview | Texture Path | Description |
|---|---|---|
| ![store_home_icon](../textures/ui/store_home_icon.png) | `textures/ui/store_home_icon` | Marketplace home icon |
| ![mashup_hangar](../textures/ui/mashup_hangar.png) | `textures/ui/mashup_hangar` | Mashup pack icon |
| ![icon_packs](../textures/ui/icon_packs.png) | `textures/ui/icon_packs` | Packs icon |
| ![icon_resourcepack](../textures/ui/icon_resourcepack.png) | `textures/ui/icon_resourcepack` | Resource pack icon |
| ![icon_behaviorpack](../textures/ui/icon_behaviorpack.png) | `textures/ui/icon_behaviorpack` | Behavior pack icon |
| ![icon_worldtemplate](../textures/ui/icon_worldtemplate.png) | `textures/ui/icon_worldtemplate` | World template icon |
| ![icon_skinpack](../textures/ui/icon_skinpack.png) | `textures/ui/icon_skinpack` | Skin pack icon |
| ![icon_mashup](../textures/ui/icon_mashup.png) | `textures/ui/icon_mashup` | Mashup pack icon (alt) |
| ![icon_more](../textures/ui/icon_more.png) | `textures/ui/icon_more` | "More" ellipsis/dots icon |
| ![icon_import](../textures/ui/icon_import.png) | `textures/ui/icon_import` | Import icon |
| ![icon_export](../textures/ui/icon_export.png) | `textures/ui/icon_export` | Export icon |
| ![promo_gift_small](../textures/ui/promo_gift_small.png) | `textures/ui/promo_gift_small` | Promotional gift icon |
| ![promo_gift_big](../textures/ui/promo_gift_big.png) | `textures/ui/promo_gift_big` | Promotional gift icon (large) |
| ![wishlist_gray](../textures/ui/wishlist_gray.png) | `textures/ui/wishlist_gray` | Wishlist icon (gray/inactive) |
| ![wishlist_white](../textures/ui/wishlist_white.png) | `textures/ui/wishlist_white` | Wishlist icon (white/active) |
| ![coins](../textures/ui/coins.png) | `textures/ui/coins` | Coins icon |
| ![sale_banner](../textures/ui/sale_banner.png) | `textures/ui/sale_banner` | Sale banner overlay |

### Realms & Multiplayer Icons

| Preview | Texture Path | Description |
|---|---|---|
| ![realmsIcon](../textures/ui/realmsIcon.png) | `textures/ui/realmsIcon` | Realms icon |
| ![realmportal_small](../textures/ui/realmportal_small.png) | `textures/ui/realmportal_small` | Realms Plus portal (small) |
| ![worldsIcon](../textures/ui/worldsIcon.png) | `textures/ui/worldsIcon` | Worlds icon |
| ![icon_xbox_live](../textures/ui/icon_xbox_live.png) | `textures/ui/icon_xbox_live` | Xbox Live icon |
| ![icon_sign_in](../textures/ui/icon_sign_in.png) | `textures/ui/icon_sign_in` | Sign-in icon |
| ![icon_sign_out](../textures/ui/icon_sign_out.png) | `textures/ui/icon_sign_out` | Sign-out icon |
| ![invite_base](../textures/ui/invite_base.png) | `textures/ui/invite_base` | Invite player base icon |
| ![invite_hover](../textures/ui/invite_hover.png) | `textures/ui/invite_hover` | Invite player hover state |
| ![realms_green_check](../textures/ui/realms_green_check.png) | `textures/ui/realms_green_check` | Green checkmark (realm status OK) |
| ![realms_red_x](../textures/ui/realms_red_x.png) | `textures/ui/realms_red_x` | Red X mark (realm status error) |
| ![realms_slot_check](../textures/ui/realms_slot_check.png) | `textures/ui/realms_slot_check` | Realm slot checkmark |
| ![realms_arrow](../textures/ui/realms_arrow.png) | `textures/ui/realms_arrow` | Realm arrow |
| ![realms_world_options](../textures/ui/realms_world_options.png) | `textures/ui/realms_world_options` | Realm world options gear |
| ![icon_online](../textures/ui/icon_online.png) | `textures/ui/icon_online` | Online status indicator |
| ![icon_offline](../textures/ui/icon_offline.png) | `textures/ui/icon_offline` | Offline status indicator |

### Permission & Player Icons

| Preview | Texture Path | Description |
|---|---|---|
| ![permissions_member_star](../textures/ui/permissions_member_star.png) | `textures/ui/permissions_member_star` | Member star badge |
| ![permissions_visitor_hand](../textures/ui/permissions_visitor_hand.png) | `textures/ui/permissions_visitor_hand` | Visitor hand icon |
| ![permissions_op_crown](../textures/ui/permissions_op_crown.png) | `textures/ui/permissions_op_crown` | Operator crown icon |
| ![friend1](../textures/ui/friend1.png) | `textures/ui/friend1` | Friend/player icon |
| ![friend2](../textures/ui/friend2.png) | `textures/ui/friend2` | Friend icon variant 2 |
| ![mute_on](../textures/ui/mute_on.png) | `textures/ui/mute_on` | Player muted |
| ![mute_off](../textures/ui/mute_off.png) | `textures/ui/mute_off` | Player unmuted |
| ![gamerpic_default](../textures/ui/gamerpic_default.png) | `textures/ui/gamerpic_default` | Default player avatar |
| ![icon_alex](../textures/ui/icon_alex.png) | `textures/ui/icon_alex` | Alex skin icon |
| ![icon_steve](../textures/ui/icon_steve.png) | `textures/ui/icon_steve` | Steve skin icon |

### Education Edition / Chemistry Icons

These exist in the vanilla RP even in non-Education mode. Usable in JSON UI.

| Preview | Texture Path | Description |
|---|---|---|
| ![icon_book](../textures/ui/icon_book.png) | `textures/ui/icon_book` | Book icon (EDU) |
| ![icon_immersive_reader](../textures/ui/icon_immersive_reader.png) | `textures/ui/icon_immersive_reader` | Immersive reader icon |
| ![icon_portfolio](../textures/ui/icon_portfolio.png) | `textures/ui/icon_portfolio` | Portfolio icon |
| ![icon_camera](../textures/ui/icon_camera.png) | `textures/ui/icon_camera` | Camera icon |
| ![icon_code](../textures/ui/icon_code.png) | `textures/ui/icon_code` | Code icon |
| ![icon_agent](../textures/ui/icon_agent.png) | `textures/ui/icon_agent` | Agent icon |

### NPC / Dialog Icons

| Preview | Texture Path | Description |
|---|---|---|
| ![dialog_bubble](../textures/ui/dialog_bubble.png) | `textures/ui/dialog_bubble` | NPC speech bubble background |
| ![dialog_bubble_point](../textures/ui/dialog_bubble_point.png) | `textures/ui/dialog_bubble_point` | Speech bubble pointer/tail |
| ![dialog_background_opaque](../textures/ui/dialog_background_opaque.png) | `textures/ui/dialog_background_opaque` | NPC dialog opaque background |
| ![icon_link](../textures/ui/icon_link.png) | `textures/ui/icon_link` | URL/link icon (NPC button) |
| ![icon_command](../textures/ui/icon_command.png) | `textures/ui/icon_command` | Command icon (NPC button) |
| ![icon_close](../textures/ui/icon_close.png) | `textures/ui/icon_close` | Close icon (NPC screen) |

### Beacon Icons

| Preview | Texture Path | Description |
|---|---|---|
| ![speed_effect](../textures/ui/speed_effect.png) | `textures/ui/speed_effect` | Speed effect (beacon) |
| ![haste_effect](../textures/ui/haste_effect.png) | `textures/ui/haste_effect` | Haste effect (beacon) |
| ![resistance_effect](../textures/ui/resistance_effect.png) | `textures/ui/resistance_effect` | Resistance effect (beacon) |
| ![jump_boost_effect](../textures/ui/jump_boost_effect.png) | `textures/ui/jump_boost_effect` | Jump Boost effect (beacon) |
| ![strength_effect](../textures/ui/strength_effect.png) | `textures/ui/strength_effect` | Strength effect (beacon) |
| ![regeneration_effect](../textures/ui/regeneration_effect.png) | `textures/ui/regeneration_effect` | Regeneration effect (beacon) |
| ![confirm](../textures/ui/confirm.png) | `textures/ui/confirm` | Confirm/checkmark (beacon) |

### Enchanting Table Icons

| Preview | Texture Path | Description |
|---|---|---|
| ![enchanting_active_background](../textures/ui/enchanting_active_background.png) | `textures/ui/enchanting_active_background` | Enchanting slot active |
| ![enchanting_dark_background](../textures/ui/enchanting_dark_background.png) | `textures/ui/enchanting_dark_background` | Enchanting slot dark/inactive |
| ![lapis_image](../textures/ui/lapis_image.png) | `textures/ui/lapis_image` | Lapis icon (enchanting cost) |

### Smithing & Crafting Decorative

| Preview | Texture Path | Description |
|---|---|---|
| ![smithing_icon](../textures/ui/smithing_icon.png) | `textures/ui/smithing_icon` | Smithing table icon |
| ![loom_icon](../textures/ui/loom_icon.png) | `textures/ui/loom_icon` | Loom icon |
| ![cartography_table_icon](../textures/ui/cartography_table_icon.png) | `textures/ui/cartography_table_icon` | Cartography table icon |
| ![grindstone_icon](../textures/ui/grindstone_icon.png) | `textures/ui/grindstone_icon` | Grindstone icon |
| ![stonecutter_icon](../textures/ui/stonecutter_icon.png) | `textures/ui/stonecutter_icon` | Stonecutter icon |
| ![anvil_icon](../textures/ui/anvil_icon.png) | `textures/ui/anvil_icon` | Anvil icon |
| ![smithing_table_hammer](../textures/ui/smithing_table_hammer.png) | `textures/ui/smithing_table_hammer` | Hammer icon (smithing) |
| ![smithing_table_plus](../textures/ui/smithing_table_plus.png) | `textures/ui/smithing_table_plus` | Plus/add icon (smithing) |
| ![smithing_table_equal](../textures/ui/smithing_table_equal.png) | `textures/ui/smithing_table_equal` | Equals icon (smithing) |
| ![empty_armor_slot_helmet](../textures/ui/empty_armor_slot_helmet.png) | `textures/ui/empty_armor_slot_helmet` | Empty helmet slot silhouette |
| ![empty_armor_slot_chestplate](../textures/ui/empty_armor_slot_chestplate.png) | `textures/ui/empty_armor_slot_chestplate` | Empty chestplate slot silhouette |
| ![empty_armor_slot_leggings](../textures/ui/empty_armor_slot_leggings.png) | `textures/ui/empty_armor_slot_leggings` | Empty leggings slot silhouette |
| ![empty_armor_slot_boots](../textures/ui/empty_armor_slot_boots.png) | `textures/ui/empty_armor_slot_boots` | Empty boots slot silhouette |
| ![empty_armor_slot_shield](../textures/ui/empty_armor_slot_shield.png) | `textures/ui/empty_armor_slot_shield` | Empty shield/offhand slot silhouette |

### Misc Decorative / Symbolic Icons

| Preview | Texture Path | Description |
|---|---|---|
| ![color_plus](../textures/ui/color_plus.png) | `textures/ui/color_plus` | Plus sign (colored) |
| ![color_picker](../textures/ui/color_picker.png) | `textures/ui/color_picker` | Color picker icon |
| ![magnifyingGlass](../textures/ui/magnifyingGlass.png) | `textures/ui/magnifyingGlass` | Search magnifying glass |
| ![smallgem](../textures/ui/smallgem.png) | `textures/ui/smallgem` | Small gem/emerald icon |
| ![selected_pack_top](../textures/ui/selected_pack_top.png) | `textures/ui/selected_pack_top` | Selected pack top border |
| ![unselected_pack](../textures/ui/unselected_pack.png) | `textures/ui/unselected_pack` | Unselected pack border |
| ![TabTopFront](../textures/ui/TabTopFront.png) | `textures/ui/TabTopFront` | Tab top front piece |
| ![TabTopBack](../textures/ui/TabTopBack.png) | `textures/ui/TabTopBack` | Tab top back piece |
| ![TabTopFrontCrop](../textures/ui/TabTopFrontCrop.png) | `textures/ui/TabTopFrontCrop` | Tab top front cropped |
| ![TabTopBackCrop](../textures/ui/TabTopBackCrop.png) | `textures/ui/TabTopBackCrop` | Tab top back cropped |
| ![TabLeftFront](../textures/ui/TabLeftFront.png) | `textures/ui/TabLeftFront` | Tab left front piece |
| ![TabLeftBack](../textures/ui/TabLeftBack.png) | `textures/ui/TabLeftBack` | Tab left back piece |
| ![TabLeftFrontCrop](../textures/ui/TabLeftFrontCrop.png) | `textures/ui/TabLeftFrontCrop` | Tab left front cropped |
| ![TabLeftBackCrop](../textures/ui/TabLeftBackCrop.png) | `textures/ui/TabLeftBackCrop` | Tab left back cropped |
| ![TabRightFront](../textures/ui/TabRightFront.png) | `textures/ui/TabRightFront` | Tab right front piece |
| ![TabRightBack](../textures/ui/TabRightBack.png) | `textures/ui/TabRightBack` | Tab right back piece |
| ![TabRightFrontCrop](../textures/ui/TabRightFrontCrop.png) | `textures/ui/TabRightFrontCrop` | Tab right front cropped |
| ![TabRightBackCrop](../textures/ui/TabRightBackCrop.png) | `textures/ui/TabRightBackCrop` | Tab right back cropped |
| ![elipses](../textures/ui/elipses.png) | `textures/ui/elipses` | Ellipsis (...) icon |
| ![cursor](../textures/ui/cursor.png) | `textures/ui/cursor` | Cursor icon |
| ![text_color_paintbrush](../textures/ui/text_color_paintbrush.png) | `textures/ui/text_color_paintbrush` | Text color paintbrush |
| ![timer](../textures/ui/timer.png) | `textures/ui/timer` | Timer icon |
| ![conduit_power_effect](../textures/ui/conduit_power_effect.png) | `textures/ui/conduit_power_effect` | Conduit power icon |
| ![bad_omen_effect](../textures/ui/bad_omen_effect.png) | `textures/ui/bad_omen_effect` | Bad Omen icon |
| ![village_hero_effect](../textures/ui/village_hero_effect.png) | `textures/ui/village_hero_effect` | Hero of the Village icon |
| ![debug_glyph_color](../textures/ui/debug_glyph_color.png) | `textures/ui/debug_glyph_color` | Debug icon (creator settings) |
| ![creator_glyph_color](../textures/ui/creator_glyph_color.png) | `textures/ui/creator_glyph_color` | Creator/dev icon |
| ![gear](../textures/ui/gear.png) | `textures/ui/gear` | Gear/cog icon |
| ![sidebar_icons](../textures/ui/sidebar_icons.png) | `textures/ui/sidebar_icons` | Sidebar icon atlas (sprite sheet — multiple icons in one image) |
| ![subcategory_icons](../textures/ui/subcategory_icons.png) | `textures/ui/subcategory_icons` | Creative subcategory icon atlas (sprite sheet) |
| ![chat_tag_label](../textures/ui/chat_tag_label.png) | `textures/ui/chat_tag_label` | Chat tag label background |
| ![pocket_button_default](../textures/ui/pocket_button_default.png) | `textures/ui/pocket_button_default` | Pocket UI button default |
| ![pocket_button_hover](../textures/ui/pocket_button_hover.png) | `textures/ui/pocket_button_hover` | Pocket UI button hover |
| ![pocket_button_pressed](../textures/ui/pocket_button_pressed.png) | `textures/ui/pocket_button_pressed` | Pocket UI button pressed |
| ![filledStar](../textures/ui/filledStar.png) | `textures/ui/filledStar` | Filled star (rating) |
| ![emptyStar](../textures/ui/emptyStar.png) | `textures/ui/emptyStar` | Empty star (rating) |
| ![halfStar](../textures/ui/halfStar.png) | `textures/ui/halfStar` | Half star (rating) |
| ![trade_arrow](../textures/ui/trade_arrow.png) | `textures/ui/trade_arrow` | Trading arrow (villager) |
| ![trade_arrow_gray](../textures/ui/trade_arrow_gray.png) | `textures/ui/trade_arrow_gray` | Trading arrow grayed out |
| ![icon_map](../textures/ui/icon_map.png) | `textures/ui/icon_map` | Map icon |
| ![icon_bookshelf](../textures/ui/icon_bookshelf.png) | `textures/ui/icon_bookshelf` | Bookshelf icon |
| ![icon_trash](../textures/ui/icon_trash.png) | `textures/ui/icon_trash` | Trash icon (alt) |
| ![icon_food](../textures/ui/icon_food.png) | `textures/ui/icon_food` | Food icon |
| ![icon_armor](../textures/ui/icon_armor.png) | `textures/ui/icon_armor` | Armor icon |

### Gamepad / Controller Glyphs

| Preview | Texture Path | Description |
|---|---|---|
| ![xbox_face_button_down](../textures/ui/xbox_face_button_down.png) | `textures/ui/xbox_face_button_down` | Xbox A button |
| ![xbox_face_button_right](../textures/ui/xbox_face_button_right.png) | `textures/ui/xbox_face_button_right` | Xbox B button |
| ![xbox_face_button_left](../textures/ui/xbox_face_button_left.png) | `textures/ui/xbox_face_button_left` | Xbox X button |
| ![xbox_face_button_up](../textures/ui/xbox_face_button_up.png) | `textures/ui/xbox_face_button_up` | Xbox Y button |
| ![xbox_bumper_left](../textures/ui/xbox_bumper_left.png) | `textures/ui/xbox_bumper_left` | Xbox left bumper |
| ![xbox_bumper_right](../textures/ui/xbox_bumper_right.png) | `textures/ui/xbox_bumper_right` | Xbox right bumper |
| ![xbox_left_trigger](../textures/ui/xbox_left_trigger.png) | `textures/ui/xbox_left_trigger` | Xbox left trigger |
| ![xbox_right_trigger](../textures/ui/xbox_right_trigger.png) | `textures/ui/xbox_right_trigger` | Xbox right trigger |
| ![xbox_stick_left](../textures/ui/xbox_stick_left.png) | `textures/ui/xbox_stick_left` | Xbox left stick |
| ![xbox_stick_right](../textures/ui/xbox_stick_right.png) | `textures/ui/xbox_stick_right` | Xbox right stick |
| ![xbox_start_button](../textures/ui/xbox_start_button.png) | `textures/ui/xbox_start_button` | Xbox menu button |
| ![xbox_select_button](../textures/ui/xbox_select_button.png) | `textures/ui/xbox_select_button` | Xbox view button |
| ![xbox_dpad_up](../textures/ui/xbox_dpad_up.png) | `textures/ui/xbox_dpad_up` | Xbox D-pad up |
| ![xbox_dpad_down](../textures/ui/xbox_dpad_down.png) | `textures/ui/xbox_dpad_down` | Xbox D-pad down |
| ![xbox_dpad_left](../textures/ui/xbox_dpad_left.png) | `textures/ui/xbox_dpad_left` | Xbox D-pad left |
| ![xbox_dpad_right](../textures/ui/xbox_dpad_right.png) | `textures/ui/xbox_dpad_right` | Xbox D-pad right |
| ![switch_face_button_down](../textures/ui/switch_face_button_down.png) | `textures/ui/switch_face_button_down` | Switch A button |
| ![switch_face_button_right](../textures/ui/switch_face_button_right.png) | `textures/ui/switch_face_button_right` | Switch B button |
| ![switch_face_button_left](../textures/ui/switch_face_button_left.png) | `textures/ui/switch_face_button_left` | Switch X button |
| ![switch_face_button_up](../textures/ui/switch_face_button_up.png) | `textures/ui/switch_face_button_up` | Switch Y button |
| ![ps4_face_button_down](../textures/ui/ps4_face_button_down.png) | `textures/ui/ps4_face_button_down` | PlayStation cross button |
| ![ps4_face_button_right](../textures/ui/ps4_face_button_right.png) | `textures/ui/ps4_face_button_right` | PlayStation circle button |
| ![ps4_face_button_left](../textures/ui/ps4_face_button_left.png) | `textures/ui/ps4_face_button_left` | PlayStation square button |
| ![ps4_face_button_up](../textures/ui/ps4_face_button_up.png) | `textures/ui/ps4_face_button_up` | PlayStation triangle button |

---

## Notes

- **No extension needed:** Minecraft auto-resolves `.png`, `.tga`, `.jpg` (priority: `.tga` > `.png` > `.jpg`).
- **Case sensitivity:** Texture paths ARE case-sensitive on some platforms. Stick to lowercase where possible, but note some vanilla textures use mixed case (e.g., `Feedback`, `Black`, `White`, `NormalButtonThinNewBevel`).
- **9-slice textures:** Many button/dialog backgrounds use 9-slice rendering. They scale without distortion via `"nineslice_size"` in JSON UI.
- **Icon size:** Most UI icons are 16x16 or 32x32. Item/block textures are 16x16.
- **Flip book textures:** Some textures (like `bell_ringing`) are sprite sheets animated via `"anim_type": "flip_book"`.
- **Ore UI textures:** Newer menu screens use Ore UI framework. Those textures are stored internally and are NOT accessible from resource packs or JSON UI.

---

> **Last verified:** Minecraft Bedrock Edition 1.21.x (2025)
>
> **Sources:**
> - [Mojang/bedrock-samples](https://github.com/Mojang/bedrock-samples) — Official vanilla resource pack (textures + UI JSON)
> - [ZtechNetwork/MCBVanillaResourcePack](https://github.com/ZtechNetwork/MCBVanillaResourcePack) — Community mirror with browsable texture directories
> - [Bedrock Wiki — JSON UI Documentation](https://wiki.bedrock.dev/json-ui/json-ui-documentation)
> - [Bedrock Wiki — Modifying Server Forms](https://wiki.bedrock.dev/json-ui/modifying-server-forms)
> - [Minecraft Wiki — Bedrock Edition GUI and UI textures](https://minecraft.wiki/w/Bedrock_Edition_GUI_and_UI_textures)
> - [LeGend077 JSON UI Examples](https://github.com/LeGend077/json-ui-examples)

---

## Asset Notice

Icon previews link directly to Mojang's vanilla resource pack files hosted in public GitHub repositories
([Mojang/bedrock-samples](https://github.com/Mojang/bedrock-samples), [ZtechNetwork/MCBVanillaResourcePack](https://github.com/ZtechNetwork/MCBVanillaResourcePack)).
These assets remain the property of **Mojang Studios / Microsoft**.
They are referenced here strictly for documentation and developer reference purposes.

---

## Contributing & Verification

This document was compiled from Mojang's official repositories and verified against vanilla
resource pack source files. If you find an incorrect path, missing entry, or version-specific change:

- Open an issue or PR on this repo
- Include the Minecraft version you tested against
- Cite the source (vanilla RP file path, MS Learn page, etc.)
- For new textures: include the JSON UI file where the texture is referenced
