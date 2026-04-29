# Chat Message Filtering

Use this when `chat_screen.json` or chat message templates must hide protocol/control messages while leaving normal player chat visible.

## Hide Specific Protocol Messages

Common shape:

- Patch the chat message label wrapper, usually the control that owns `#text`.
- Add a local trigger string such as `§p§k` or a pack-specific prefix.
- Bind `#chat_visible`.
- Derive `#visible` from both vanilla chat visibility and a string check against `#text`.

The useful expression family is:

```text
#chat_visible and (((#text - $trigger_text) = #text) or not(#text - $trigger_text))
```

Meaning:

- `(#text - $trigger_text) = #text` means the trigger was not found.
- `not(#text - $trigger_text)` catches edge cases where subtraction collapses to a falsey/empty result.
- The outer `#chat_visible` preserves vanilla chat visibility state.

## Protocol Rule

Treat the trigger as a server protocol. If the server sends a chat message starting with the trigger, the client UI hides it. If the same trigger is meant to feed another widget, parse it in that widget before hiding it from chat.

Recommended trigger naming:

```text
§p§k<feature>:<payload>
```

Avoid reusing the same trigger for unrelated features; hidden chat messages are hard to debug once multiple systems share one prefix.

## Caveats

- This hides the rendered chat row only; it does not stop the client receiving the message.
- Keep `enable_profanity_filter` disabled on protocol labels when exact marker text matters.
- Do not use visible natural-language text as a trigger. Use a compact marker prefix that the server owns.
- Test normal chat, command output, and plugin protocol messages separately.
