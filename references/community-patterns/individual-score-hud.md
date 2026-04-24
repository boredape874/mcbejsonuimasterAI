# Individual Score HUD Pattern

This is a distilled community pattern for showing one personal scoreboard value on the HUD.

## Server setup

```mcfunction
/scoreboard objectives add myscore dummy "Minecoins: "
/scoreboard objectives setdisplay list myscore
```

The display name should include the label and separator you want next to the score.

## JSON UI idea

The HUD uses:

- `players_collection`
- `scoreboard_scored_list_collection`
- `scored_list_factory`
- current `#gamertag`
- scoreboard `#player_name`

The visible element compares:

```text
#playername = #player_name
```

Then it renders:

```text
#player_list_title + #player_score
```

## Limitations

- practical for one score at a time
- many online/offline player entries can cause lag
- server should clean stale/offline scoreboard entries

## Recommended AI behavior

Before applying this pattern:

1. inspect existing `hud_screen.json`
2. check whether the pack already uses scoreboard UI
3. verify the server can manage the scoreboard objective
4. warn about player-list collection cost
