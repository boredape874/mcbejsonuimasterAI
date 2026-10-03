# Hybrid player-form customizer

Use this reference for a character customizer whose projected model stays visible between server-form choices, with optional native form captions and a movement-controlled color palette. This is a source-observed implementation case reviewed on 2026-10-03, not a runtime-verified template or a reconstruction of the reference video's internals.

## Evidence and scope

The implementation was traced through its generator, solved IR, RP/BP manifests, exported UI, player definitions, render controllers, materials, script sessions and failure reports. Its target player baseline was extracted read-only from Bedrock 1.26.52, resource layer `vanilla_1.21.130`; its script manifests selected `@minecraft/server` and `@minecraft/server-ui` 2.0.0. These are case versions, not recommended minimums for another project.

The repository's official UI pin is separately `bedrock-samples` v1.26.50.4, commit `46ba6ea985fb5a92d79a9419198f10dda14c199d`, recorded in `references/official/bedrock-samples-ui.lock.json`. That pin establishes vanilla form names and the inventory's `live_player_renderer`; it does not substitute for the target client's player animation state. See [renderer evidence](renderer-and-rig-evidence.md) and [integration acceptance](integration-and-acceptance.md).

| Evidence | What it supports | What it does not support |
| --- | --- | --- |
| Generated pack and script source | File graph, ordered responses, transforms, property producers and cleanup paths | Client input dispatch, variable sharing or shader execution |
| User captures and Content Log | Earlier exposed edges, rainbow-textured hair, actorless query errors, missing material and collection context errors | Acceptance of subsequent patches |
| Solved IR, numeric layout tests, script mocks and archive/install parity | Bounded coordinates, session logic and exported bytes | Final font metrics, cursor behavior or pixel agreement in Bedrock |
| Official docs linked below | Documented query/input names and UV atlas mechanism | Compatibility of this whole customizer on every client or graphics mode |

The case retained `runtimeVerified: false`. Its final patches still need a restarted client, fresh Content Log and actual interaction/capture evidence. Keep that status when reusing this case.

## Ownership graph

| Layer | Responsibility |
| --- | --- |
| BP player properties | Client-synchronized open/stage, draft appearance, palette coordinates and projection calibration |
| BP script | Session ownership, ordered ActionForm responses, palette input, commit/cancel and recovery |
| HUD `live_player_renderer` | Projects the custom scene independently of each ActionForm lifetime |
| RP player definition | Adds geometry/texture/material aliases, pre-animation state and conditional custom render controllers while preserving the target player baseline |
| Geometry + textures | Background planes, option artwork, character/body/hair, selection outlines and palette cursor |
| Routed server form | Transparent clickable regions and optional native JSON UI labels |

This case used a player renderer, not an equipped-item attachable. Neither geometry nor an attachable supplies a clickable region by itself. Identify the actual renderer before selecting a recipe.

The UI was also not one flattened screenshot: flat frame/foreground textures were mapped to geometry planes, body/hair used separate cuboid geometry and textures, and selection/cursor layers changed independently. PNG and ZIP compression can make flat artwork small; package bytes do not measure texture memory or prove missing artwork. [Official resource-usage guidance](https://learn.microsoft.com/en-us/minecraft/creator/documents/practices/improvingperformanceandresourceusage?view=minecraft-bedrock-stable)

## Catalog form and visible continuity

1. Create a player-scoped session containing the saved original and a separate draft. Apply draft appearance and calibration, then set the Geo open flag.
2. Send an ActionForm with a project-owned title token and one stable, ordered button list. The case had 29 responses: 12 hairstyles, 9 preset colors, 5 skin tones, 2 gender choices and NEXT. Locked choices remained in the index map and were rejected by the script.
3. Route only that token to custom inner content. Preserve the vanilla outer screen, the fallback ActionForm and the complete ModalForm route. Register all custom UI files in `_ui_defs.json`.
4. A choice resolves `form.show()`. Validate the response against the current session and index map, apply the new draft, wait one tick and send the input form again. Do not reset the Geo open flag during that loop.
5. On catalog cancel, invalidate the session, clear the Geo flag and restore the saved original. Bound `UserBusy` retries; delayed responses must not affect a replacement session.

The HUD scene is designed to bridge that reopen interval. This is not a persistent ActionForm or proof of live updates inside one open form; native captions attached to the form may disappear briefly during reopening. [ActionForm response contract](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/actionformdata?view=minecraft-bedrock-stable)

The desktop source adjusted `is_showing_menu`, `absorbs_input`, `should_steal_mouse`, `render_game_behind`, `force_render_below` and screen animations so the input form could coexist with the HUD scene. Treat those values as source-observed settings: confirm cursor, layer order and input on the actual profile rather than promising that one flag alone exposes the mouse. The touch export also existed, but its interaction was not verified.

## Collection ownership and native captions

The input route uses `form_buttons`, `collection_index`, the collection-details binding and `button.form_button_click`. Preserve the sender's order even when buttons are split into left- and right-anchored groups.

The failing export had an intermediate plain sizing panel and the Content Log reported `#collection_index` errors. The revised export made each sizing extent a `collection_panel` with `collection_name: "form_buttons"`, and placed its indexed buttons directly under that owner; acceptance of the correction is still pending. A plain outer panel can group those extents; do not insert one between the verified collection owner and its indexed items without evidence that context survives.

Native captions are separate `type: "label"` controls in ordinary sizing panels. They are not extra BP `.button()` calls and do not consume response indices. The case moved eight catalog captions out of the frame texture into the routed form, with `localize: false`, `font_size`, `font_scale_factor` and explicit bounds. It retained bitmap text on the form-free palette stage.

Use the same solved rectangles for artwork, hitboxes, captions and debug outlines. A debug route can draw response indices and borders over the transparent buttons, but a visible border is not click dispatch. Do not make the preview's substitute bitmap font evidence that native labels fit: the final-RP diagnostic had `FONT_UNAVAILABLE` and unresolved native safe-zone/binding values.

## Projection, aspect ratio and background coverage

Measure the game viewport inside the supplied capture first. Remove video letterboxing from the measurement; do not infer aspect ratio from the recording's outer size. Record the requested GUI scale and renderer calibration separately. The script in this case used a saved desktop calibration, not a live viewport-measurement API.

For an authored reference `Wr × Hr` and viewport `Vw × Vh`, use one height-derived content scale `s = Vh / Hr`. Right-anchored catalog/palette content uses `left = Vw - Wr * s`; NEXT is anchored independently at the left and the title at the center. A fixed-width right panel leaves the remaining width for the character scene. Convert those same rectangles to form offsets/sizes and geometry transforms; in the case, the form extent width was `(Wr / Hr) * 100%y` at full viewport height.

Do not stretch icons, character geometry, text and hitboxes independently to fill the screen. If a projection/safe-area mismatch leaves an exposed edge, extend an opaque background plane beyond the viewport while preserving its content transforms. The catalog background was extended on all sides; the palette's right background kept its left split boundary and extended right/top/bottom. The case used 8% horizontal and 4% vertical overhang after an observed 8-pixel edge gap. Those percentages are case choices, not universal calibration constants.

Numeric tests covered six viewport ratios and foreground/background alignment, including an ultrawide case and the user's capture dimensions. This supports the authored transforms only. Actual coverage, small-screen clipping, native text bounds and hitbox alignment still require Bedrock captures at the supported GUI scales. Do not mark a layout fixed solely because a software preview fills its canvas.

## Actorless previews and target player compatibility

Preserve the target `player.entity.json` initialize/pre-animation arrays, perspective branches, animation aliases and controllers before appending custom state. In this case an older public player baseline lacked the target client's `variable.melee_spear_equipped` producer, while native controllers already consumed it. A guessed default or a copied old player definition is not an equivalent repair.

The Content Log also showed actor-dependent queries in a skin preview without an actor. The revised source branches on UI context before any local-player/property query: gameplay rendering samples custom properties; UI rendering retains a cached variable or a default. Its expression shape was:

```text
v.ui_open = q.is_in_ui
  ? (v.ui_open ?? 0)
  : (q.is_local_player
      ? (q.has_property('example:ui_open') ? q.property('example:ui_open') : 0)
      : 0);
```

This is a source-observed workaround, not a general actor-validity test. `q.has_property` and even `q.is_local_player` can fail in the actorless context; `??` supplies missing variable defaults, not a query-error handler. The expression tests translated a bounded subset to JavaScript to check branch evaluation; they did not execute the Molang engine or prove that world and live UI renderers share the cached variables.

The custom render gate combined `q.is_in_ui` with the cached open flag and stage. `q.is_in_ui` identifies UI rendering, not this menu's screen ID, so inspect inventory, skin previews, paper dolls and another player's view for leakage. If the actual live renderer does not share the state, trace its entity/transport and select a supported producer rather than stacking more fallback queries. [Official UI-context query](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/molangreference/examples/molangconcepts/queryfunctions/query_is_in_ui?view=minecraft-bedrock-stable), [Molang variables and coalescing](https://learn.microsoft.com/en-us/minecraft/creator/documents/molang/syntax-guide?view=minecraft-bedrock-stable)

## Form-free movement palette

NEXT lets the catalog ActionForm finish, leaves the Geo scene open and selects the palette stage. No form remains open to capture movement input. This follows the user's confirmed interaction: WASD moves the palette point, Jump confirms and Sneak cancels; it is not mouse-hover color sampling.

- Poll `player.inputInfo.getMovementVector()` while that session owns the palette. Normalize diagonal motion, clamp coordinates and update synchronized integer coordinates only when the selected cell changes. The case maps positive strafe X to decreasing screen X; verify axis direction on the target device.
- Use `world.afterEvents.playerButtonInput` for Jump/Sneak press transitions. Require both buttons to be released after entry before arming confirmation/cancel, so a held entry input cannot accidentally save.
- Before disabling Camera/LateralMovement/Jump/Sneak permissions, snapshot their exact previous booleans and persist recovery data. Stop the interval and restore those values on every exit, error, death, disconnect/reconnect and script reload; never restore all permissions to `true` unconditionally. The case left other categories untouched. Receiving raw input while permissions are disabled remains a client acceptance check.
- Jump commits the complete draft and closes the session. Sneak restores the appearance from palette entry and returns to the catalog, retaining earlier hairstyle/skin draft edits. Catalog cancel restores the last committed profile.
- Check session identity after every awaited form/palette operation, and clear the interval during cleanup. Use server-side validation for locked choices and stored values independently of displayed highlights.

[Official InputInfo API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/inputinfo?view=minecraft-bedrock-stable) documents movement and button reads and recommends the input event for short press transitions. The source's mocks verified save/cancel, stale replies and permission restoration; they did not verify real keyboard, controller or touch input.

## Hair color and materials

Preset colors in the revised source select actual precolored hair textures. Changing a selection outline alone is not proof that the model's color changed. The custom palette instead generates a shared RGB table and repeats each table color over one atlas cell; geometry/texture selection and palette cursor use the same integer coordinates.

The case table was 128 × 128 colors with 8 × 8 texel cells in a 1024 × 1024 atlas. For cell `(x, y)`, atlas side `A` and cell size `c`, the export samples inside the cell using `offset = [(x*c + 0.5)/A, (y*c + 0.5)/A]` and `scale = [(c-1)/A, (c-1)/A]`. These values rely on that geometry's UV range; do not reuse them for an unrelated model or assume that sampling a point equals tinting the material.

The connected path must include the client material alias, texture alias, material definition and render controller:

```json
"example_hair_uv:entity_alphatest": {
  "+defines": ["USE_UV_ANIM"]
}
```

The official atlas recipe requires a material with `USE_UV_ANIM` and the controller's `uv_anim.offset`/`scale`. This fragment belongs inside a complete material document, not directly in the client entity. [Official atlas mechanism](https://learn.microsoft.com/en-us/minecraft/creator/documents/practices/improvingperformanceandresourceusage?view=minecraft-bedrock-stable)

The earlier custom shader path displayed the whole rainbow atlas on the hair. The latest source changed the hair material to the native `entity_alphatest` inheritance with `USE_UV_ANIM`, and set `ignore_lighting` on its render controller. That patch was exported and structurally checked, but its final in-game color was still unverified. Do not present that combination as a universally working shader fix.

A separate missing-material failure led the generator to emit the definitions at `materials/entity.material`, matching the inspected GeouiStudio pattern, instead of relying on an arbitrary custom filename. Check loaded definitions, alias spelling and the current log before concluding that every material filename is interchangeable. Older material shader keys and graphics-mode support remain separate issues; a material-audit pass cannot prove sampling or brightness.

## Reuse and acceptance

Keep authored configuration, artwork generation, scene transforms, script state and solved IR as the sources of truth. Regenerate RP/BP and archives after source edits; compare archive members and installed files before testing. Preserve original assets, current player definitions and unrelated pack owners. A source-observed structure does not authorize redistribution of third-party art or extracted vanilla client files.

Before claiming this feature works, collect:

1. A fresh client load and Content Log with no new custom UI/Molang/material errors.
2. Game captures proving viewport coverage, native font bounds, visible cursor and hitbox/debug agreement at supported ratios/GUI scales.
3. Repeated selections proving the model changes while the scene remains visible, with form-reopen behavior stated accurately.
4. Palette motion, live hair sampling, Jump save, Sneak return, catalog cancel and the exact input-permission restoration path.
5. Death, reload, reconnect, stale-response and multiplayer tests, plus inventory/paper-doll and normal-player rendering checks.

Report structural checks, mock tests, software previews, archive/install parity and actual client evidence separately. Outstanding external vanilla graph edges, legacy material warnings and unresolved offline fonts remain visible; do not change tests or hide diagnostics to call the prototype complete.
