# Server Form Search Bar

Use this when a server form needs a client-side search box that filters `form_buttons` by button text.

## Pattern

Create a `common.text_edit_box` and bind each rendered form button's visibility to the text edit control.

The text edit box needs a named text control:

```json
{
  "search_content@common.text_edit_box": {
    "size": ["100%", 24],
    "$text_box_name": "search_text_box",
    "$text_edit_text_control": "search_text_value",
    "$place_holder_text": "Search...",
    "$text_clear_button_enabled": true,
    "$text_edit_box_clear_to_button_id": "button.search_bar_clear"
  }
}
```

Then each form button reads its own text from `form_buttons` and compares it with the search value:

```json
{
  "button@common_buttons.light_content_button": {
    "size": ["100% - 2px", "100% - 2px"],
    "$pressed_button_name": "button.form_button_click",
    "$button_content": "server_form.searchable_form_button_content",
    "property_bag": {
      "#default_search": ""
    },
    "bindings": [
      {
        "binding_type": "collection_details",
        "binding_collection_name": "form_buttons"
      },
      {
        "binding_name": "#form_button_text",
        "binding_type": "collection",
        "binding_collection_name": "form_buttons"
      },
      {
        "binding_type": "view",
        "source_control_name": "search_text_value",
        "source_property_name": "#item_name",
        "target_property_name": "#search"
      },
      {
        "binding_type": "view",
        "source_property_name": "#default_search",
        "target_property_name": "#search",
        "binding_condition": "once"
      },
      {
        "binding_type": "view",
        "source_property_name": "(#search = '')",
        "target_property_name": "#search_empty"
      },
      {
        "binding_type": "view",
        "source_property_name": "(not ((#form_button_text - #search) = #form_button_text))",
        "target_property_name": "#search_match"
      },
      {
        "binding_type": "view",
        "source_property_name": "(#search_empty or #search_match)",
        "target_property_name": "#visible"
      }
    ]
  }
}
```

## Why It Works

`(#form_button_text - #search)` removes the search substring from the button text. If the result differs from the original button text, the search text exists inside the button text.

```text
not ((#form_button_text - #search) = #form_button_text)
```

Use this as a contains check.

## Caveats

- This comparison is case-sensitive.
- Empty search must explicitly show all buttons.
- The text edit control's exposed text is read through `#item_name` on the named text control.
- Keep the clear button event unique per search bar when multiple search boxes exist.
- This filters visibility only; it does not reindex `form_buttons` or change the server-side selection order.
- Because hidden buttons remain in the collection, confirm the selected index behavior in the target form before relying on it for destructive actions.

## Case-Normalized Input

JSON UI does not expose a normal general-purpose lowercase function. If the search bar needs case-insensitive behavior, use a generated text-normalization control before the search comparison.

The useful guide pattern is:

- `common.text_edit_box` writes typed text into a named text control.
- A label or helper control receives that text through the generated binding.
- `property_bag` maps allowed characters to normalized output.
- Uppercase letters map to lowercase output, lowercase letters map to themselves, numbers map to themselves, and `# ` maps to a space when spaces are allowed.
- `max_length` should match the length supported by the generated binding pipeline, so users cannot type more characters than the normalizer handles.

Minimal shape:

```json
{
  "search_input@common.text_edit_box": {
    "size": ["100%", 28],
    "max_length": 99,
    "$text_box_name": "shop_search_text_box",
    "$text_edit_text_control": "shop_search_raw_text",
    "$place_holder_text": "Search...",
    "$text_alignment": "center"
  },
  "search_normalizer": {
    "type": "label",
    "enable_profanity_filter": false,
    "text": "#text",
    "property_bag": {
      "#flag": "§|",
      "# ": " ",
      "#A": "a",
      "#B": "b",
      "#a": "a",
      "#b": "b",
      "#0": "0",
      "#1": "1"
    },
    "bindings": []
  }
}
```

Extend the map for all supported letters and digits. Keep the generated binding in `bindings`; the empty array above is only a placeholder in the guide.

For server forms, a truly robust case-insensitive search normally needs both sides normalized. The input side can be normalized in JSON UI; the button side is safer if the server sends a normalized search key in the form payload or in a hidden/parallel label, because `#form_button_text` comparison itself remains case-sensitive.

## Naming

Use feature-specific names in real packs:

```text
shop_search_text_box
shop_search_text_value
button.shop_search_clear
```

Avoid generic names such as `search_portfolio` unless porting a one-off test.
