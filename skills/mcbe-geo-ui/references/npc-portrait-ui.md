# NPC portrait books and collections

Select this reference only for `npc_interact_screen` / `actor_portrait_renderer`. A supplied book interface was traced through its item event, per-player page state, NPC spawn, dialogue scene, skin collection, entity geometry and native buttons. Its raw files and audit hashes remain private; the following is a generalized contract, not redistributed source or runtime proof.

## Keep the actual owners

| Layer | Owns |
| --- | --- |
| BP item and script | Opening, selected entry, session owner, entity creation and cleanup |
| NPC dialogue JSON or persisted NBT Actions | Visible copy, ordered native button commands and close event; identify the actual loader |
| NPC client entity | Book geometry, atlas, render controllers, opening/page animations |
| JSON UI | Portrait placement, text, button hitboxes, focus and exit |
| Optional attachable | Equipped book appearance; it is separate from the NPC model |

`live_player_renderer` is not a substitute for `actor_portrait_renderer`. Neither renderer makes geometry itself clickable. Do not copy a player entity, a whole HUD, source namespaces or binary structures into an unrelated addon.

## Resolve the portrait contract

1. Inspect the version-matched vanilla NPC screen and its actual inherited control path. Preserve its normal screen and creator/student behavior outside the new route.
2. Trace `skins_collection` → materialized `collection_index` → collection `#skin_index` → portrait renderer. Separately trace BP `minecraft:npc.npc_data.skin_list` and the client render-controller texture/geometry selector. An index is not universally the same as a variant value.
3. Inspect world visibility separately. A verified pattern has an ordinary invisible skin and an explicit portrait skin. `q.is_in_ui` alone neither identifies the dedicated screen nor proves that a particular NPC renderer supplies the query as expected.
4. Trace `student_buttons_collection` indices and its `collection_details` prefix to `button.student_button`; trace close and cancel to `button.exit_student`. Use the actual vanilla bindings, not server-form names such as `#form_button_text`.
5. Keep protocol text out of visible labels. Restrict custom routing to one exact owned title/token and retain the vanilla path for unrelated NPCs.

The portrait rectangle, model scale, camera target and bone transforms jointly determine screen placement. A 500-unit portrait or a source model's offset is a calibration sample, not a portable screen size. A static model screenshot cannot establish alignment of native button hitboxes over the projection.

## Dialogue and session lifecycle

Distinguish **JSON dialogue scene loading** from **persisted NPC NBT Actions**. The reported client rejects more than six buttons in `dialogue/*.json`; that observation does not establish a six-button limit on every NPC transport. The inspected reference contains 972 NPC structures with ten `mode: 0` buttons plus one `mode: 1` close action. Its script loads a structure and calls `dialogue open <npc> <player>` with no scene name. Check the actual imported `student_buttons_collection` and target-client behavior before claiming an upper limit.

For the NBT route, generate an original uncompressed little-endian `.mcstructure` with an NPC `Actions` **string** containing the action JSON array. The observed command action is `{button_name, data: [{cmd_line, cmd_ver: 38}], mode, text, type: 1}`. Button mode is `0`; close mode is `1` and does not consume a visible button index. The saved dialogue field is spelled **`InterativeText`**, not `InteractiveText`; `RawtextName` supplies the dialogue title. Keep semantic action IDs in catalog order and verify the RP index-to-command mapping. Passing a scene name to `dialogue open` selects the JSON scene path again.

Build only the entity template you own: empty block layers, consistent `Pos`/`structure_world_origin`, owned identifier/tags and original text/commands. Do not carry over a source world's `UniqueID`, inventories, properties or other entities. Whether a minimal generated entity (including omission of `UniqueID`) imports correctly is a target-client check; an NBT round trip does not prove it. `StructureManager.place` returns no entity and can queue unloaded chunks: check the loaded anchor, place with `includeBlocks: false`, compare the exact before/after entity IDs and adopt exactly one new owned candidate. Do not select a nearest existing NPC or modify world blocks to discover the result.

Validate the BP entity against its declared `format_version` as well as the UI. For an invulnerable NPC authored at `1.21.100`, use `minecraft:damage_sensor.triggers[].deals_damage: "no"`: the reported target rejected boolean `false` as an invalid schema type. The [damage sensor reference](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_damage_sensor) lists both legacy/alternate fields and string choices; do not infer target support from an unversioned example. A scene load error must be fixed before diagnosing its downstream open failure as a script timing problem.

If placement and `dialogue open` succeed but no screen appears, compare their tick ordering with the working source. The inspected book waits one tick after placement before opening. Record the actual placement and command ticks; [`runTimeout(1)`](https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/system-run-guide) can run in the current tick outside a `system.run` callback. Claim the exact new NPC before deferring, then recheck player, dimension, NPC and immutable session before opening. Keep the claim pending through that callback so duplicate input cannot replace it. Neither a one-tick delay nor command success proves client display; do not add repeated opens without evidence.

Use authored scene JSON when its loader fits, or independently generated NPC structures when the inspected NBT transport is required. Keep ordered semantic button IDs beside the shared entry catalog. NPC commands may run `/scriptevent` in NPC context; official Script API exposes the NPC as `sourceEntity` and the interacting entity as `initiator`. Validate both against the active per-player session before changing state. Never replace this check with `@p` or a global last-opened player.

Close commands and navigation can arrive near each other. Capture the current NPC/session identity, defer close cleanup where necessary, and invalidate it when navigation replaces the session. Ignore duplicate/stale callbacks. Dispose only addon-owned transient entities on close, death, leave, dimension change and reload; a TTL is a final recovery path, not the normal close mechanism. Do not leave a polling loop running for every historical session.

Decide explicitly whether collection progress belongs to a player or to the world. A scoreboard fake participant shared by every player is global progress even if the current page is saved on each player. Do not infer private ownership from a personal-looking screen.

## Design and verification

Use `mcbe-json-ui-visual-design` for the page hierarchy, native control rectangles and text bounds. Use one shared catalog for BP scenes and RP icons/labels. Keep baked book ornament away from native text and avoid placing a second full panel over a model-rendered page.

For an independently authored integration, inspect `examples/newui-codex/README.md` in the repository. It demonstrates three separate owners: held attachable, NPC model portrait and native JSON UI. Its declared runtime status remains authoritative; an executable example is not a tested-client claim.

Test an ordinary NPC fallback, first/last page, category and selected entry, rapid repeated input, Escape/close, long localized strings, two simultaneous players, disconnect/rejoin, entity cleanup and fresh Content Log. Inspect mouse, touch and controller independently. A renderer lacking actor-portrait support must report that gap; do not replace the portrait with a flat image and label it a final-RP render.

Primary API references: [NPC dialogue](https://learn.microsoft.com/en-us/minecraft/creator/documents/npcdialogue), [dialogue command](https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/dialogue), [StructureManager](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/structuremanager), [script event context](https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/events). The dialogue command requires cheats; make that launch requirement visible in the example instructions.

The NPC screen/control evidence is the [pinned Mojang sample](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/npc_interact_screen.json#L1486). Its native `npc_screen` shell selects `npc_screen_contents`; the example overrides that content selection and retains the stock content as its fallback.
