# Java Locate Command Chat Pattern

Use this reference when a Bedrock JSON UI task asks to intercept Java-style `/locate`
success messages in `chat_screen.json` and turn them into a client-side helper UI.

Source sample:

- `../../local-examples/java-locate-command/ui/chat_screen.json`
- `../../local-examples/java-locate-command/texts/en_US.lang`

## What The Sample Does

The sample replaces `messages_text` in `chat_screen.json` with a wrapper that:

1. Keeps normal chat rows visible only when `#text` does not contain `The nearest`.
2. Shows a custom `locate_text_label` when `#text` contains `The nearest`.
3. Parses biome or structure name and coordinates from the locate success line.
4. Creates an invisible/selectable `edit_box` whose text becomes a teleport command.
5. Uses `common.hover_text` to show a small `Click to teleport` hint.

This is a chat-message protocol pattern, not a general command API. It depends on the
exact localized strings in the pack language files.

## Required Language Strings

The reference language files normalize Bedrock locate output to this English pattern:

```properties
commands.locate.biome.success=The nearest %1$s is at block %2$s, %3$s, %4$s (%5 blocks away)
commands.locate.structure.success=The nearest %1$s is at block %2$s, (y?), %3$s (%4 blocks away)
```

The structure form inserts `(y?)` because Java locate structure output does not provide
a Y coordinate in the same way. The UI maps a parsed zero/unknown Y value to `~` by using
a property-bag lookup.

## Important Controls

- `messages_text`: wrapper for each chat row.
- nested `messages_text`: original text label, hidden for locate rows.
- `locate_text_label`: visible formatted locate row.
- `text_edit_box`: click target that injects `/tp @s <x> <y> <z>` into the chat input.
- `text_control`: hidden label inside the edit box that derives the command string.

## Parsing Notes

The sample uses string subtraction expressions such as:

```json
"(#f_text - 'The nearest ' - ' is at block ')"
```

to strip fixed phrases, and then removes digits, punctuation, and markers to isolate the
biome/structure id. Treat this as fragile: if the language string changes, every parser
expression must be retested.

The source may show `짠z` if the section sign was viewed through the wrong encoding. In
UTF-8-authored packs this should be treated as the usual Minecraft formatting marker
prefix, commonly `§z`, used to force string behavior.

## When To Reuse

Reuse this for:

- clickable `/locate` chat helpers
- chat rows that become command shortcuts
- parsing structured system messages into labels or edit boxes

Do not reuse it for arbitrary player chat parsing unless the server controls the full
message format. Player-controlled text can collide with the parser.
