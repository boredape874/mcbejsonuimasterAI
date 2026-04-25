# Token-Efficient Routing

Use this to keep AI context small.

## Rule

Do not load the whole repository for one task.

Load in this order:

1. one router file
2. one topic index
3. one or two exact topic notes
4. source files from the target resource pack
5. external or mirrored references only if the local evidence is not enough

## Minimal routes

| User request | Load first | Then load only if needed |
| --- | --- | --- |
| "what is JSON UI?" | `topics/basics/index.md` | `resource-pack-basics.md`, `docs/23-bedrock-resource-pack-basics.md` |
| layout, anchors, screen size | `topics/basics/index.md` | `screen-size-and-layout.md`, `docs/24-json-ui-layout-units.md` |
| `_ui_defs` or load issue | `topics/foundations/index.md` | `entry-points.md`, target `_ui_defs.json` |
| HUD/actionbar UI | `topics/hud-chat/index.md` | `title-and-actionbar.md`, target `hud_screen.json` |
| PMMP title/actionbar/form UI | `docs/25-pmmp-json-ui-bridge.md` | target `hud_screen.json` or `server_form.json` |
| string split/slice | `topics/logic/index.md` | `string-splitting-and-slicing.md` |
| vanilla texture path | `topics/vanilla/index.md` | `ztech-lookups.md` |
| missing texture or invisible UI | `docs/26-common-failure-modes.md` | exact debugging subtopic |
| merge two packs | `docs/20-pack-merge-playbook.md` | only changed files from both packs |
| broad audit | `docs/08-reference-hierarchy.md` | exact docs selected from the audit finding |
| local example lookup | `docs/28-local-example-mining.md` | only the matching mirror or local folder |

## Do not load by default

- full Mojang `bedrock-samples`
- full Ztech vanilla pack
- all local sample packs
- all schema files
- all external examples

Use `rg` to find exact paths first, then open only the matching files.

## Answer shape

For implementation tasks, the AI should return:

- files changed
- exact reason for each change
- validation command
- remaining warnings or assumptions

For explanation tasks, the AI should return:

- short answer
- exact file/screen names
- one or two source references
- no large copied snippets unless needed
