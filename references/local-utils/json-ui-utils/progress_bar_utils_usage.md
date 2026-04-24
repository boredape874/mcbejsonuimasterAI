# Progress Bar Utils

## Added Files

- `progress_bar_utils.json`
- `title_progress_utils.json`

## What They Do

- `progress_bar_utils.animated_progress_bar`
  - Reusable animated progress bar body
  - Handles increase/decrease animation and optional trail
- `title_progress_utils.title_progress_source`
  - Reads a numeric value from `#hud_title_text_string`
  - Expected format: `<prefix><number>`
- `title_progress_utils.title_prefixed_label_panel`
  - Reads a prefixed title payload and renders it as a label
- `title_progress_utils.title_hp_bar_overlay_preset`
  - Ready-made overlay preset that combines bar + text + title source

## Example Prefixes

- Progress value: `customTitle_AniHPBar_75`
- Text label: `customTitle_AniHPBarText_HP 75 / 100`

## Example Usage

```json
{
  "root_panel": {
    "modifications": [
      {
        "array_name": "controls",
        "operation": "insert_back",
        "value": [
          {
            "hp_bar_overlay@title_progress_utils.title_hp_bar_overlay_preset": {}
          }
        ]
      }
    ]
  }
}
```

## Notes

- The bar itself does not read player health directly.
- It consumes title text as a data channel.
- Server or BP code must send the current value with the configured prefix.
- If you want a different max value, change `$multiplier` and `$text_format`.
