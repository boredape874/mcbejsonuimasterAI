---
name: mcbe-resource-pack-master
description: Build and review Minecraft Bedrock resource packs and addon features spanning JSON UI, attachables, GeoUI, geometry, materials, textures, animations and BP state. Use for cross-layer pack work; route exact UI or rendering requests directly to their specialist.
---

# MCBE Resource Pack Master

Start from the requested result and actual pack entry files. Select one owner, then load supporting skills only when its dependency graph reaches them.

| Primary work | Owner |
| --- | --- |
| JSON UI layouts, forms, HUD or bindings | `mcbe-json-ui-master` or the exact JSON UI specialist |
| Equipped model, first/third person transform or attachable animation | `mcbe-attachables-ui` |
| Player geometry UI, NPC portrait book or GeouiStudio export | `mcbe-geo-ui` |
| Alpha, outlines, material inheritance or PBR texture sets | `mcbe-resource-pack-rendering` |
| RP/BP state, pack identities or stack collisions | [Addon ownership](references/addon-ownership.md) |
| Learn reusable patterns from a supplied asset library | `mcbe-json-ui-samples` and the local asset learner |

Use the selected reference as the next context, not this whole table's dependencies. Existing item/particle specialists may help when installed; their absence must not be reported as a passed validation or an executable tool.

## Establish the feature

Record the target client and graphics mode, RP/BP roots, entry identifier, state producer, intended input devices, requested artifacts and verification scope. A geometry overlay is not a JSON UI screen: preserve its actual projection, state and input contract. Read [Acceptance](references/acceptance.md) when a task spans several layers.

With this checkout, `node tools/route-task.mjs --intent '<JSON>'` accepts `surface: "resource-pack"`, `"addon"`, `"attachables-ui"` or `"geo-ui"` and exact task kinds. Use `resource-pack`/`addon` for broad ownership, `attachables-ui` or `geo-ui` for the corresponding specialist, and `material`/`outline`/`texture-set` for rendering. JSON UI defaults remain supported.

Verify available tools before invoking them. An authored plan, source pattern, static graph and actual client observation are different evidence. Research and inspection finish at their requested scope; completed implementations require the requested runtime behavior or an explicit pending-runtime result.
