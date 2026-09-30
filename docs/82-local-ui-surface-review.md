# Local archive review: distinguish the rendering surface

Use this workflow to learn from supplied addon archives while preserving their originals and private provenance. It supplements the folder-based source and local asset tools; those tools do not establish ZIP coverage merely because an archive exists nearby.

## Start with measurable coverage

Record the archive hash, member count and owning manifest before classifying content. Read members as data with CRC/hash checks and bounded decompression. Report nested archives, encryption flags, unreadable text, malformed JSON and resource-limit omissions separately. Do not execute embedded scripts or extract files over a live pack.

`contents.json` metadata containing key fields does not by itself show whether the supplied bytes are readable. Report the observed read/parse outcome separately and retain no key values. Readable source still needs redistribution permission; a private reference collection is not a public asset license.

The 2026-09-30 local review covered 43 supplied archives, including two identical-hash pairs: 41 distinct archive contents and 84 manifest occurrences. All 87,137 file members were CRC/hash checked; 44,122 JSON-family documents and 1,706 script/function files were read. No read, CRC or JSON parsing failure was found within the configured limits. These counts include duplicate archive occurrences. They do not certify Minecraft schemas or runtime behavior.

## Trace entry, display and input separately

| Candidate | Minimum static evidence | What remains separate |
| --- | --- | --- |
| JSON UI screen change | Effective screen override or registered definition, control inheritance/modifications and bindings | Final base-screen merge, input and installed pack order |
| JSON UI model preview | Reached `live_player_renderer`, player client entity, selected render controller, geometry/texture aliases and state selector | The control or BP event supplying input, all renderer instances sharing player state, live appearance |
| Equipped display or guide | Item/conditional owner selector, slot-bound geometry, render resources and reachable animation branches | State producer, input, other viewers and screen-space intent |
| Script form | Actual form construction/show call and its response handling | Custom JSON UI skin, chest appearance and resource-pack routing |

In one directly traced case, an NPC dialogue button invokes an event on the initiator; a player component group supplies a variant; a render controller indexes geometry/texture arrays by that value; JSON UI displays the model through a player renderer. The button input and model display have different owners. Neither the renderer nor the geometry independently establishes click handling.

An equipped tool in another case binds to an item slot and combines common, first-person and third-person animation branches with camera-relative transforms. Its flat cubes and UI-context rotation exception support an equipped model/guide classification. The obfuscated state producer and actual runtime interaction remain unverified. See the attachables skill's [local surface review](../skills/mcbe-attachables-ui/references/local-surface-review.md) before adapting such a graph.

## Prevent inventory false positives and omissions

- Do not require `namespace` in every real screen override. Three reviewed HUD/chat/NPC override files omit it. Locate files relative to the owning pack's `ui/` folder, inspect their modifications and verify the base screen; an absent namespace is not a license to invent one.
- Do not count `textures/ui/` metadata as a screen. The review separately found same-stem nine-slice metadata under a subpack. Registration and parsed structure distinguish it from a control definition.
- Do not classify `q.is_in_ui`, a player override, flat geometry or an attachable folder as proof of GeoUI. Reviewed guards also suppress movement calculations or stabilize paperdoll poses.
- Do not equate an imported form API with an executed form. The full scan found form-name candidates in 29 archives, but only selected construction/input/response paths were manually followed.
- Do not turn same-archive identifiers into a proven installed dependency or `external-or-missing` edges into confirmed defects. Preserve pack, subpack and vanilla boundaries, dynamic conditions and unavailable targets.

The corrected inventory contains 37 JSON UI control/override documents in two archives, including 34 explicit namespaces and three base-screen overrides. Four documents contain a player renderer. Twenty-six archives contain 1,021 attachable definitions. These are structural counts; the review does not label all attachables as UI or all four renderers as independent GeoUI applications.

## Keep evidence local and claims bounded

Keep a private map from a neutral record to the archive/member hashes, manifest, JSON pointer or line range and observed relation. Recheck selected member hashes and the originals before using the result. Public guidance should contain independently written rules and anonymous aggregates, without private filenames, full paths, copied source, texture assets, server IDs or key values.

Report byte coverage, parse coverage, literal reference coverage, manually followed cases and runtime checks as separate results. This review rechecked all 43 original archive hashes unchanged and directly rechecked 19 selected members through 20 evidence records. It did not execute addon code, decode image pixels, launch Minecraft, establish full script semantics or verify runtime appearance and interaction.
