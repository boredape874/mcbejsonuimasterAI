# Animation Patterns And Dumper Values

This document tells the AI how to use Bedrock JSON UI animations from vanilla dumps, local packs, and sample archives.

## Source priority

| Need | Preferred source |
| --- | --- |
| vanilla HUD/title/actionbar animation behavior | `references/verified-samples/bedrock-samples-ui/hud_screen.json` |
| common screen entrance/exit animations | `references/verified-samples/bedrock-samples-ui/ui_common.json` |
| scroll bar fade animation | `references/verified-samples/bedrock-samples-ui/ui_common.json` |
| reusable progress bar size animation | `references/local-examples/rpg-hud/ui/animated_bar.json` or `references/sample-packs/rpg-server-ui-reference/ui/animated_bar.json` |
| easing comparison and play/reset event pattern | `references/reference-mirrors/minecraft-bedrock-json-ui-sample/json ui 개발/ui/sample UI suiteUI/ui_extras/settings_sections/general_section_controls.json` |
| toast pop animation | `references/reference-mirrors/minecraft-bedrock-json-ui-sample/json ui 개발/ui/sample UI suiteUI/ui_extras/toast_screen_controls.json` |
| vanilla-like page transition offsets | `references/reference-mirrors/minecraft-bedrock-json-ui-sample/json ui 개발/ui/sample UI suiteUI/ui_extras/start_screen_controls.json` |

## Animation object shape

Animation definitions use `anim_type` instead of `type`.

For animation-heavy form and HUD examples from the restricted neutral reference family, also use `docs/64-motion-form-hud-reference.md`. It indexes the closest files for ability carousels, shop/purchase popups, reward overlays, HUD cooldowns, progress clipping, and flip-book icons.

Common fields seen in the sources:

| Field | Meaning |
| --- | --- |
| `anim_type` | animated property or special animation type |
| `from` | starting value |
| `to` | ending value |
| `duration` | seconds, or a variable resolving to seconds |
| `easing` | interpolation curve |
| `next` | animation to run after this one |
| `play_event` | event name that starts the animation |
| `end_event` | event emitted when the animation completes |
| `destroy_at_end` | control name to destroy when the animation ends |
| `initial_uv`, `frame_count`, `frame_step`, `fps`, `reversible` | flip book animation fields |

## `anim_type` routing

| `anim_type` | Best source example | Typical use |
| --- | --- | --- |
| `alpha` | `bedrock-samples-ui/hud_screen.json` | title/actionbar fade in/out, background fade |
| `offset` | `sample UI suiteUI/.../general_section_controls.json` | sliding panels, easing tests, toast offsets |
| `size` | `local-examples/rpg-hud/ui/animated_bar.json` | progress bar growth/shrink |
| `wait` | `bedrock-samples-ui/hud_screen.json` | chain delay between fade in and fade out |
| `flip_book` | `bedrock-samples-ui/hud_screen.json` auto-save animation | sprite-sheet frame animation |
| `uv` | community reference docs and vanilla image examples | moving or swapping UV region |
| `aseprite_flip_book` | `references/mirrors/bedrock-wiki-json-ui/aseprite-animations.md` | Aseprite exported sprite sheets |
| `color` | community reference docs documentation | color interpolation |

## Applying an animation

There are two common attachment styles.

Property animation:

```json
"alpha": "@hud.anim_actionbar_text_alpha_out"
```

Element animation list:

```json
"animation_reset_name": "my_reset_event",
"anims": [
  "@my_namespace.my_animation"
]
```

Use property animation when the target property is exactly what should animate. Use `anims` when the element should run one or more named animations and you need `animation_reset_name`, `play_event`, or grouped control behavior.

## Chain pattern

For fade in, hold, fade out:

1. `alpha` from `0` to `1`
2. `wait`
3. `alpha` from `1` to `0`
4. optional `end_event` or `destroy_at_end`

Confirmed source:

- `references/verified-samples/bedrock-samples-ui/hud_screen.json`

## Progress bar pattern

For animated progress:

1. keep current and previous values in a data source panel
2. compare `#changed_value` and `#prev_value`
3. use a `collection_panel` factory to spawn a one-shot animation when the value changes
4. animate `size`
5. use clipping for non-nine-slice fixed textures

Confirmed source:

- `references/local-examples/rpg-hud/ui/animated_bar.json`
- `references/sample-packs/rpg-server-ui-reference/ui/animated_bar.json`

For server form body driven progress using `#form_text`, numeric prefixes, and `#clip_ratio`, use:

- `docs/47-custom-auxid-and-form-progress.md`

## Maze Reference Animation Values

For animation-heavy form and HUD work, `docs/64-motion-form-hud-reference.md` indexes the closest restricted files. The main reusable values are:

| Use | Value |
| --- | --- |
| horizontal ability carousel stabilization | `anim_type: "offset"`, `from: ["-50%", 0]`, `to: ["-50%", 0]`, `duration: 1` |
| location/status flip book | `anim_type: "flip_book"`, `frame_count: 12`, `frame_step: 32`, `fps: 12` |
| glitch/status flip book | `anim_type: "flip_book"`, `frame_count: 4`, `frame_step: 16`, `fps: 2` |
| XP/effect/progress fill | foreground image with `clip_ratio` and explicit fixed bar size |

## Easing values seen in samples

The sample UI suite sample includes a practical easing test list:

```text
linear, spring,
in_quad, out_quad, in_out_quad,
in_cubic, out_cubic, in_out_cubic,
in_quart, out_quart, in_out_quart,
in_quint, out_quint, in_out_quint,
in_sine, out_sine, in_out_sine,
in_expo, out_expo, in_out_expo,
in_circ, out_circ, in_out_circ,
in_bounce, out_bounce, in_out_bounce,
in_back, out_back, in_out_back,
in_elastic, out_elastic, in_out_elastic
```

Treat these as sample-observed values. If version safety matters, confirm in the target Minecraft version by testing in game.

## Dumper workflow

For production-style examples of `flip_book`, world loading bars, HUD progress clipping, and server-form loading placeholders, also use `docs/53-premium-ui-pattern-reference.md`. Treat it as a pattern summary; rebuild with neutral names and target-pack assets.

When using JSON UI Dumper or a dumped vanilla UI archive:

1. search for `anim_type`
2. find the control that references the animation with `@namespace.name`
3. copy the relationship, not just the animation block
4. keep the namespace and referenced control names consistent
5. test in game because a syntactically valid animation may depend on screen-specific events

Useful searches:

```powershell
rg -n '\"anim_type\"|\"anims\"|\"alpha\": \"@|\"offset\": \"@|\"size\": \"@' references/verified-samples/bedrock-samples-ui -g *.json
rg -n '\"play_event\"|\"end_event\"|\"destroy_at_end\"|\"animation_reset_name\"' references/verified-samples/bedrock-samples-ui references/reference-mirrors/minecraft-bedrock-json-ui-sample -g *.json -g *.jsonc
```
