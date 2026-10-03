---
name: mcbe-resource-pack-master
description: Build and review Minecraft Bedrock resource packs and addon features spanning JSON UI, attachables, GeoUI, geometry, materials, textures, animations and BP state. Use for cross-layer pack work; route exact UI or rendering requests directly to their specialist.
---

# MCBE Resource Pack Master

Start from the requested result and actual pack entry files. Select one owner, then load supporting skills only when its dependency graph reaches them.

## Evidence first, skill second

Research the real evidence before applying anything written in this skill, and say which step answered:

1. The target pack itself: its `_ui_defs.json`, manifests, the files the request names, and the current Content Log.
2. Pinned official vanilla evidence: the Mojang `bedrock-samples` revision recorded in `references/official/bedrock-samples-ui.lock.json` (UI files committed under `references/official/bedrock-samples-ui`; `resource_pack/attachables`, `resource_pack/entity`, `resource_pack/animations`, `resource_pack/render_controllers`, `resource_pack/models` and `materials` through the local mirror under `references/upstreams/bedrock-samples` or the hash-verified cache from `node tools/design-source-sync.mjs --source mojang-bedrock-samples --download`), then the structural checker `node tools/attachable-inspect.mjs --rp RP --bp BP --vanilla VANILLA_RP --json`, `node tools/material-audit.mjs --rp RP --json` and `node tools/validate-pack.mjs RP --json`.
3. Registered upstream sources and their cards: `node tools/design-library.mjs sources --source ID` and `node tools/design-library.mjs patterns --source ID` for the official docs, Wiki snapshots, schemas and sample addons pinned in `config/design-research-lock.json` (commit-pinned raw URLs for every file), then the repository `docs/`.
4. Only when steps 1–3 do not answer: this skill's own references. Label such guidance "inferred from skill guidance", never "confirmed".

A name, offset, selector or rule found in steps 1–3 overrides this skill. Older third-party references and example packs stay valid pattern evidence; do not delete or rewrite them because a vanilla name moved. Without this repository checkout, follow the same order with the official samples and docs you can reach and report which steps were unavailable.

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

Record the target client and graphics mode, RP/BP roots, entry identifier, state producer, intended input devices, requested artifacts and verification scope. A geometry overlay is not a JSON UI screen: preserve its actual projection, state and input contract. Read [Acceptance](references/acceptance.md) when a task spans several layers. Before adding a player override or a duplicate identifier, read [official and community stacking rules](references/official-and-community-evidence.md): which files replace and which merge, the `min_engine_version` selection rule for duplicate client definitions, Molang version selection per manifest, texture-set and subpack limits.

With this checkout, `node tools/route-task.mjs --intent '<JSON>'` accepts `surface: "resource-pack"`, `"addon"`, `"attachables-ui"` or `"geo-ui"` and exact task kinds. Use `resource-pack`/`addon` for broad ownership, `attachables-ui` or `geo-ui` for the corresponding specialist, and `material`/`outline`/`texture-set` for rendering. JSON UI defaults remain supported.

Verify available tools before invoking them. An authored plan, source pattern, static graph and actual client observation are different evidence. Research and inspection finish at their requested scope; completed implementations require the requested runtime behavior or an explicit pending-runtime result.
