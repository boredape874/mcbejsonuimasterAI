# Binding Patterns Value Index

This document maps useful binding patterns to real sample files.

## Binding source priority

| Need | Source |
| --- | --- |
| vanilla binding names | `references/official/bedrock-samples-ui/` |
| discovered binding dump | `references/upstreams/minecraft-bedrock-json-ui-sample/binding/binding_dump.txt` |
| HUD title/actionbar protocol parsing | `references/local-examples/rpg-hud/ui/rpg_hud.json` |
| form title/button/texture collection binding | `references/local-examples/npc-dialogue/ui/server_form.json` |
| StarLib search/filter binding | `references/upstreams/minecraft-bedrock-json-ui-sample/starLib/.../starlib2/package_custom/common_custom.jsonc` |
| numeric/string extraction helpers | `skills/mcbe-json-ui-master/references/topics/logic/string-splitting-and-slicing.md` |

## Binding types

| `binding_type` | Use |
| --- | --- |
| omitted with `binding_name` | bind a built-in property directly |
| `global` | read global HUD/client state where supported |
| `view` | derive one property from another property or expression |
| `collection` | read one value from the active collection item |
| `collection_details` | get details for a collection item, commonly form buttons |

## Common target properties

| Target | Meaning |
| --- | --- |
| `#visible` | controls visibility |
| `#text` | label text |
| `#texture` | image texture path |
| `#texture_file_system` | texture file system flag where form images need it |
| `#collection_length` | controls collection factory count |
| `#clip_ratio` | controls image clipping/progress |
| custom `#...` | local scratch value in `property_bag` |

## Practical patterns

### Title/actionbar protocol parsing

Use when a PMMP plugin sends compact data through title/actionbar/subtitle.

Source:

- `references/local-examples/rpg-hud/ui/rpg_hud.json`

Pattern:

- bind `#hud_title_text_string`
- preserve previous text with `binding_name_override`
- detect marker text such as `Bar_`
- subtract marker and comma-delimited values into custom properties
- route values into progress bar controls

### Form collection text and images

Use when customizing `server_form.json`.

Source:

- `references/local-examples/npc-dialogue/ui/server_form.json`
- `references/source-packs/rpg-server-ui-reference/ui/stat.json`
- `references/source-packs/rpg-server-ui-reference/ui/skill.json`

Pattern:

- `collection_name`: `form_buttons`
- bind `#form_button_text`
- optionally bind `#form_button_texture`
- use `collection_details` when a button factory needs details
- route visibility from title prefixes such as `menu.stat` or `menu.skill`

### Search and filtering

Use when making searchable custom forms or item lists.

Source:

- `references/upstreams/minecraft-bedrock-json-ui-sample/starLib/StarLibV2-1.0.3.3/StarLibV2-1.0.3.3/starlib2/package_custom/common_custom.jsonc`

Pattern:

- bind collection item text
- bind search box text through `source_control_name`
- compare text by subtracting search text
- set `#visible` from `#is_not_empty or #is_being_searched`

### Sliced text range

Use when one string carries multiple fixed-width fields.

Source:

- same StarLib `common_custom.jsonc`
- `skills/mcbe-json-ui-master/references/topics/logic/string-splitting-and-slicing.md`

Pattern:

- use format specifier expressions such as `%.Ns`
- remove filler such as `\t`
- bind each slice to its own target property

## AI rules

- Never assume a binding works across screens. Check the target screen first.
- If a binding appears only in community snippets, label it as sample-observed.
- For form buttons, inspect the target `server_form.json` because collection names and button factories vary.
- For numeric output in text, convert to string or prefix with a harmless string marker before display.

## Search commands

```powershell
rg -n '\"binding_name\"|\"binding_type\"|\"binding_name_override\"' references/official/bedrock-samples-ui references/local-examples references/source-packs -g *.json
rg -n '#hud_title_text_string|#hud_subtitle_text_string|#form_button_text|#form_button_texture|#player_score|#gamertag' references -g *.json -g *.jsonc -g *.txt
```
