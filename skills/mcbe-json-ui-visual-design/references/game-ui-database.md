# Game UI Database reference lookup

Use when the user supplies a Game UI Database URL or wants a browsable collection of real game interface examples. Read this reference only for that need; it is not required for binding repairs or every design task.

## Supplied entry

- URL: https://www.gameuidatabase.com/gameData.php?id=208
- Page title observed in a browser on 2026-10-03: **Minecraft Dungeons**.
- The page groups examples by screen function. This entry is a visual reference index, not Bedrock JSON UI code, a measured layout recipe, an open-source asset pack or runtime evidence.
- Access: the text web fetch was blocked; the ordinary browser page was readable. If access later fails, retain the link and mark the current contents unverified rather than claiming to have inspected screenshots.

## Find the relevant screen

Offer the user the original page and direct them to one group matching the task. The following labels were visible on the supplied page; availability may change.

| Requested interface | Relevant labels on the page |
| --- | --- |
| Inventory, equipment, character | Inventory: Browse; Equipping: Overview & Loadout; Change Skin or Accessory |
| Shop, upgrade, crafting | Buying & Trading: Confirm; Upgrade: Inspect & Confirm; Crafting: Browse |
| Adventure map, mission selection | Level Select: World Map; Area Map |
| Rewards, information, confirmation | Modal: Item Get; Modal: Info & Tutorial; Modal: Option & Menu |
| HUD, objective, contextual action | Player Vitals; Objectives: Pinned Mission; Button Prompts (Contextual); Item & Ability Buttons |
| Menu, settings, controller prompts | Title Screen; Settings: Menu; Settings: Options; Button Layouts |

Keep the lookup small: one requested role and one or two relevant screens. Ask for the user's own description of the design decision they want, such as a left inventory grid with a right detail region, and record it as a user requirement. A screenshot label alone does not establish its colors, dimensions, focus order, animation or behavior.

For Bedrock implementation, use the user's requirements, owned assets and separately authorized sources. Select the actual surface (native container, server form, HUD or NPC portrait), identify RP/BP data ownership, measure the target layout and verify input on the target client. The linked game's UI does not establish Minecraft Bedrock bindings or button events.

## Source restrictions and context cost

The page footer explicitly prohibits its content from use pertaining to **AI asset generation, machine learning or cryptocurrency initiatives**. This is a stated restriction, not a redistribution license.

- Keep the URL and this compact lookup guidance as human-facing reference material.
- Do not bulk download, mirror or embed the site's screenshots in this repository or installed skill.
- Do not send its images to image generation/editing, training, fine-tuning, embeddings, learned asset catalogs or an automated design-recipe extraction pipeline. User-supplied copies do not establish permission from the rights holder.
- Do not classify this source as MIT, CC0, open source or a reusable texture library. New permission would need to cover the intended use and the relevant content rights before changing this boundary.
- The categories above are navigation metadata. No screenshot-derived palette, pixel measurements, assets or design recipes were extracted for this reference.

This optional file should be loaded on demand. Store only the selected page, screen role, user-authored requirements and verification gaps in the task context; avoid importing the entire game archive.
