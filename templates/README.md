# Project Templates

`tools/init-project.mjs` renders these IR files into `workspace/<name>/ir.yaml`.

| Template | Purpose |
| --- | --- |
| `minimal` | Small centered panel and symmetric action row |
| `rpg_hud` | Compact portrait plus HP, MP, DEF, EXP, and currency layout |
| `rpg_menu` | Large asymmetric four-card server-form dashboard |

Templates are layout sources of truth. Add title/actionbar parsing, server-form collections, animations, and target-owned textures only after the generated IR passes the full pipeline.

For the RPG hand-finish structure, data protocol, animation rules, and pack validation workflow, read `docs/67-production-rpg-ui-architecture.md`.
