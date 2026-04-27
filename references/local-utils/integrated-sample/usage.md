# Integrated UI Sample Usage

This sample is a source-neutral JSON UI integration pack. It exists to show how several common Bedrock UI patterns fit together without publishing a complete server resource pack.

Included pieces:

- right-side scoreboard replacement
- item hover tooltip background and text
- top-title subtitle display
- NPC dialogue style `server_form` rendering

Included files:

- `ui/_ui_defs.json`: registers the integrated UI files
- `ui/ui_common.json`: shared hover tooltip fragments
- `ui/scoreboards.json`: default and generic scoreboard styles
- `ui/hud_screen.json`: scoreboard insertion and top-title subtitle insertion
- `ui/chat_screen.json`: hides top-title protocol messages from normal chat display
- `ui/form.json`: panels called from `server_form.json`
- `ui/npc.json`: NPC dialogue template
- `ui/server_form.json`: vanilla `server_form` override

## Scoreboard

`hud_screen.json` inserts `dual_scoreboard` from `scoreboards.json` through a `root_panel` modification.

The generic scoreboard assets are intentionally described as target-pack assets:

- `textures/ui/generic/generic_scoreboard_entry.png`
- `textures/ui/generic/generic_scoreboard_entry.json`

## Top-Title Subtitle

Send a chat message with this prefix to display a subtitle at the top center of the screen:

```text
!toptitle:<message>
```

Example:

```mcfunction
tellraw @a {"rawtext":[{"text":"!toptitle:Entered the dungeon"}]}
```

Flow:

- `hud_screen.json` creates subtitle items through `chat_item_factory`
- `subtitle_item` removes the `!toptitle:` prefix and renders only the message body
- `chat_screen.json` and `hud_screen.json` hide the protocol message from normal chat

## Item Hover Tooltip

Attach this fragment to a slot or collection UI:

```json
{
  "hover_tooltip@ui_common.hover_tooltip": {}
}
```

Required collection values:

- `#item_id_aux`: item existence check
- `#hover_text`: actual tooltip text

Rarity prefixes can route the tooltip background:

- `§U`: uncommon
- `§R`: rare
- `§E`: epic
- `§L`: legendary
- `§M`: material
- everything else: common

## NPC Dialogue

The NPC UI is a `server_form` chain:

```text
server form sent by server
  -> server_form.json third_party_server_screen
  -> form.json long_form_replacement
  -> npc.json main_panel
```

Important bindings:

- `#title_text`: dialogue title
- `#form_text`: dialogue body
- `form_buttons`: dialogue buttons

The sample intentionally includes only the minimum NPC form chain. It does not include unrelated menu, shop, or boss form panels.

## Public Reference Policy

Keep this sample source-neutral:

- do not add real pack names, server names, UUIDs, or pack icons
- do not commit binary texture assets unless they are generated specifically for this kit
- keep target-specific textures in the target pack
- keep this folder focused on JSON UI files and texture path conventions
