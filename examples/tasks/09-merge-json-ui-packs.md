# Task: Merge JSON UI Packs

## Goal

Merge two JSON UI systems without losing HUD, chat, or form behavior.

## Recommended skills

- `mcbe-json-ui-debugging`
- `mcbe-json-ui-foundations`
- `mcbe-json-ui-master`

## Inspect first

- `docs/20-pack-merge-playbook.md`
- both `ui/_ui_defs.json` files
- all modified vanilla screen files

## Expected workflow

1. list all custom files
2. list namespaces
3. list insertion points
4. list protocol prefixes
5. merge `_ui_defs.json`
6. resolve namespace and insertion conflicts
7. run `scripts/validate-json-ui-pack.ps1`

## Expected result

- merged file plan
- conflict list
- exact patches
- validation result
