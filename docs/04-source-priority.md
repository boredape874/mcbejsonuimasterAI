# Source Priority

Use sources in this order when answering MCBE JSON UI questions.

## 1. Included local packs

Use the included source packs first when the task is about real implementation patterns:

- `references/source-packs/1seulbi/`
- `references/source-packs/bunnyfarm/`
- `references/source-packs/custom-crops-reference/`

Reason:

- they show working Bedrock pack structure
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

## 3. Bedrock Wiki

Use Bedrock Wiki for:

- rule explanations
- operator and binding behavior
- best practices
- reusable techniques

Do not treat Bedrock Wiki as a substitute for confirming current vanilla file paths.

## 4. Ztech vanilla resource pack

Use `ZtechNetwork/MCBVanillaResourcePack` as the primary authority for vanilla asset lookup.

Primary upstream:

- <https://github.com/ZtechNetwork/MCBVanillaResourcePack>

Use this for:

- `textures/ui/*`
- `textures/item_texture.json`
- `textures/terrain_texture.json`
- current vanilla `ui/*.json` files

## Hard rules

- Do not invent vanilla texture paths.
- Do not treat an old note or screenshot as stronger than an upstream file tree.
- For asset verification, prefer Ztech over any local handwritten icon list.
- For behavior and screen rules, prefer Mojang samples and Bedrock Wiki over guesswork.
