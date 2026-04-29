# Design Reference Atlas

Use this for visual design direction before editing JSON UI.

If the local repository checkout exists, prefer:

- `project-root/docs/58-design-reference-atlas.md`
- `project-root/data/design-reference-index.json`

## Required Design Route

Record these before editing:

- design family
- layout skeleton
- state pattern
- data source
- closest reference
- patch target

## Families

| Family | Use For | Skeleton |
| --- | --- | --- |
| compact RPG panel | stats, skills, quests, guild, craft | fixed center modal, header, compact cards/rows, action row |
| modern cloud panel | inbox, large menus, notifications, recipe/shop | 85-95 percent panel, title bar, scroll body, optional category rail |
| bottom dialogue | NPC/story/quest speech | bottom anchored text panel, optional portrait, choice row |
| item grid shop | shop, kits, rewards, equipment | header/tabs, item grid, detail/action strip |
| HUD status cluster | HP/MP/ST/XP HUD | portrait/icon plus compact bars and labels |
| utility chat sidebar | quick commands, chat formatting | chat screen sidebar with collapsible categories |
| cinematic loading | loading/progress screen | full background with progress bar and label |
| diegetic phone device | phone/PDA/guidebook/profile special forms | fixed shell texture with mapped button regions |
| battle command panel | battle move/action UI | actor cards, move buttons, compact bars |
| storage/database grid | PC/storage/database/team menus | grid/detail split with persistent nav controls |
| high-polish RPG skill board | skill menus, class/ability trees, premium game UI | fixed square shell, manually placed icons, texture-backed controls |
| texture-backed HUD cluster | HP/MP/status HUD, custom hotbar | compact layered bars, slot frames, texture state overlays |

If none fits, choose the closest vanilla-safe family and state the gap.

## Internal Design Reference

For high-polish RPG/game UI direction, read `high-polish-game-ui-reference.md` and inspect the internal high-polish game-ui family:

- `workspace://dev/internal-high-polish-game-ui\ui\skill_ui.json`
- `workspace://dev/internal-high-polish-game-ui\ui\info_ui.json`
- `workspace://dev/internal-high-polish-game-ui\ui\hud_screen.json`
- `workspace://dev/internal-high-polish-game-ui\ui\server_form.json`
