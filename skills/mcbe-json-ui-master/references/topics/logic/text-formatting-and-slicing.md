# Text Formatting And Slicing

Use this for binding expressions that trim, pad, split, or extract fixed-width text without scripts.

## `%.s` Format Pattern

JSON UI string formatting supports printf-like string width expressions in binding math:

```text
'%.20s' * #value
```

Useful forms:

| Form | Result |
| --- | --- |
| `%.3s` | first 3 characters, or shorter if the text is shorter |
| `%5.3s` | first 3 characters padded on the left to width 5 |
| `%-5.3s` | first 3 characters padded on the right to width 5 |
| `%20.20s` | fixed-width field: trim to 20 and pad to 20 |

## Fixed-Width Payload Split

Pack several values into one string by padding each field to the same width, then slice ranges back out:

```text
('#' + '%20.20s' * #field_a + '%20.20s' * #field_b + '%20.20s' * #field_c)
```

Then derive rows by subtracting earlier slices:

```text
'%.21s' * #packed
'%.41s' * #packed - '%.21s' * #packed
#packed - '%.41s' * #packed
```

Use a sentinel prefix that will not appear in the real text, then remove the sentinel and padding after extraction.

## First Line Extraction

Hover text and item labels can be trimmed to the first line with a derived expression:

```text
(#text - (('%.' + <line_length> + 's') * '\n') - '<marker>')
```

In practice, the line length is often calculated from whether a marker exists. Keep the marker protocol stable and test with one-line and multi-line text.

## Encoding Notes

Some community examples depend on section-sign marker bytes that can change when a file is saved as ANSI and reopened as UTF-8. Minecraft Bedrock may fail or behave differently with those malformed marker characters.

Rules:

- Keep JSON UI files UTF-8.
- Prefer normal `§` sequences typed directly in UTF-8.
- If a snippet mentions removing or relying on mojibake bytes, convert it into a clean marker protocol before using it in a real pack.
- Do not mix ANSI-saved marker tricks with generated server payloads unless you have tested the exact client version.

## When To Use

Use fixed-width formatting when the server can send a compact string but JSON UI must split it into visible fields. If the server can send separate form buttons, labels, or scoreboard lines instead, prefer separate data channels because they are easier to debug.
