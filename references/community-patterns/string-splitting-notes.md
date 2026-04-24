# String Splitting Notes

This file preserves distilled notes from community JSON UI string-splitting discussions.

## Separator-based split

Use only for small payloads.

Known pitfalls:

- identical values can break subtraction-based splitting
- many values can crash or become unstable
- numeric-only values can invalidate or crash
- stale fragments can appear when the source string shrinks

Recommendation:

- use markers such as `n10` instead of raw numeric-only `10`
- prefer fixed-width slicing when field count is known
- prefer server-side preprocessing for more than three fields

## Fixed-width slicing

Better for:

- texture path plus label plus extra text
- actionbar or title payloads with multiple independent fields
- different elements needing different offsets, fonts, or colors

Server-side rule:

- pad by Unicode byte width, not JavaScript string length
- use tab padding so JSON UI can remove filler with `- '\t'`

JSON UI extraction shape:

```json
{
  "binding_type": "view",
  "source_property_name": "((%.100s * (#hud_title_text_string - (%.0s * #hud_title_text_string))) - '\t')",
  "target_property_name": "#field1"
}
```

For the next field, change the slice length and remove the previous byte offset.
