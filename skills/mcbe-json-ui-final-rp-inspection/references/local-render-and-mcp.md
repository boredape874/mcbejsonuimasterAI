# Local final-RP renderer and MCP

## Exactness gate

Before measuring text or proposing coordinate changes, collect all of the following:

- an installed vanilla profile with `status: available`, version, fingerprint, and target-RP-first resolution;
- its Minecraft font profile with `status: available`; a system fallback is a blocking `FONT_UNAVAILABLE`, not a substitute;
- pinned, offline upstream compatibility evidence for anchors, imports, nine-slice behavior, and serialization; each required fixture must be committed `baseline-verified` or reviewed `local-capture-verified`, never unresolved `pending-local`;
- the target device profile: viewport, GUI scale, safe area, and logical size;
- a project-bound screenshot calibration ID derived from at least three non-collinear correspondences.

If any item is missing, continue only as diagnosis. Preserve unresolved values and do not claim pixel accuracy, fit text by eye, or guess replacement coordinates.

## CLI

```powershell
node tools/upstream-compat.mjs --strict --captures workspace/upstream-captures
npm run final-rp:render -- <rpRoot> --fixture <fixture.json> --out <preview.png> --viewport 480x270
npm run inspector -- --rp <rpRoot>
npm run mcp
```

Use `--vanilla-root references/upstreams/MCBVanillaResourcePack` when the screen inherits vanilla controls or uses vanilla textures. The target RP stays authoritative.

`final-rp:render` uses the integrated v2 engine by default, auto-discovers installed vanilla/font assets when possible, and records the profile fingerprint in its report. Use `--states`, `--hover`, and `--pressed` for the complete state matrix. Its PNG still does not execute Bedrock or replace screenshot calibration. `--engine legacy` is regression-only.

The fixture uses `title`, `body`, `buttons`, `hoveredIndex`, `pressedIndex`, and `focusedIndex`. Each button record should include its real index, text, texture, and texture file system.

Keep the default fixture's interaction indices `null`. Render each interactive family with an explicit index and require different PNG hashes when its visible state should change. Equal hashes across visibly different default/hover/pressed requests are a renderer or state-dispatch failure, not evidence that the UI is stable.

## MCP tools

- `mcbe_ui_open_project`
- `mcbe_ui_resolve_screen`
- `mcbe_ui_render_screen`
- `mcbe_ui_render_states`
- `mcbe_ui_inspect_control`
- `mcbe_ui_validate_layout`
- `mcbe_ui_validate_state_textures`
- `mcbe_ui_measure_reference`
- `mcbe_ui_compare_screenshot`
- `mcbe_ui_search_examples`
- `mcbe_ui_propose_corrections`
- `mcbe_ui_calibrate_renderer`
- `mcbe_ui_measure_text`
- `mcbe_ui_validate_upstream_compatibility`

Probe the required request, not merely the advertised tool list. A missing dependency, target file, installed font asset, or calibration input blocks the affected evidence level; do not simulate it.

Render a state matrix with `mcbe_ui_render_states`, then validate state textures. Compare an actual Bedrock screenshot only after calibration. Correction proposals must reference server-issued evidence IDs and the current project revision, include old/new values and property origins, and remain read-only until the user explicitly authorizes an edit. Geometry proposals target source IR when it exists.

MCP render output must be outside the RP. External editor exports may be used as pinned compatibility fixtures, never as screenshot calibration or runtime proof.

## Evidence labels

- Resolver or validator only: `final pack structure checked`.
- Local final-RP PNG with all required dependencies resolved: `final-pack static visual`.
- Imported Bedrock screenshots compared and content log clean: `Bedrock runtime verified`.
