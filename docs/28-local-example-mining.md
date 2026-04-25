# Local Example Mining

Use this when the AI should learn from a local resource-pack archive without loading thousands of files.

## Curated mirrors included in this repository

These small mirrors are copied into `references/local-examples/` because they are useful and compact.

| Mirror | Good for | Start files |
| --- | --- | --- |
| `rpg-hud` | Title-driven RPG HUD, preserved title values, multiple bar instances, icon and bar texture wiring | `ui/rpg_hud.json`, `ui/hud_screen.json`, `ui/animated_bar.json` |
| `npc-dialogue` | `server_form.json` as an NPC dialogue layout, form title/body/button binding, BP script bridge | `ui/server_form.json`, `BP/scripts/main.js` |
| `multi-animated-progress` | Multiple animated progress bars from one title payload pattern | `ui/hud_screen.json`, `ui/animated_bar.json` |

## Local examples to index but not mirror wholesale

Some local folders are useful but should be treated as search targets or pattern inspiration, not as files to blindly copy into a public skill repo.

| Local folder | Why it matters | Handling |
| --- | --- | --- |
| `탭리스트/Tablist_Mobile__PC` | Player list overlay using `players_collection`, touch/non-touch branches, scoreboard key mapping | Do not mirror code wholesale; file header says not to use without permission. Extract concepts only. |
| `웨이포인트/Advanced Waypoints No TP` | Full BP/RP addon with scripts, custom item, entity, render controller, font glyph, and UI forms | Use for addon integration architecture, not JSON UI-only work. |
| `청크경계/Bedrock-Technical-Resource-Pack` | Technical resource pack patterns: particles, render controllers, visual debugging assets | Use for RP/BP visual debugging architecture. Check license before copying. |
| `자바 hud 플러그인/Volya's MMORPG HUD` | Java resource-pack HUD structure, glyph/font HUD and MMO bar ideas | Use as cross-platform design inspiration only; do not convert blindly to Bedrock JSON UI. |
| `폰트 모아두기` | Glyph sheet and icon font assets | Use to reason about `font/` workflows. Verify ownership before redistributing images. |
| `json ui 개발/json ui sample/*` | Large UI packs such as RainbowPie, Déesse UI, VDX Desktop UI, BedrockUi+ | Use only as targeted lookup sources; do not load whole packs. |
| `mcbe ui 위키/mcbe-json-ui-resource` | Tutorial/sample archive with RainbowPie modules and screen controls | Use with `rg` by screen or module name. |

## Search first commands

Set the archive path first:

```powershell
$archive = "<local resource-pack archive>"
```

Then search narrowly:

```powershell
rg --files $archive -g "*.json" | rg "hud_screen|server_form|_ui_defs|animated_bar|scoreboards|npc|tooltip|tablist"
```

```powershell
rg -n "preserved_title|#hud_title_text_string|#form_text|players_collection|scoreboard_players|binding_collection_name" $archive -g "*.json"
```

## Routing rules

- For RPG HUD bars, load `references/local-examples/rpg-hud/ui/rpg_hud.json`.
- For multiple animated bars, load `references/local-examples/multi-animated-progress/ui/hud_screen.json`.
- For NPC dialogue forms, load `references/local-examples/npc-dialogue/ui/server_form.json`.
- For tablist concepts, search the local folder but do not copy code without permission.
- For addon architecture, inspect waypoint BP/RP manifests and scripts only after the task asks for addon integration.

## Pattern notes

### RPG HUD

The `rpg-hud` mirror shows a practical split:

- `hud_screen.json` suppresses raw title packets with bar prefixes.
- `rpg_hud.json` owns preserved title panels and bar layout.
- `animated_bar.json` remains reusable.
- texture metadata under `textures/ui/rpghud/*.json` shows how bar pieces are sliced.

### NPC dialogue

The `npc-dialogue` mirror shows a form replacement pattern:

- `server_form.json` reads `#title_text`, `#form_text`, and `form_buttons`.
- the visual layout is a dialogue card, not a default form list.
- `BP/scripts/main.js` is useful for seeing the data source that drives the form.

### Multi animated progress

The `multi-animated-progress` mirror shows a compact example of:

- preserving a title payload
- using a prefix update string
- passing a data source into reusable bar controls
- composing more than one bar in `hud_screen.json`
