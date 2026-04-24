# Task: Debug Merged Pack

## Goal

Find why a JSON UI system broke after two packs or two UI systems were merged.

## Recommended skills

- `mcbe-json-ui-debugging`
- `mcbe-json-ui-foundations`
- `mcbe-json-ui-master`

## Inspect first

- `_ui_defs.json`
- all touched screen files
- shared template files
- local utility files if used

## Expected workflow

1. inspect load order and missing file references
2. inspect namespace collisions
3. inspect duplicate or conflicting insertion points
4. inspect texture and binding breakage

## Expected result

- root-cause list ordered by severity
- exact file-level fixes
- note any structural cleanup needed to avoid future collisions
