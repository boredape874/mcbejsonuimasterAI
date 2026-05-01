# Java Locate Command Binding Logic

This reference describes the binding flow used by the Java Locate Command chat sample.

Source sample:

- `../../local-examples/java-locate-command/ui/chat_screen.json`

## Protocol

The input is a chat message matching one of these formats:

```txt
The nearest <id> is at block <x>, <y>, <z> (<distance> blocks away)
The nearest <id> is at block <x>, (y?), <z> (<distance> blocks away)
```

The output is:

```txt
The nearest minecraft:<id> is at §a[<x>, <y-or-~>, <z>]
/tp @s <x> <y-or-~> <z>
```

## Binding Pipeline

1. Prefix the raw chat text into `#f_text`.
2. Detect locate rows:

```json
"(not ((#f_text - 'The nearest') = #f_text))"
```

3. Extract the payload after `The nearest ` and ` is at block `:

```json
"(#f_text - 'The nearest ' - ' is at block ')"
```

4. Isolate the id by subtracting punctuation, digits, distance text, and Y marker text.
5. Extract `x`, `y`, and `z` by subtracting the already-derived prefix fragments.
6. Convert unknown or zero Y to `~` through a property-bag key:

```json
"#y_is_zero_1": "~"
"('#y_is_zero_' + ((#y < 1) * 1))"
"(#y_is_z + #y - '0')"
```

7. Build the command:

```json
"(#command + #x + ' ' + #y_final + ' ' + #z)"
```

where `#command` is selected through a property bag key such as `#p1 = " /tp @s "`.

## Practical Rules

- Keep the language string and parser expressions together in the same pack revision.
- Prefer fixed server-owned messages over player-authored messages.
- If the parser fails, inspect the exact `#text` string first. One extra space breaks the chain.
- If the click target does not work, inspect the `edit_box` `text_control` and `#item_name`
  binding, not the visible label.
- If the UI appears to hide chat entirely, check the original message label visibility
  condition before checking command logic.
