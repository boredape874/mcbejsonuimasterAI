# Prefix-skinned server-form addon

Use this reference when the user wants several form structures and several visual skins in one development addon, selected by title prefixes. Counts, prefix spelling, palettes, and asset roots are inputs from the current request; do not hard-code the example values below into unrelated projects.

## Interpret "one addon" correctly

- Bedrock development packs remain two physical folders: one BP under `development_behavior_packs` and one RP under `development_resource_packs`.
- Treat the linked BP/RP pair as one logical addon. Put all requested layouts and skins in that pair unless the user explicitly requests separate addons.
- Do not create a `.mcaddon`, release archive, extra pack copy, or one pack per layout/skin merely because the user says "one addon". Packaging is a separate request.
- Keep one BP test entry point and one RP routing surface. Verify their manifest UUID dependency and source-to-installed hash parity.

When the user asks for a new `V2` addon while preserving an earlier addon, treat version separation as an acceptance criterion, not a display-name change:

- Inventory the legacy source pair and installed development-pack pair before generating anything. Preserve their folders, manifest UUIDs, versions, script-event prefix, test item, and visible form set unless the user asks to migrate them.
- Give the new BP and RP new folder names, every new header/module UUID, a distinct ScriptEvent prefix, and a distinct test entry item. Never install the new pair over the legacy folder names.
- Report counts separately: legacy layouts, new unique layouts, new skins, new layout-skin combinations, and routed screens. A compatibility route copied into V2 does not make that route a new V2 layout.
- If both RPs override the same vanilla file such as `ui/server_form.json`, model pack priority explicitly. The higher-priority file must route every active BP that needs it, or only one compatible routing RP may be active. A clean single-pack parse cannot prove this two-pack stack.

## Separate layout selection from skin selection

Use an orthogonal title protocol such as:

```text
<project>_<SKIN>_<LAYOUT>_<VISIBLE_TITLE>
```

- `SKIN` selects textures only; `LAYOUT` selects control geometry only.
- Freeze the requested axes before generation: `N` unique geometry contracts and `M` texture skins must yield `N × M` visual combinations. For example, 25 layouts and five skins mean 25 genuinely different geometry definitions and 125 combinations, not five geometries counted once per color.
- Count protocol stages separately from visual combinations. A category/detail layout can require two routed screens for one layout-skin combination; that extra route does not increase the unique-layout count.
- Strip the complete protocol prefix from visible title text. A title without the project prefix should follow the explicitly chosen fallback, usually the vanilla form.
- Keep ActionForm and ModalForm routes distinct. ModalForm inputs and submit/cancel events remain owned by the native custom-form contract.

## Use references for intent, not texture copying

- Measure the supplied screenshots and source pack for hierarchy, proportions, density, icon emphasis, player-render placement, and interaction patterns.
- If the user supplies an asset-library root, copy distributable textures only from that root. Record source path, destination path, hash, and any same-stem nine-slice sidecar.
- Do not copy source-pack textures when the request limits that pack to structural evidence.
- Record prohibited palettes or assets as validation rules. For example, if gold is disallowed, fail the provenance scan on any gold source or destination rather than relying on visual inspection.
- A skin set should be visibly distinct across default surfaces, not only a small accent. Do not assume the only useful palettes are green, red, blue, and purple; search the provided library for neutral, warm, cool, pastel, industrial, or other requested families.

## Button and panel construction

- Use a dark inner button surface when the visual contract calls for MineVille-like readability, but preserve a clearly visible outer frame in the selected skin.
- Read the same-stem JSON metadata for every selected PNG and use its actual `nineslice_size`; do not replace different 7x7, 12x12, or 24x24 assets with one universal margin. Record the applied margin in provenance and compare every emitted image reference against it.
- Check asset role as well as color. Reject a title/pressed texture accidentally reused as a default button when a matching button asset exists; transparent pressed caps and title-sized sources can create oversized bands even when the path resolves.
- Make default, hover, and pressed states independently visible. Place shared icon and label content outside the state-only background subtree so a state change cannot erase them.
- Treat a state texture change with the same semantic controls as styling, not content loss. Flag an error when a label/icon control or its binding disappears, not when only the background texture changes.
- Keep nine-slice borders narrow relative to the button. Explicitly inspect the lower/footer buttons, where an oversized bottom cap is especially noticeable.
- Do not accept a borderless-looking default state merely because hover has an outline. Compare cropped default/hover/pressed pixels and hashes.
- Keep inner surfaces dark enough for icons and multi-line text while avoiding a full-button solid accent fill unless the reference calls for it.

## Actionable controls and growing detail lists

- Inventory every surface that looks clickable. An `image` with a button texture is not a button: actionable controls need `type: "button"`, verified state controls, `button.form_button_click` or the intended event mapping, collection details, and a stable response index. Style non-actionable tabs or headers so they do not promise a click.
- Treat category selection and detail selection as different semantic actions. When one `ActionFormData` payload cannot safely expose two independently owned collections in one screen, use specific subroutes such as `<prefix>_CATEGORY_` and `<prefix>_DETAIL_`; let the BP handle the category response and reopen the detail form while preserving the skin/layout choice.
- For a left selector plus right selected-detail panel, remember that an `ActionFormData` response closes the form and does not mutate arbitrary JSON UI state in place. Reserve stable indices such as `0 = back` and `1 = selected item`; after another left-row index is returned, have the BP reorder that item to index 1 and reopen the same detail route. Bind the right icon/text/action controls to a `collection_panel` that owns `form_buttons` and materializes `collection_index: 1`, while using `#form_text` for the selected item's longer description.
- Keep the long description label outside the `form_buttons` collection owner unless it truly consumes per-item collection data. Mirror the proven server-form body binding shape from the active source pack, commonly `{ "binding_name": "#form_text", "binding_name_override": "#text" }`; do not invent a `binding_type` such as `global` when the working reference does not use it.
- Two visual controls mapped to the same `form_buttons` index produce the same BP response. Define the collision deliberately: for example, a different left-row item changes selection, while either the already-selected row or the right action button performs the selected-item action. Do not claim the BP can identify which of those two visual controls was clicked unless a distinct response index/event path exists.
- A variable-length detail list should use a verified `form_buttons` collection factory inside a vertical `stack_panel`, then place that generated content in `common.scrolling_panel`. Do not generate a fixed number of positioned detail buttons and call it dynamic.
- Force the test fixture beyond viewport capacity so the scrollbar path is exercised. Render at least two fixtures with different items at the reserved selected index to prove the right detail is collection-driven rather than static. Verify the category first/last indices and the detail first/middle/last/cancel responses in Bedrock; a rendered scroll viewport is not click or scroll proof.
- Distinguish a content scrollbar from a ModalForm slider. For a content scrollbar, prove wheel/drag/controller scrolling moves rows and keeps the rail inside the viewport. For a ModalForm slider, preserve the native `custom_form` field/index owner and prove the handle changes `response.formValues`; one working control does not prove the other.

## Match functional regions to decorative regions

- Treat every baked column, rail, card well, and hero frame as a declared content region. A control may span multiple regions only when the background is intentionally unified or the control is clipped to the intended union.
- When a detail list replaces a category rail plus product grid, remove those two split surfaces for the detail route and draw one background over their measured union. Do not leave a visible seam behind one logical list.
- When a player renderer occupies a hero region, avoid adding a second nested panel behind only the lower half unless the reference explicitly contains it.
- For custom/modal forms, do not place the default full-width `generated_contents` stack over a multi-column decorative layout. Keep a valid `custom_form` collection owner, materialize each verified vanilla `server_form.custom_*` field at its intended region with the correct `collection_index`, and preserve sender field order. Then runtime-test text entry, dropdowns, slider, toggle, submit, and cancel.

## Typography, images, and close control

- Measure the reference instead of shrinking content until it fits. Verify title scale, body text scale, line spacing, icon size, and button padding separately.
- Keep title baseline and close control vertically aligned. A practical large-close pattern is a 32x32 hit target with a centered 24-26px X, adjusted from measured evidence rather than copied blindly.
- Give modified labels explicit size, alignment, and font scale. Test Korean text, formatting codes, two-line labels, and long visible titles.
- Render a full-screen state matrix and inspect a consistent crop for every skin and every layout. A texture inventory alone does not prove readable sizing.
- Calibrate fixed logical roots against the smallest supplied Bedrock capture and its GUI scale. Require a measured safe margin on all sides; a centered offline crop can hide a form that clips at runtime because `rootWidth * guiScale` or `rootHeight * guiScale` exceeds the real viewport.

## Engine-backed player rendering

- When the reference shows the player model, prefer a source-supported custom control such as `type: "custom"`, `renderer: "live_player_renderer"`, and a verified property bag such as `#look_at_cursor`.
- Do not replace a requested live model with a 2D icon merely to make an offline preview nonblank.
- An offline renderer must emit `RUNTIME_CUSTOM_RENDERER_UNAVAILABLE` when it cannot execute the engine renderer. Verify model visibility, scale, clipping, pose, cursor tracking, and layer order in Bedrock.

## BP test harness compatibility

- Provide one menu that can reach every layout/skin combination plus direct script-event routes for fast testing.
- Before subscribing, verify both the event object and `typeof signal.subscribe === "function"`. Script API channels vary by version; an unguarded optional signal can abort the whole BP at startup.
- Keep a supported fallback entry point, such as compass item use, when script events may be unavailable.
- Handle canceled responses and defer nested form opens with the available scheduler when required by the current API.
- A JavaScript syntax pass cannot prove Script API availability. Require a clean Content Log after the active world loads the exact BP/RP pair.

## Completion evidence

Before calling the addon complete, require all applicable items:

1. Exact source and installed dev-pack paths exist, with one linked BP/RP identity and no unintended duplicate addon copies.
2. Generated route/layout/screen counts match the requested Cartesian product.
3. Every JSON/JSONC parses; modified JS passes syntax checks; `_ui_defs.json`, namespaces, textures, and manifest dependencies resolve.
4. Provenance confirms the requested asset root and prohibited-asset rules.
5. Default/hover/pressed renders show persistent icon/text content, visible outlines, dark interiors, correct title/X sizing, and distinct layout geometry.
6. Every emitted nine-slice image matches its source sidecar; every button-looking actionable surface has an event path; variable detail fixtures exceed viewport capacity and use a collection-backed scroll view.
7. Runtime-only controls are explicitly unresolved offline rather than silently blank or replaced.
8. The active world actually discovers both packs; direct routes, menu navigation, category/detail transitions, dynamic scrolling, ModalForm input, hover/click, close, player rendering, and response indices work in Bedrock.
9. The target Content Log is clean of relevant UI, texture, and scripting errors. Unrelated log noise is reported separately.
