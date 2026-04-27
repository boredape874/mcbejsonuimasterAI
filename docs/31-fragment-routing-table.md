# Fragment Routing Table

Use this table to choose the smallest file or code fragment for a task.

## HUD

| Need | Open first | Extract |
| --- | --- | --- |
| Add overlay to HUD | target `ui/hud_screen.json` | `root_panel.modifications` insertion |
| Preserve title payload | `docs/25-pmmp-json-ui-bridge.md` | binding source for `#hud_title_text_string` |
| Add RPG bars | `references/local-examples/rpg-hud/ui/rpg_hud.json` | preserved panels and bar layout |
| Add multi progress bars | `references/local-examples/multi-animated-progress/ui/hud_screen.json` | data source panel and bar control calls |
| Hide raw title text | example `ui/hud_screen.json` | `hud_title_text` visibility binding |

## Server Forms

| Need | Open first | Extract |
| --- | --- | --- |
| Custom action form | target `ui/server_form.json` | form title/body/button bindings |
| NPC dialogue | `references/local-examples/npc-dialogue/ui/server_form.json` | dialogue layout and button item template |
| Quest list form | `references/source-packs/rpg-server-ui-reference/ui/quest.json` | 220x220 panel, 200x171 scroll viewport, 175x40 list buttons |
| Shop form | `references/source-packs/rpg-server-ui-reference/ui/shop.json` | compact shop panel, body text area, 3-column item rows |
| Modern cloud form router | `references/source-packs/modern-cloud-ui-reference/ui/server_form.json` | `customUI_` prefix routing and factory dispatch |
| Modern large shop grid | `references/source-packs/modern-cloud-ui-reference/ui/form/redesign_shop_cloud_action_form.json` | 90%x95% shell, top options, paged item grid |
| Inbox or mail form | `references/source-packs/modern-cloud-ui-reference/ui/form/inbox_cloud_action_form.json` | category rail, search row, scrollable message list |
| Process/machine form | `references/source-packs/modern-cloud-ui-reference/ui/form/food_furnace_cloud_action_form.json` | 55% centered process shell and furnace/machine state image |
| Stat or skill form | `references/source-packs/rpg-server-ui-reference/ui/stat.json` or `references/source-packs/rpg-server-ui-reference/ui/skill.json` | card sizes, icon-backed buttons, compact RPG layout |
| Chest-like form | `docs/18-tooling-auxgen-dumper-starlib.md` | title routing and container substitution pattern |
| Script API form source | `references/local-examples/npc-dialogue/BP/scripts/main.js` | title/body/button data shape only |

## Chat And Notifications

| Need | Open first | Extract |
| --- | --- | --- |
| Topbar notification | `references/local-utils/json-ui-utils/topbar_chat_notification_utils.json` | prefix filter and display control |
| Chat suppression | target `ui/chat_screen.json` | visibility binding that hides protocol messages |
| Actionbar background | local or target `hud_screen.json` | actionbar text panel and texture dependency |

## Scoreboards And Player Lists

| Need | Open first | Extract |
| --- | --- | --- |
| Sidebar reskin | target `ui/scoreboards.json` | sidebar item template and background only |
| Personal score HUD | `docs/17-community-patterns-string-score-hud.md` | player matching and `scoreboard_scored_list_collection` |
| Player list overlay | upstream/local tablist example | `players_collection` grid concept only if reuse is restricted |

## Layout And Controls

| Need | Open first | Extract |
| --- | --- | --- |
| Button preset | `ui/ui_common.json` or tutorial custom buttons | one button template and states |
| Scroll list | example with `common.scrolling_panel` | `$scrolling_content`, grid/list content, scroll size |
| Search/filter UI | `docs/29-mcbe-json-ui-resource-upstream.md` route for Search Bar JSON-UI | text box binding and filtered visibility logic |
| Text input | upstream Text Input Box tutorial | input control and target property binding |
| Tutorial buttons/toggles/sliders | `docs/49-json-ui-tutorial-index.md` | one control template and state controls |
| Tutorial progress bar | `docs/49-json-ui-tutorial-index.md` | `clip_ratio`, bar textures, or animated bar component |
| Tutorial factories/cyclers | `docs/49-json-ui-tutorial-index.md` | factory, draggable, image cycler, or label cycler fragment |

## Textures And Fonts

| Need | Open first | Extract |
| --- | --- | --- |
| Vanilla icon | `docs/13-vanilla-asset-workflow.md` | verified `textures/ui/*` path |
| Custom UI image | example texture folder | image plus `.json` metadata |
| Nine-slice panel | texture `.json` metadata | `nineslice_size`, base image, target texture path |
| Font icon | `docs/23-bedrock-resource-pack-basics.md` | glyph file and text/glyph mapping concept |

## Addon Integration

| Need | Open first | Extract |
| --- | --- | --- |
| UI plus BP script | `docs/25-pmmp-json-ui-bridge.md` or local BP example | payload/form shape, not whole gameplay logic |
| UI plus item/entity assets | `docs/23-bedrock-resource-pack-basics.md` | referenced BP/RP identifiers and texture paths |
| Waypoint-like system | `docs/28-local-example-mining.md` | architecture only unless license is verified |

## How to cite in final answers

Use this format:

```text
Used pattern:
- source: references/local-examples/multi-animated-progress/ui/animated_bar.json
- applied to: ui/my_bar.json
- copied: reusable bar sizing and binding shape
- changed: namespace, texture paths, payload prefix
```

If the source is an ignored upstream mirror:

```text
Used pattern:
- source: references/upstreams/mcbe-json-ui-resource/Json ui tutorial/Search Bar JSON-UI/...
- status: inferred from example archive
- copied into repo: no, only adapted the pattern
```
