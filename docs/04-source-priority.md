# Source Priority

Choose authority by claim, then record its revision. For documented property/type names use Microsoft Learn and cross-check pinned Mojang schemas/samples. For actual rendering/input use the target client and Content Log. The source groups below supply different kinds of evidence, not one unconditional ranking.

## 1. Included local packs

Use the included source packs when the task is about their implementation patterns:

- `references/source-packs/modern-cloud-ui-reference/`
- `references/source-packs/farm-ui-variants/`
- `references/source-packs/rpg-server-ui-reference/`

Reason:

- they show concrete Bedrock pack structure; current runtime compatibility still needs evidence
- they reflect the user's target workflow
- they are best for pattern reuse and reverse engineering

## 2. Official Mojang samples

Use Mojang `bedrock-samples` when you need official vanilla JSON UI structure or sample screen files.

Primary upstream:

- <https://github.com/Mojang/bedrock-samples/tree/main/resource_pack/ui>

Use this for:

- `_ui_defs.json`
- vanilla screen file names
- baseline screen structure
- official server form layout references

The pinned sample now also covers `resource_pack/attachables`, `entity`, `animations`, `animation_controllers`, `render_controllers` and `models` (115 non-UI files in the `mojang-bedrock-samples` entry of `config/design-research-lock.json`), so attachable and player-rig names are checked against the same revision as UI names.

### Microsoft creator reference pages

The Microsoft Learn reference pages pinned as `microsoftdocs-minecraft-creator-reference` (`creator/Reference/Content/JsonUiReference`, `AttachableReference`, `VisualReference`, `MolangReference`) carry `ai-usage: ai-assisted` and empty enum tables, and the official schemas repository (`mojang-bedrock-schemas-visual`) repeats their errors. Use them as "documented name exists" evidence only; take types, enums and behavior from the pinned vanilla files and the target client. The tutorial pages (`attachables.md`, `AddCustomItems.md`, `material-files.md`, the Molang guides) are stronger for structure and carry MIT sample JSON. See `skills/mcbe-json-ui-reference/references/official-docs-cross-check.md`.

## 3. Bedrock Wiki

Use Bedrock Wiki for:

- rule explanations
- operator and binding behavior
- best practices
- reusable techniques

Do not treat Bedrock Wiki as a substitute for confirming current vanilla file paths.

The 2026-10-03 snapshot pinned as `bedrock-wiki-entities-visuals` adds the attachable, player geometry, render controller, material and JSON UI pages; most of them carry no per-page license, so cite structure and engine names only.

### Community research repositories

Community name lists such as `hawariii-bedrock-ui-research` are discovery aids. The 2026-10-03 audit found 19 of its 78 binding and button-id names, 41 of its 47 collection names and 8 of its 19 "controls" absent from vanilla 1.26.50 even where the repository marks them confirmed. Cite a name from such a list only after `node tools/vanilla-name-check.mjs <name>` finds it.

## 4. Ztech vanilla resource pack

Use `ZtechNetwork/MCBVanillaResourcePack` as a versioned comparison mirror for vanilla asset lookup. Cross-check the actual target and official Mojang resources; it is not official authority.

Primary upstream:

- <https://github.com/ZtechNetwork/MCBVanillaResourcePack>

Use this for:

- `textures/ui/*`
- `textures/item_texture.json`
- `textures/terrain_texture.json`
- versioned vanilla `ui/*.json` comparisons

## Hard rules

- Do not invent vanilla texture paths.
- Do not treat an old note or screenshot as stronger than an upstream file tree.
- For asset verification, prefer actual target resources and pinned official Mojang evidence over handwritten lists or third-party mirrors.
- For behavior and screen rules, distinguish documented names, pinned implementation evidence, community observations and actual runtime checks. Report official-source disagreements as `unresolved-conflict`.
- Readable source is not redistribution permission. Separate code licenses from bundled Minecraft-derived art.
- For visual guidance use [the selective design library](72-design-library.md); for dated RP/BP traces see [source analysis](73-bedrock-source-review.md). Design guidance never establishes a supported JSON UI property.
