# Community Patterns: String, Score, And HUD Input

This document captures practical community JSON UI patterns that are useful but easy to misuse.

Use these as implementation references with caveats, not as universal best practices.

## Source quality

The examples in this document come from community discussion snippets and should be treated as:

- inferred from working community tests
- not official Bedrock documentation
- useful for prototypes and controlled packs
- risky when scaled without server-side preprocessing

## Pattern: JSON UI string splitting

Community attribution:

- Shoborn 8810 for the split-string proof-of-concept style snippets

### What it does

It tries to split a structured string inside JSON UI using:

- format specifiers such as `%.Ns`
- string subtraction
- repeated view bindings
- a separator such as `/` or `:/:`

Example data:

```text
abc/def/ghi
```

Expected parts:

```text
value1 = abc
value2 = def
value3 = ghi
```

### When it is useful

Use it when:

- the payload has only a few fields
- the separator is predictable
- the UI cannot be changed to use fixed-width slices
- the server cannot easily preformat values

### Known limitations

Community tests reported these limitations:

- identical values can break the subtraction-based approach
- multiple instances can behave unpredictably
- numeric-only split parts can crash or invalidate output
- more than three values becomes fragile quickly
- reducing a string length can leave stale-looking fragments unless state is reset carefully

Practical recommendation:

- do not scale separator-based splitting to 7, 14, or 20+ fields
- prefer server-side formatting or fixed-width slicing for complex payloads
- prefix numeric-only parts with a letter or marker before sending them to JSON UI

## Safer pattern: fixed-width slicing

Community attribution:

- Serty for the fixed-width slicing workflow and Unicode byte-width preparation idea

### What it does

Instead of searching for separators in JSON UI, the server or Script API pads each field to a known byte width.

Then JSON UI extracts slices using format specifiers.

Example payload layout:

```text
field1: 100 bytes
field2: 200 bytes
field3: rest
```

JSON UI extraction shape:

```json
{
  "binding_name": "#hud_title_text_string"
},
{
  "binding_type": "view",
  "source_property_name": "((%.100s * (#hud_title_text_string - (%.0s * #hud_title_text_string))) - '\t')",
  "target_property_name": "#texture"
}
```

### Why this is usually better

It avoids repeated separator search loops in JSON UI.

It also makes each field's offset deterministic:

- first field: slice length `100`, offset `0`
- second field: slice length `200`, offset `100`
- third field: remaining string after offset `300`

### Unicode caveat

Bedrock JSON UI string format width is byte-oriented, not normal JavaScript character count.

Before sending the string, server or Script API code should pad by Unicode byte width, not by JavaScript `.length`.

Practical rule:

- ASCII usually counts as 1
- many non-ASCII characters count as 2 or 3
- tab padding is often used as removable filler

## Pattern: individual score in HUD

Community attribution:

- bakedpotato for the personal scoreboard HUD pattern

### What it does

It renders the current player's score on the HUD by combining:

- `players_collection`
- `scoreboard_scored_list_collection`
- `scored_list_factory`
- a visibility comparison between the current gamertag and scoreboard player name

Server setup shape:

```mcfunction
/scoreboard objectives add myscore dummy "Minecoins: "
/scoreboard objectives setdisplay list myscore
```

### When it is useful

Use this when:

- each player should see their own score value
- the score can be represented through the vanilla scoreboard list collection
- only one displayed score is needed

### Known limitations

Community note:

- only one score is practical with this pattern
- many online or offline players can add lag because the UI generates elements per player entry
- server-side cleanup of offline scoreboard entries is recommended

### AI implementation note

Prefer documenting this as a HUD pattern rather than blindly injecting it into every pack.

First inspect:

- existing `hud_screen.json`
- whether the pack already uses scoreboard overlays
- whether the server can maintain clean scoreboard entries

## Pattern: interactable HUD menu through dummy screen

Community attribution:

- T1M0THY for the dev-console dummy-screen method

### What it does

It uses a dummy screen such as `dev_console_screen` to let mouse and keyboard users interact with HUD elements while game rendering remains behind the screen.

Core ideas:

- map a key in `debug_screen.json`
- open a dummy `dev_console_screen`
- set `render_game_behind`, `always_accepts_input`, and related flags
- set `hud_screen` to accept/listen to input while the overlay is active

### When it is useful

Use it for:

- custom mod menu prototypes
- HUD buttons and toggles on mouse and keyboard
- debugging interactive HUD controls

### Caveats

- this is not a normal server-form flow
- input focus behavior can be fragile
- gamepad and touch behavior must be tested separately
- avoid presenting it as a guaranteed cross-platform UI method

## AI rule for these patterns

When the AI uses one of these patterns, it must say:

- source: community pattern
- confidence: inferred from working snippets
- known limitations
- whether the safer server-side approach exists
