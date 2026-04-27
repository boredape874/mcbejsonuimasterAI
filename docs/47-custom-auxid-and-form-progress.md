# Custom AUX IDs And Server Form Progress

Use this when a PMMP, Script API, or JSON UI workflow needs custom item/block AUX IDs, `#item_id_aux`, chest-like item rendering, or a numeric progress bar inside `server_form.json`.

## Custom AUX ID Notes

These rules are field notes from practical testing. Treat them as a working model, not as a guaranteed cross-platform contract. Validate on the target Minecraft version and device family before shipping a Marketplace-grade pack.

### Custom Blocks

Observed rule:

- first custom block AUX ID: `-9745`
- formula: `-10000 + 255`
- subsequent custom block IDs decrement by `1`
- likely separation from vanilla item ranges avoids vanilla rendering conflicts
- vanilla items do not need an offset from these block values

Observed ordering model:

1. collect files and folders under the block definitions area
2. sort by file/folder name alphabetically
3. process nested folder contents alphabetically
4. reverse the resulting block order for AUX assignment

Example source layout:

```text
Blocks/
  aether_ore.json
  Wools/
    azul_wool.json
    red_wool.json
  Ores/
    venandium_ore.json
```

Observed generated order:

```text
venandium_ore = -9745
red_wool     = -9746
azul_wool    = -9747
aether_ore   = -9748
```

### Custom Items

Observed rule:

- first custom item AUX ID: `257`
- `256` appears reserved or unused in this sequence
- subsequent custom item IDs increment by `1`
- custom items insert into the item AUX list, so vanilla AUX IDs may be offset by registered custom items
- ordering appears tied to file path/file name, not the in-file identifier

Observed ordering model:

1. process folders and files in alphabetical order
2. process items inside each folder alphabetically
3. then continue through the remaining root item files

Example source layout:

```text
Items/
  blue_apple.json
  Swords/
    venandium_sword.json
    sharpened_blade.json
  Arches/
    oak_wood_arch.json
```

Observed generated order:

```text
oak_wood_arch   = 257
blue_apple      = 258
sharpened_blade = 259
venandium_sword = 260
```

### Filename Versus Identifier

Testing notes indicate the generated order correlates with file names and paths, not the item or block `identifier` inside the JSON file.

Implications:

- if file names differ from identifiers, a script that sorts by identifier can produce wrong AUX IDs
- if a server UI or chest UI needs stable custom item rendering, maintain a file path to identifier manifest
- generate the AUX map from the pack file tree, then attach identifiers after parsing the files
- do not assume Script API can recover the original file path from a runtime `typeId`

### Platform Risk

Observed reports:

- PC behavior matched the tested ordering model
- Android may diverge in some cases
- iOS may break this approach completely
- console behavior is not confirmed

AI rule:

- For tools and server-side authoring, this model is useful.
- For production packs, mention the platform risk and test on PC, Android, iOS, and console if the UI depends on custom AUX rendering.
- Prefer verified texture paths for normal JSON UI icons when possible.

## Relation To `bedrock-auxgen`

`DreamlandMC/bedrock-auxgen` remains useful for vanilla and generated AUX workflows, but the custom file-tree ordering above is a separate concern.

Use a custom pack scanner when:

- custom item files are present
- file names and identifiers may differ
- PMMP needs a generated map for chest-like JSON UI item display
- multiple addon packs can affect registration order

Minimal generator shape:

```text
1. enumerate item/block JSON files with relative paths
2. sort paths using the same case/order rules as the target platform as closely as possible
3. assign item IDs from 257 upward
4. assign block IDs from -9745 downward after reverse ordering
5. parse each JSON only after ordering to read identifier
6. emit { identifier, file, aux, kind }
```

## Server Form Custom Progress Bar

This pattern encodes the progress number at the front of the form body text, then uses JSON UI bindings to:

- convert the leading numeric prefix into a number
- drive `#clip_ratio`
- remove the prefix from the visible body label

Script/API side body example:

```js
form.body("069Hello World");
```

In this pattern, `069` is the progress payload and `Hello World` is the visible body text. Use fixed-width numeric prefixes such as three digits (`000` to `100`) so the JSON UI slicing stays deterministic.

### JSON UI Fragment

Put this inside the custom form content that has access to `#form_text`.

```json
"progress": {
  "$max": 100.0,
  "type": "image",
  "texture": "textures/ui/experiencebarempty",
  "anchor_from": "left_middle",
  "anchor_to": "left_middle",
  "size": [160, 6],
  "offset": [8, 35],
  "controls": [
    {
      "progress": {
        "type": "image",
        "size": ["100%", "100%"],
        "layer": 1,
        "clip_direction": "left",
        "clip_pixelperfect": false,
        "texture": "textures/ui/experiencebarfull",
        "bindings": [
          { "binding_name": "#form_text" },
          {
            "binding_type": "view",
            "source_property_name": "(#form_text * 1)",
            "target_property_name": "#converted"
          },
          {
            "binding_type": "view",
            "source_property_name": "(($max - #converted) / $max)",
            "target_property_name": "#clip_ratio"
          }
        ]
      }
    }
  ],
  "bindings": [
    { "binding_name": "#form_text" }
  ]
},
"body": {
  "type": "label",
  "text": "#text",
  "anchor_from": "top_left",
  "anchor_to": "top_left",
  "offset": [8, 30],
  "bindings": [
    { "binding_name": "#form_text" },
    {
      "binding_type": "view",
      "source_property_name": "((('@' + #form_text - ('@' + ('%.3s' * #form_text))) - '@'))",
      "target_property_name": "#text"
    }
  ]
}
```

### Practical Notes

- The expression `(#form_text * 1)` coerces the leading numeric text into a number.
- `#clip_ratio` is inverted by `(($max - #converted) / $max)`. If the bar direction is wrong in the target pack, invert the formula.
- `('%.3s' * #form_text)` takes the first three characters.
- The body expression removes the first three characters so users do not see the numeric payload.
- This depends on `#form_text`; inspect the target `server_form.json` before adapting.
- Use verified texture paths. `textures/ui/experiencebarempty` and `textures/ui/experiencebarfull` should be checked against the target vanilla/resource-pack asset source.

### When To Use

Use this for:

- progress in quest forms
- crop growth forms
- machine/furnace process forms
- skill XP or job progress in ActionForm bodies

Avoid it when:

- the body text is arbitrary user text and may start with numbers
- more than one progress value is needed
- the platform/version is not tested with this binding coercion

