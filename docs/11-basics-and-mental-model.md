# Basics And Mental Model

This document exists so the AI does not skip the basics that matter in Bedrock work.

## What a Bedrock resource pack is

A resource pack is the client-side pack that supplies presentation data:

- `ui/*.json` for JSON UI
- `textures/*` for UI and item or block visuals
- `font/*` for custom glyphs and font pages
- `texts/*` for language files
- sounds, particles, animations, models, and other client assets

For JSON UI work, the pack is not just a single `hud_screen.json`. The UI usually depends on:

- `_ui_defs.json`
- optional `_global_variables.json`
- screen files such as `hud_screen.json`, `chat_screen.json`, `server_form.json`
- shared templates in `ui_common.json` or `ui_template_*`
- texture paths under `textures/ui/*`
- sometimes item and block atlases

For file-by-file responsibility, also read:

- `docs/15-json-ui-file-role-catalog.md`

## What Bedrock JSON UI is

Bedrock JSON UI is a data-driven client UI system rendered by the Bedrock client.

Primary-source notes:

- Bedrock Wiki `json-ui-intro` states the UI is data-driven and loaded from resource-pack JSON files.
- Bedrock Wiki `json-ui-documentation` is the most detailed public reference for supported element types and many screen-specific properties.
- Bedrock Wiki currently warns that JSON UI is being deprecated in favor of Ore UI. Treat JSON UI as still practical today, but not future-proof forever.

## Core mental model

Use this order when reasoning about any JSON UI task:

1. how the file is loaded
2. which namespace owns the control
3. where the control is inserted
4. what data channel drives it
5. which texture or template it depends on

If one of those is wrong, the UI usually fails even when the JSON syntax is valid.

## Entry files

The minimum files the AI should think about first:

- `_ui_defs.json`
- `_global_variables.json` when variables or shared switches are involved
- the target screen file
- any shared template file referenced by the screen

`_ui_defs.json` is the loading list. If a new JSON UI file is not referenced there, the client does not load it.

## Screens vs templates

Think in two buckets:

- screens: directly rendered by the game, such as `hud_screen.json`, `inventory_screen.json`, `server_form.json`
- templates or shared libraries: reusable controls in `ui_common.json`, `ui_template_*`, or custom utility files

Most real packs combine both:

- a utility file defines a reusable control
- a screen file inserts it with `modifications`

## There is no single fixed Bedrock screen size

Do not teach or assume a fake universal resolution.

Practical rule:

- Bedrock JSON UI runs across multiple window sizes, aspect ratios, and device classes
- desktop authors often preview around `1920x1080`, but runtime is not fixed to that
- mobile touch layouts and pocket-specific states change control availability and spacing
- use anchors, percent values, and resilient offsets instead of designing for one exact pixel canvas

This matters for AI behavior:

- do not say "Bedrock screen size is 1920x1080"
- do say "test for multiple aspect ratios and input modes"

## Common data channels

Bedrock JSON UI often does not read gameplay state directly.

Real pack patterns often drive UI through:

- title text
- actionbar text
- chat text
- view bindings
- global bindings
- factory collections

This is why PMMP and BP code often send encoded strings such as:

- `!topbar:...`
- `customTitle_AniHPBar_75`
- `dialog:bg\tavatar\tline1\tline2\tline3`

## Common failure pattern

If a UI is "not working", check in this order:

1. file not listed in `_ui_defs.json`
2. wrong namespace or wrong control name
3. modification inserted into the wrong parent
4. binding name does not match runtime source
5. texture path missing or wrong
6. the pack depends on another file not copied into the project

## Device and mode caveats

The AI should keep these in mind:

- touch and non-touch UI diverge
- pocket containers differ from non-pocket layouts
- HUD overlays often behave differently from forms
- some controls only make sense in specific hardcoded screens

## Primary source priority for basic answers

For "what is this system" questions, prefer:

1. Bedrock Wiki JSON UI intro and documentation
2. included local sample packs
3. mirrored example repositories
4. Ztech vanilla pack for real file paths and actual vanilla assets

## What the AI should avoid

- inventing a fixed screen resolution
- claiming every property is officially documented
- treating schema validation as runtime truth
- assuming UI files work in isolation from the rest of the resource pack
