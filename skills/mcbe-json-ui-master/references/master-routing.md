# Master Routing

## Read first

Read only this routing file first.

If the request is broad or ambiguous, read `../../../docs/27-token-efficient-routing.md` and choose the smallest matching route.

Do not load every docs file by default.

For any task involving local packs, private mirrors, community snippets, community chat notes, sample archives, or reference-derived design work, read `reference-governance.md` before summarizing source usage or adapting code.

For visual tasks involving layout, alignment, spacing, text fit, HUD composition, server-form design, or screenshot matching, read `visual-fit-discipline.md` in this skill first. If a repository checkout exists, also prefer `mcbejsonuimasterAI/docs/54-visual-fit-and-reference-discipline.md` as the fuller project copy.

For visual design direction, read `design-reference-atlas.md` and `diagrammatic-workflows.md` in this skill first. If a repository checkout exists, also prefer:

- `mcbejsonuimasterAI/docs/58-design-reference-atlas.md`
- `mcbejsonuimasterAI/docs/59-diagrammatic-workflows.md`
- `mcbejsonuimasterAI/data/design-reference-index.json`

For broad "which reference should I use?" tasks, read `reference-task-taxonomy.md` and `hierarchical-task-router.md` in this skill first. If a repository checkout exists, also prefer:

- `mcbejsonuimasterAI/docs/55-reference-task-taxonomy.md`
- `mcbejsonuimasterAI/docs/57-hierarchical-task-router.md`
- `mcbejsonuimasterAI/data/reference-task-index.json`
- `mcbejsonuimasterAI/data/reference-hierarchy.json`

For local private reference packs, read `local-json-ui-reference-packs.md` first. Open raw private files only when the matching neutral reference ID is selected, and keep public output at the neutral family/role level.

For `advanced-ui-set` private special-form references, read `advanced-ui-set-special-ui.md` first. If the task is a phone/PDA/device form, also read `special-device-form-patterns.md`. If the task is a polished shop/store, auction, crate, reward, or product-card form, also read `../../../docs/63-premium-form-gallery.md`.

## Route by request type

### planning or intake for a new JSON UI

Use `../../../docs/52-json-ui-intake-questionnaire.md`.
Then route the resulting plan:

- geometry, alignment, spacing, symmetry, image-to-layout -> `mcbe-json-ui-ir-authoring` and `mcbe-json-ui-tools-runner`
- HUD/actionbar/chat data -> `mcbe-json-ui-hud-and-chat`
- server form design or routing -> `mcbe-json-ui-server-forms`
- bindings, parsing, conditions -> `mcbe-json-ui-logic`
- texture/icon choices -> `mcbe-json-ui-vanilla-assets`

If the user did not choose a visual style, offer 2-3 design families from `../../../docs/39-design-recommendation-catalog.md`, `../../../docs/40-server-form-example-index.md`, or `../../../docs/58-design-reference-atlas.md`.

### structure

Use `mcbe-json-ui-foundations`.
Then load:

- `topics/foundations/index.md`
- and only the exact needed subtopic under `topics/foundations/`

### basics, mental model, pack overview, beginner explanation

Use `mcbe-json-ui-basics`.
Then load:

- `topics/basics/index.md`
- and only the exact needed subtopic under `topics/basics/`

For pack basics, layout units, or beginner resource-pack context, prefer:

- `../../../docs/23-bedrock-resource-pack-basics.md`
- `../../../docs/24-json-ui-layout-units.md`

### bindings, variables, parsing, conditions

Use `mcbe-json-ui-logic`.
Then load:

- `topics/logic/index.md`
- and only the exact needed subtopic under `topics/logic/`

For community string splitting, fixed-width slicing, or Unicode byte-width payloads, prefer `topics/logic/string-splitting-and-slicing.md`.

For hardcoded value discovery and binding value limits, prefer `../../../docs/19-bindings-and-hardcoded-values.md`.

For binding dumps, search/filter bindings, form collections, or value-source examples, prefer `../../../docs/34-binding-patterns-value-index.md`.

### HUD, chat, title, actionbar, scoreboard

Use `mcbe-json-ui-hud-and-chat`.
Then load:

- `topics/hud-chat/index.md`
- and only the exact needed subtopic under `topics/hud-chat/`

For individual scoreboard HUD or interactable HUD menus, prefer `topics/hud-chat/personal-score-and-interactable-hud.md`.

For PMMP-driven title/actionbar/chat bridges, prefer `../../../docs/25-pmmp-json-ui-bridge.md`.

For local RPG HUD or multi-bar examples, prefer `../../../docs/28-local-example-mining.md`.

### server form or chest form routing

Use `mcbe-json-ui-server-forms`.
Then load:

- `topics/server-forms/index.md`
- and only the exact needed subtopic under `topics/server-forms/`

For server form visual direction, NPC dialogue style, chest/furnace form look, RPG menu layout, control panel sizing, or design recommendations, prefer `../../../docs/39-design-recommendation-catalog.md`.

For feature-labeled server form examples such as quest window, shop window, stat window, skill window, NPC dialogue, settings panel, chest form, or furnace/process form, prefer `../../../docs/40-server-form-example-index.md`.

For server form search bars that filter `form_buttons` by button text, case-sensitive contains checks, or generated lowercase/character-map input normalization, use `topics/server-forms/search-bar.md`.

For premium multi-route form dispatch, icon rows with loading placeholders, and chest/menu-style form bridges, prefer `../../../docs/53-premium-ui-pattern-reference.md`.

For polished shop/store, auction/listing, crate/reward, city/claim, generic long form, and modal form skins from the restricted neutral design gallery, prefer `../../../docs/63-premium-form-gallery.md`.

For phone/PDA/device special forms, compact routed form suites, reusable button templates, polished shop/store forms, auction/crate/reward forms, battle command panels, database/storage UIs, HUD renderer relocation, and advanced title-flag routers from the `advanced-ui-set` private reference set, prefer `../../../docs/60-advanced-ui-set-special-ui-reference.md`, `../../../docs/61-advanced-ui-set-file-pattern-routes.md`, `../../../docs/62-special-form-device-ui-patterns.md`, and `../../../docs/63-premium-form-gallery.md`.

If a server form request is visual but the user did not choose a style, present 2-3 design directions from `../../../docs/39-design-recommendation-catalog.md` or `../../../docs/40-server-form-example-index.md` before making final visual edits.

### progress bar, chest UI, reusable templates

Use `mcbe-json-ui-patterns`.
Then load:

- `topics/patterns/index.md`
- and only the exact needed subtopic under `topics/patterns/`

For `anim_type`, animation chains, easing values, or JSON UI Dumper animation examples, prefer `../../../docs/33-animation-patterns-and-dumper-values.md`.

For scroll panels, horizontal scroll attempts, or clipped carousel animation, prefer `../../../docs/35-scroll-and-carousel-patterns.md`.

For Dumper-derived values such as `factory`, `collection_name`, `grid_dimensions`, `renderer`, `button_mappings`, `focus_identifier`, `variables`, or `property_bag`, prefer `../../../docs/36-dumper-value-cookbook.md`.

For screen-specific vanilla recipes from HUD, chat, chest, inventory, UI common, or server form, prefer `../../../docs/37-vanilla-dumper-screen-recipes.md`.

For combined patterns such as animated tabs, searchable forms, item icon rows, polished long lists, interactive HUD overlays, or clipped carousels, prefer `../../../docs/38-advanced-json-ui-recipes.md`.

For world loading screens, indeterminate loading strips, HUD progress clipping, boss-bar collection rendering, pocket-safe progress layout, and container/cooking station screens, prefer `../../../docs/53-premium-ui-pattern-reference.md`.

For animated hover text, vertical or circular hotbar, chat command palette, minimap-style interactive HUDs, and private local reference pack patterns, prefer `../../../docs/56-local-json-ui-reference-pack-analysis.md`.

For protocol HUD suites using one title/actionbar payload to feed many components, prefer `../../../docs/60-advanced-ui-set-special-ui-reference.md` and open `references/restricted/advanced-ui-set-ui/restricted-suite-b/ui/phud/phud.json` only if the mirror exists. For vanilla HUD renderer relocation or actionbar fade, use `references/restricted/advanced-ui-set-ui/restricted-suite-c-rp/ui/hud_screen.json` instead.

### bug or rendering failure

Use `mcbe-json-ui-debugging`.
Then load:

- `topics/debugging/index.md`
- and only the exact needed subtopic under `topics/debugging/`

For first-pass triage, prefer `../../../docs/26-common-failure-modes.md`.

### UI plus addon resource linkage

Use `mcbe-json-ui-addon-integration`.
Then load:

- `topics/addon/index.md`
- and only the exact needed subtopic under `topics/addon/`

### vanilla icon or texture path verification

Use `mcbe-json-ui-vanilla-assets`.
Then load:

- `topics/vanilla/index.md`
- and only the exact needed subtopic under `topics/vanilla/`

### "what is the right vanilla source and how do I use it"

Use `mcbe-json-ui-vanilla-assets`.
Then load:

- `topics/vanilla/index.md`
- and only the exact needed subtopic under `topics/vanilla/`

### source selection or external confirmation

Use `mcbe-json-ui-research`.
Then load:

- `topics/research/index.md`
- and only the exact needed subtopic under `topics/research/`

### schema validation or VSCode schema setup

Use `mcbe-json-ui-schemas`.
Then load:

- `topics/schemas/index.md`
- and only the exact needed subtopic under `topics/schemas/`

For direct JSON UI schema URLs, sprite UI schema coverage, screen/type/property catalogues, or comparison against Bugrock JSON UI schema coverage, use `mcbe-json-ui-schemas` and `references/schema-map.md`.

For pack validation scripts and update cadence, prefer `../../../docs/21-update-policy.md`.

### visual editor, builder, or tool-generated UI workflow

Use `mcbe-json-ui-tooling`.
Then load:

- `topics/tooling/index.md`
- and only the exact needed subtopic under `topics/tooling/`

For bedrock-auxgen, JSON-UI-Dumper, or StarLibV2, prefer `topics/tooling/aux-dumper-starlib.md`.

For Dumper animation values, use `../../../docs/33-animation-patterns-and-dumper-values.md` after the tooling note.

For broader Dumper value recipes, use `../../../docs/36-dumper-value-cookbook.md` and `../../../docs/37-vanilla-dumper-screen-recipes.md`.

### curated example archive

Use `../../../docs/28-local-example-mining.md`.
Then load only one matching mirror under `references/local-examples/`, or one exact reference file if the mirror is not enough.

### broad JSON UI example archive

Use `../../../docs/29-mcbe-json-ui-resource-upstream.md`.
Then search `references/upstreams/mcbe-json-ui-resource/` with `rg` and open only one exact tutorial or sample screen.

For focused tutorial files under `Json ui tutorial`, use `../../../docs/49-json-ui-tutorial-index.md` before opening files.

For the private advanced adventure UI reference, use `../../../docs/50-advanced-ui-reference-analysis.md`. Open raw private files only if `references/restricted/advanced-ui-reference/` exists locally.

For the private compact crafting and pocket UI reference, use `../../../docs/51-compact-crafting-pocket-ui-reference.md`. Open raw private files only if `references/restricted/compact-crafting-pocket-ui-reference/` exists locally.

For the private `advanced-ui-set` special UI reference, use `../../../docs/60-advanced-ui-set-special-ui-reference.md`, `../../../docs/61-advanced-ui-set-file-pattern-routes.md`, and `../../../docs/63-premium-form-gallery.md`. Open raw private files only under neutral `references/restricted/advanced-ui-set-ui/monster-rpg-*` or `references/restricted/advanced-ui-set-ui/premium-form-gallery-a/` paths.

### minecraft-bedrock-json-ui-sample archive

Use `../../../docs/32-minecraft-bedrock-json-ui-sample-upstream.md`.
Then search `references/upstreams/minecraft-bedrock-json-ui-sample/` with `rg` and open only one exact RainbowPie, StarLib, NPC, binding, HUD, or scroll file.

### file or code fragment adaptation

Use:

- `../../../docs/30-file-and-code-fragment-usage.md`
- `../../../docs/31-fragment-routing-table.md`

Then open only one matching source file and the target pack file that will be patched.

### merge, audit, or pack migration

Use `../../../docs/20-pack-merge-playbook.md`.
Then inspect only:

- both packs' `_ui_defs.json`
- target changed screen files
- referenced custom utility files
- referenced textures or atlases
