# NPC portrait books and collections

Select this reference only for `npc_interact_screen` / `actor_portrait_renderer`. A supplied book interface was traced through its item event, per-player page state, NPC spawn, dialogue scene, skin collection, entity geometry and native buttons. Its raw files and audit hashes remain private; the following is a generalized contract, not redistributed source or runtime proof.

## Keep the actual owners

| Layer | Owns |
| --- | --- |
| BP item and script | Opening, selected entry, session owner, entity creation and cleanup |
| NPC dialogue | Scene identity, visible copy, ordered native button commands, close event |
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

Use authored dialogue JSON rather than redistributing a source world's binary structures. Keep ordered semantic button IDs beside the shared entry catalog. An NPC scene may run `/scriptevent` in NPC context; official Script API exposes the NPC as `sourceEntity` and the interacting entity as `initiator`. Validate both against the active per-player session before changing state. Never replace this check with `@p` or a global last-opened player.

Close commands and navigation can arrive near each other. Capture the current NPC/session identity, defer close cleanup where necessary, and invalidate it when navigation replaces the session. Ignore duplicate/stale callbacks. Dispose only addon-owned transient entities on close, death, leave, dimension change and reload; a TTL is a final recovery path, not the normal close mechanism. Do not leave a polling loop running for every historical session.

Decide explicitly whether collection progress belongs to a player or to the world. A scoreboard fake participant shared by every player is global progress even if the current page is saved on each player. Do not infer private ownership from a personal-looking screen.

## Design and verification

Use `mcbe-json-ui-visual-design` for the page hierarchy, native control rectangles and text bounds. Use one shared catalog for BP scenes and RP icons/labels. Keep baked book ornament away from native text and avoid placing a second full panel over a model-rendered page.

For an independently authored integration, inspect `examples/newui-codex/README.md` in the repository. It demonstrates three separate owners: held attachable, NPC model portrait and native JSON UI. Its declared runtime status remains authoritative; an executable example is not a tested-client claim.

Test an ordinary NPC fallback, first/last page, category and selected entry, rapid repeated input, Escape/close, long localized strings, two simultaneous players, disconnect/rejoin, entity cleanup and fresh Content Log. Inspect mouse, touch and controller independently. A renderer lacking actor-portrait support must report that gap; do not replace the portrait with a flat image and label it a final-RP render.

Primary API references: [NPC dialogue](https://learn.microsoft.com/en-us/minecraft/creator/documents/npcdialogue), [dialogue command](https://learn.microsoft.com/en-us/minecraft/creator/commands/commands/dialogue), [script event context](https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/events). The dialogue command requires cheats; make that launch requirement visible in the example instructions.

The NPC screen/control evidence is the [pinned Mojang sample](https://github.com/Mojang/bedrock-samples/blob/46ba6ea985fb5a92d79a9419198f10dda14c199d/resource_pack/ui/npc_interact_screen.json#L1486). Its native `npc_screen` shell selects `npc_screen_contents`; the example overrides that content selection and retains the stock content as its fallback.
