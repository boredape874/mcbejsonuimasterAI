# Reference Task Taxonomy

Use this before choosing a source file for any Bedrock JSON UI implementation.

If the local repository checkout exists, prefer the fuller project copy:

- `project-root/docs/55-reference-task-taxonomy.md`
- `project-root/data/reference-task-index.json`

## Quick Route

| User asks for | Open first | Then open |
| --- | --- | --- |
| HUD, RPG HUD, HP/MP/ST bars, actionbar overlay | vanilla `hud_screen.json`; local RPG HUD or animated bar example | target `RP/ui/hud_screen.json` |
| Hotbar relayout | `docs/56-local-json-ui-reference-pack-analysis.md` and vanilla `hud_screen.json` | vertical/circular restricted neutral mirror if present |
| Interactable HUD, minimap, 3D renderer | `docs/56-local-json-ui-reference-pack-analysis.md` | minimap neutral mirror and addon JSON dependencies |
| Chat panel, notification, chat position | vanilla `chat_screen.json`; topbar utility if notification | target `RP/ui/chat_screen.json` and maybe `hud_screen.json` |
| Chat command palette or formatting panel | vanilla `chat_screen.json`; `docs/56-local-json-ui-reference-pack-analysis.md` | command-palette neutral mirror if present |
| Server form, quest, shop, stat, skill, NPC menu | design catalog + server form example index | target `RP/ui/server_form.json` and one feature form |
| Phone/PDA/device special form | `advanced-ui-set-special-ui.md` and `special-device-form-patterns.md` | one neutral `advanced-ui-set-ui/restricted-suite/ui/device_phone/*.json` file |
| Battle/database/storage special UI | `advanced-ui-set-special-ui.md`; project docs 60/61 | one neutral `advanced-ui-set-ui/restricted-suite/ui/creature/*.json` file |
| Protocol HUD suite | `advanced-ui-set-special-ui.md` | `advanced-ui-set-ui/restricted-suite/ui/phud/phud.json` then one component |
| Chest/container/slot menu | chest/container form references | target chest/server form files |
| Loading/progress screen | premium loading pattern + vanilla progress screen if available | target `RP/ui/progress_screen.json` |
| Scoreboard/sidebar/personal score | scoreboard docs and example sidebar | target `RP/ui/scoreboards.json` and maybe `hud_screen.json` |
| Tooltip or hover text | `docs/56-local-json-ui-reference-pack-analysis.md` | animated-hover neutral mirror if present |

## Evidence Requirement

Final answers for implementation must say:

- which taxonomy row was used
- which concrete reference file was opened
- which target file was patched
- what visual-fit checks passed
