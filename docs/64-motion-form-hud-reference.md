# Maze UI Animation, Form, And HUD Reference

`motion-form-gallery-a` is a restricted, neutralized reference family for animation-heavy server forms, progression menus, shop flows, NPC forms, and HUD overlays. Use it when the requested UI needs a high-polish game mode menu rather than a plain vanilla action form.

Raw files are local-only under `references/restricted/advanced-ui-set-ui/motion-form-gallery-a/`. Do not publish source names, source marker strings, source credits, restricted comments, or restricted texture paths.

## Opening Order

1. `data/advanced-ui-set-file-index.json`
2. `docs/60-advanced-ui-set-special-ui-reference.md`
3. `docs/64-motion-form-hud-reference.md`
4. One closest restricted file under `references/restricted/advanced-ui-set-ui/motion-form-gallery-a/`

For implementation, open only the closest file first. If that file delegates to shared templates, then open `motion-form-gallery-a/ui/mai/common.json` and only the referenced component file.

## Feature Taxonomy

| User asks for | Pattern | Open first | Then open |
| --- | --- | --- | --- |
| ability, skill tree, battlepass-like progression, upgrade nodes | `ability_upgrade_carousel` | `motion-form-gallery-a/ui/mai/components/ability/ability_upgrades_tab.json` | `motion-form-gallery-a/ui/mai/components/ability/ability_xp.json` |
| shop, store, product grid, purchase flow | `shop_grid_form_component` | `motion-form-gallery-a/ui/mai/components/shop/shop_browser.json` | `motion-form-gallery-a/ui/mai/components/purchase/purchase_popup.json` |
| quest browser, quest tab, objective list | `quest_form_component` | `motion-form-gallery-a/ui/mai/components/quest/quest_tab.json` | matching quest browser/detail component |
| cosmetics or wardrobe form | `cosmetics_form_component` | `motion-form-gallery-a/ui/mai/custom_form/cosmetics.json` | `motion-form-gallery-a/ui/mai/components/cosmetics/cosmetics_browser.json` |
| multi-feature server form router | `maze_multi_feature_form_router` | `motion-form-gallery-a/ui/mai/custom_form.json` | `motion-form-gallery-a/ui/server_form.json` |
| modal purchase confirmation, waiting, success, failure | `purchase_popup_flow` | `motion-form-gallery-a/ui/mai/components/purchase/purchase_popup.json` | specific popup state file |
| in-game status HUD with effects, cooldowns, and bars | `maze_status_hud` | `motion-form-gallery-a/ui/mai/custom_hud/maze.json` | `motion-form-gallery-a/ui/mai/custom_hud.json` |
| reward HUD overlay | `reward_hud_overlay` | `motion-form-gallery-a/ui/mai/custom_hud/reward.json` | `motion-form-gallery-a/ui/mai/components/watermark.json` if needed |
| NPC dialogue or book-style UI | `npc_dialogue_form` | `motion-form-gallery-a/ui/mai/custom_npc.json` | `motion-form-gallery-a/ui/mai/custom_npc/book.json` |
| shared dark window, close button, scroll frame, base card chrome | `maze_common_templates` | `motion-form-gallery-a/ui/mai/common.json` | `form_base.json`, `form_background.json` |

## Main Files

| Neutral path | Role | Signal |
| --- | --- | --- |
| `motion-form-gallery-a/ui/mai/common.json` | shared window, selection, button, and scroll templates | 34 top-level keys, 30 control arrays |
| `motion-form-gallery-a/ui/mai/custom_form.json` | large router for ability, cosmetics, death, purchase, quest, shop, end, reward | 904 bindings, 412 control arrays |
| `motion-form-gallery-a/ui/mai/components/ability/ability_upgrades_tab.json` | horizontal ability upgrade carousel | offset animation, slider-derived anchored offset |
| `motion-form-gallery-a/ui/mai/components/ability/ability_xp.json` | ability XP progress strip | `clip_ratio` progress |
| `motion-form-gallery-a/ui/mai/components/shop/shop_browser.json` | product grid and shop browser | 32 indexed item button positions |
| `motion-form-gallery-a/ui/mai/components/purchase/purchase_popup.json` | popup flow shell | description/confirmation/waiting/success/failure routing |
| `motion-form-gallery-a/ui/mai/components/quest/quest_tab.json` | quest tab layout | tab/button collections and detail area |
| `motion-form-gallery-a/ui/mai/custom_hud/maze.json` | status HUD | progress bars, cooldown overlays, effect rows, flip-book icons |
| `motion-form-gallery-a/ui/mai/custom_hud/reward.json` | reward overlay HUD | two animation definitions and reward rows |
| `motion-form-gallery-a/ui/mai/custom_npc.json` | NPC interaction form | dialogue panel and book route |

## Animation And Binding Values

Use these as known-good JSON UI animation/binding patterns, then rename namespaces and controls.

| Pattern | Source | Reusable mechanism |
| --- | --- | --- |
| horizontal carousel fix | `ability_upgrades_tab.json` | `anim_type: "offset"`, `from: ["-50%", 0]`, `to: ["-50%", 0]`, `duration: 1` to force stable slider/box positioning |
| ability carousel movement | `ability_upgrades_tab.json` | slider value becomes `#anchored_offset_value_x`, then drives the node strip offset |
| XP/progress fill | `ability_xp.json` | `clip_ratio` on a foreground image, with explicit fixed bar size |
| location/status icon animation | `custom_hud/maze.json` | `flip_book` with `frame_count: 12`, `frame_step: 32`, `fps: 12` |
| glitch/status animation | `custom_hud/maze.json` | `flip_book` with `frame_count: 4`, `frame_step: 16`, `fps: 2` |
| effect duration bars | `custom_hud/maze.json` | row-local `clip_ratio` bars bound from parsed HUD values |
| reward overlay animation | `custom_hud/reward.json` | grouped HUD controls with animation-defined visibility/state changes |

## Design Rules

- Treat ability upgrades as a progression or battlepass-like menu: use node cards, locked/unlocked/selected states, XP strip, and a clipped horizontal strip.
- Treat shop and purchase as separate features: shop browser is the grid; purchase popup is a state machine.
- Treat HUD bars differently from form bars: HUD bars usually parse title/actionbar data; form bars often parse `#form_text` or `form_buttons` collection data.
- Keep repeated button states identical in `size`. Only change alpha, color, texture state, icon, or inner offset.
- Put numeric labels outside very thin bars. If the bar height is under 10px, a text label inside the fill usually looks cramped.
- For dense forms, prefer `font_scale_factor` around `0.7-0.95` for secondary labels and explicit label `size`.
- Do not copy restricted texture paths. Rebuild them as target-pack assets or use verified vanilla `textures/ui/*` paths.

## Data Contract Notes

The multi-feature form router uses hidden title/body/button data and heavy string slicing. Before adapting it:

1. Write a neutral payload contract with prefix, delimiter, and fixed field widths.
2. Name each field by purpose, for example `route`, `tab`, `itemIndex`, `price`, `locked`, `cooldown`.
3. Keep parser controls separate from visible controls.
4. Add a fallback to vanilla `long_form` or `custom_form` when the prefix does not match.
5. Test with short, long, empty, and numeric-only values because JSON UI string math can invalidate unexpected numeric segments.

## Texture Metadata Families

| Pattern | Use |
| --- | --- |
| `ability_texture_state` | ability icon/button state images |
| `browser_tab_texture_state` | browser or tab strip states |
| `window_texture_state` | modal/window frames and panels |
| `item_card_border_state` | item/product card border states |
| `scrollbar_texture_state` | custom scroll track/thumb assets |
| `maze_ui_texture_state` | other UI texture metadata |

Open texture metadata only after the JSON UI file shows that the target design needs that asset state. If a vanilla or target-pack texture can replace it, prefer the replacement and document the new path.
