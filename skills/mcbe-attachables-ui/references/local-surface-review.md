# Classifying an unfamiliar equipped display

Use this reference when learning from an addon, inspecting a private collection, or deciding whether a model is actually an attachable UI. Follow [pack graph](pack-graph.md) for resource resolution and [perspective and state](perspective-and-state.md) for pose changes.

## Follow the surface before assigning a name

1. Locate the manifest and the actual item/attachable definitions. An explicit `item` selector can associate an attachable with another identifier and a conditional owner. Retain its item key, owner condition and slot; matching filenames or attachable identifiers is insufficient.
2. Follow the selected geometry, render-controller aliases and texture, then reachable animation/controller branches. A zero-depth cube or many flat faces can form decorations or a world-space guide. Geometry shape alone does not establish a UI surface.
3. Find the producer of any changing state and its actual input. An item-use handler that opens `ActionFormData` is a script form; it does not make the equipped model clickable. An NPC dialogue button may update a player state later shown by a separate JSON UI renderer.
4. Check the requested perspective, hand and owner. A non-player item owner, player armor and a held tool can require different selectors and poses. Historical selector query spelling found in a sample needs current reference and client validation before reuse.
5. Classify the evidence separately: equipped display, ordinary model, camera-facing guide, JSON UI model preview, or unresolved. Route a confirmed player-renderer preview to `mcbe-geo-ui`.

## Avoid these false conclusions

- `q.is_in_ui` is a rendering-context guard, not a declaration that an attachable is UI. In reviewed local sources it also gates motion accumulation or substitutes a stable preview rotation. Keep that exception when adapting the model.
- Camera distance/rotation queries and `q.bone_orientation_trs` can position or face a model relative to the viewer. They do not prove fixed screen coordinates, correct mouse/touch input, visibility to another player or stable behavior at every camera distance.
- A matching BP item elsewhere in an archive establishes a candidate link. Check manifest dependencies and the installed pack order before claiming the BP and RP form the active pair.
- Script imports and string matches only identify candidates. Follow construction, the show/use call, cancellation and the state write; leave computed or obfuscated paths unverified without executing external code.

## Record a small, reproducible proof

Keep the original archive hash, member path/hash, owning manifest, JSON pointer or line range, and the observed reference chain in a private local report. Distinguish the definition, selected branch, input, producer and reset/cleanup evidence. Mark runtime appearance, other observers, close/unequip and reconnect separately.

A full byte/parse inventory can coexist with only selected semantic case studies. Report both counts. Missing local targets can be supplied by vanilla or another selected pack; unresolved conditions remain unresolved. Do not turn source readability into redistribution permission or copy private names, textures, identifiers or key material into a public skill.

These rules were independently written after a local archive review on 2026-09-30. They are observations and inspection rules, not a claim that those private packs passed Minecraft runtime tests. Repository users can consult `docs/82-local-ui-surface-review.md` for the archive intake and JSON UI override boundaries.
