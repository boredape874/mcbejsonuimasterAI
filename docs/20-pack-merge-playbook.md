# Pack Merge Playbook

Use this when two JSON UI packs or two UI systems must be merged safely.

## First pass

1. compare `ui/_ui_defs.json`
2. list every custom namespace
3. list every modified vanilla screen
4. list shared textures and fonts
5. list all title/actionbar/chat/form protocols

## Common collision points

| Collision | Symptom | Fix |
| --- | --- | --- |
| duplicate namespace | one system overrides another | rename or merge controls intentionally |
| duplicate `additional_screen_content` | only one HUD system appears | wrap both systems in a parent panel |
| conflicting `root_panel` modifications | insertion order breaks visuals | combine modifications in one patch |
| texture path conflict | wrong image renders | namespace custom textures by folder |
| shared variable conflict | colors/sizes change unexpectedly | move to project-specific variables |
| server-form title protocol conflict | wrong form layout appears | reserve explicit prefixes |

## `_ui_defs.json` merge rule

Keep every required custom UI file.

Do not add vanilla UI files just because they exist in another pack unless the target pack actually ships a custom copy.

## Namespace rule

Prefer project-prefixed namespaces for new systems:

```text
my_pack_hud
my_pack_forms
my_pack_tooltip
```

Avoid generic new namespaces such as:

```text
custom
main
utils
forms
```

## HUD merge rule

If both systems use `root_panel` or `$additional_screen_content`, create a parent control:

```text
merged_hud_content
```

Then place both systems under it.

## Protocol merge rule

Reserve prefixes:

```text
!topbar:
customTitle_AniHPBar_
dialog:
form:shop:
form:quest:
```

Never let two unrelated systems consume the same prefix.

## Verification

Run:

```powershell
.\scripts\validate-json-ui-pack.ps1 -PackPath <path-to-resource-pack>
```

Then manually check:

- HUD visible
- chat still works
- server forms still route
- title/actionbar protocols still parse
- texture paths resolve
