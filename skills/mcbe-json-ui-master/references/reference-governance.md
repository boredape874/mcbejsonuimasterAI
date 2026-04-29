# Reference Governance

Use this when a task uses local packs, restricted local mirrors, community snippets, community chat notes, or sample archives.

## Goal

Keep references useful for implementation while preventing public answers and generated project files from exposing raw source identity.

## Reference Identity Levels

| Level | Use In Public Output | Use Internally |
| --- | --- | --- |
| pattern family | yes | yes |
| target file role | yes | yes |
| neutral reference ID | yes, if needed | yes |
| raw local path | no | only while opening files |
| original archive or pack name | no | only if needed to locate files |
| author handle or chat nickname | no | no, unless attribution is explicitly required |
| restricted source labels | no | only in restricted notes |

## Neutral Family Names

Prefer these public labels:

- `internal high-polish game-ui reference`
- `internal button hover/pulse template`
- `internal animated-toggle factory template`
- `vanilla common UI reference`
- `neutral restricted form gallery`
- `community JSON UI note`
- `official sample screen`
- `tool-generated UI sample`

Avoid raw folder names, exact archive names, and personal identifiers.

## Output Rules

- Say "I used the internal high-polish game-ui reference family" instead of naming a raw pack.
- Say "the server-form router file" instead of giving the original local path.
- Say "community note" instead of naming the chat server or participant.
- When patching a user's pack, write clean first-party namespaces and control names.
- Do not paste comments, marker text, credits, or hidden labels from a reference into target files.

## Code Adaptation Rules

- Rebuild controls with target-specific namespace, names, texture paths, sizes, and protocol IDs.
- Preserve only the behavior pattern: route shape, binding shape, animation trigger shape, factory shape.
- Do not keep original arbitrary names such as `button1`, `abc`, random symbol keys, or server-specific title IDs.
- Do not copy texture paths unless the target RP already owns the texture.
- Move reusable logic into `common` only after two target features actually use it.

## Internal Trace

When a task needs traceability, keep it restricted and neutral:

```text
feature: enchant_select
pattern_family: internal animated-toggle factory template
source_role: toggle state plus factory entry/exit animation
target_files:
  - ui/forms/enchant_select/state.json
  - ui/forms/enchant_select/animations.json
```

Do not include raw paths or original names in public summaries.
