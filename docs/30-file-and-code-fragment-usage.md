# File And Code Fragment Usage

Use this when the AI must split a large JSON UI example into useful parts and apply only the needed fragment.

## Principle

Do not copy a whole screen unless the task is a full screen replacement.

Most JSON UI work should extract one of these fragments:

- loading entry
- namespace and control definition
- `modifications` insertion
- binding block
- factory/collection block
- texture reference
- animation block
- PMMP or Script API data source

## File roles and how to read them

| File type | What to extract | What not to copy blindly |
| --- | --- | --- |
| `ui/_ui_defs.json` | only the missing file registration line | unrelated vanilla screen registrations |
| `ui/_global_variables.json` | shared flags, colors, sizes, feature switches | whole variable file from another pack |
| `ui/hud_screen.json` | `root_panel.modifications`, title/actionbar bindings, HUD control insertion | entire HUD screen from a UI overhaul |
| `ui/chat_screen.json` | chat filter bindings, notification routing, input/button behavior | full chat screen unless replacing chat UI |
| `ui/server_form.json` | form title/body/button collection bindings, custom form layout | unrelated modal/action form branches |
| `ui/scoreboards.json` | scoreboard collection use and item templates | full scoreboard skin if only one value is needed |
| `ui/ui_common.json` | reusable button/panel/label presets | global common file from another pack |
| `ui/animated_bar.json` | reusable bar control and parameters | fixed texture paths or unrelated data source names |
| `textures/**/*.json` | nine-slice or texture metadata for one used texture | metadata for unused images |
| `BP/scripts/*.js` | payload or form call shape | gameplay logic unrelated to UI |
| `plugin PHP` | title/actionbar/form payload format | server-specific business logic |

## Extraction workflow

1. Identify the target behavior.
2. Find one working example with `rg`.
3. Open only the example's `_ui_defs.json` and target screen/control file.
4. Split the example into:
   - entry file
   - reusable control file
   - screen insertion
   - data source bindings
   - texture dependencies
5. Map example names to target pack names.
6. Patch the target pack.
7. Validate JSON and list unresolved texture or pack-stack assumptions.

## Reference notation

When documenting a borrowed pattern, write:

```text
Pattern source:
- confirmed from local example: references/local-examples/rpg-hud/ui/rpg_hud.json
- adapted into: <target-pack>/ui/my_hud.json
- changed names: rpg_hud.preserved_hp -> myhud.preserved_health
```

When using an upstream archive path that is not committed:

```text
Pattern source:
- inferred from upstream mirror: references/upstreams/mcbe-json-ui-resource/Json ui tutorial/Preserve Title Texts/Preserve Title Texts.json
- upstream commit checked locally: <short commit>
```

## Common fragment recipes

### Add a new utility UI file

Extract:

- utility file from example, such as `animated_bar.json`
- one `_ui_defs.json` entry
- one insertion call from `hud_screen.json`

Apply:

```json
{
  "ui_defs": [
    "ui/my_utility.json"
  ]
}
```

Then add a screen insertion:

```json
{
  "array_name": "controls",
  "operation": "insert_back",
  "value": {
    "my_panel@my_namespace.my_panel": {}
  }
}
```

### Adapt a binding block

Extract only:

- the `bindings` array
- referenced `property_bag` values
- referenced `source_control_name`

Before applying, rename:

- `#target_property_name`
- `$variables`
- `source_control_name`
- namespace aliases

Check that the source control exists in the target screen.

### Adapt a collection factory

Extract:

- `factory`
- `collection_name`
- item template control
- `collection_details` bindings

Never copy only the grid without the item template. A collection grid usually fails if the item template or collection binding is missing.

### Adapt textures

Extract:

- exact texture path used in JSON UI
- image file
- optional `.json` texture metadata

Then decide:

- if vanilla texture: verify through Ztech vanilla pack
- if custom texture: copy image and metadata into target pack
- if third-party asset: check license before redistribution

### Adapt PMMP or Script API payloads

Extract:

- payload prefix
- delimiter
- value order
- update frequency
- target UI binding source

Do not copy gameplay code. Rebuild the server side around the target project.

## Naming rules

When adapting code:

- use a new namespace for the target pack
- keep utility files small
- avoid generic names like `main_panel` if multiple utilities are merged
- prefix variables with the feature name, such as `$quest_panel_size` or `$ck_notify_flag`
- keep source-control names stable if another binding references them

## Validation checklist

- New JSON file listed in `_ui_defs.json`.
- All namespace references resolve.
- Every `@namespace.control` target exists.
- Every `source_control_name` exists in the same resolved control tree.
- Every custom texture exists with image and metadata if needed.
- Every copied pattern has a source note in docs or final answer.
- The answer states whether the pattern is confirmed, inferred, or unverified.
