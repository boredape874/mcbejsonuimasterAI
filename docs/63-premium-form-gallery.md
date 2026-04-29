# Premium Form Design Reference

Use this when the user wants a polished Bedrock server form rather than a plain vanilla action form.

This reference family is restricted and mirrored only under neutral paths. Do not copy original names, comments, credits, texture paths, or hidden title flags into public output.

## Open Order

1. `data/advanced-ui-set-file-index.json`
2. `docs/60-advanced-ui-set-special-ui-reference.md`
3. `docs/61-advanced-ui-set-file-pattern-routes.md`
4. One restricted neutral file under `references/restricted/advanced-ui-set-ui/premium-form-gallery-a/`

## Main Routes

| Need | Open first | Then inspect |
| --- | --- | --- |
| routed form shell | `premium-form-gallery-a/ui/server_form.json` | route bindings, screen animation, fallback `long_form` |
| shared primitives | `premium-form-gallery-a/ui/common/common.json` | frame, scroll, label, grid, button state templates |
| generic long form | `premium-form-gallery-a/ui/menus/generic/long_form.json` | body panel, button grid, tooltip overflow |
| modal form | `premium-form-gallery-a/ui/menus/generic/modal_form.json` | title/body/action grouping |
| shop/store | `premium-form-gallery-a/ui/menus/other/store.json` | header stats, offers, tabs, product grid, pagination |
| token/currency shop | `premium-form-gallery-a/ui/menus/other/store-tokens.json` | purchase card layout, balance display |
| auction/listing | `premium-form-gallery-a/ui/menus/other/auction_house.json` | item listing, filters, price/status labels |
| crates/rewards | `premium-form-gallery-a/ui/menus/crates/preview_v2.json` | reward grid, preview card, progression variants |
| box/inventory menu | `premium-form-gallery-a/ui/menus/other/boxes.json` | rarity cards, inventory/grid regions |
| city/claim menu | `premium-form-gallery-a/ui/menus/main/city/claim_chunk_menu.json` | compact confirmation/action panels |
| scoreboard/HUD polish | `premium-form-gallery-a/ui/scoreboards.json` | compact sidebar and label styling |

## Design Extraction Rules

- Extract geometry and state patterns, not identity.
- Open `ui/common/common.json` before copying a form pattern. Most menus depend on shared button and scroll primitives.
- For repeated cards, record root size, icon size, label height, and gap before implementation.
- For `form_buttons` usage, document the collection index contract. Many polished forms map specific indices to header, balance, tabs, offer cards, and actions.
- If a texture path points to a restricted asset, replace it with a target-pack asset or vanilla-verified texture before shipping.
- For labels, keep `size`, `max_size`, `font_size`, and `font_scale_factor` explicit. Do not rely on default label sizing.

## Recommended Starting Geometry

| Element | Size |
| --- | --- |
| compact modal | 320-420 wide, 190-260 high |
| shop/store modal | around 380 wide, 200-240 high |
| header row | 18-32 high |
| product card | 70-120 wide, 42-84 high |
| icon | 18-40 square |
| small price/status label | 9-14 high |
| scrollbar | 4-6 wide |

## Common Pitfalls

- Copying only one menu file without `ui/common/common.json`.
- Keeping restricted route flags in script-side form titles.
- Letting product or auction labels exceed the card height.
- Mixing button state textures with different `base_size` or `nineslice_size`.
- Treating every `form_buttons` item as a visible button; some indices are data carriers.
