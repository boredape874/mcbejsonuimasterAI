# Task: Choose A JSON UI Tooling Workflow

## Goal

Decide which external tool or reference source should be used for a specific JSON UI task.

## Recommended skills

- `mcbe-json-ui-tooling`
- `mcbe-json-ui-research`
- `mcbe-json-ui-vanilla-assets`

## Inspect first

- `docs/18-tooling-auxgen-dumper-starlib.md`
- `docs/13-vanilla-asset-workflow.md`
- `docs/09-schema-and-tooling.md`

## Expected workflow

1. identify whether the task needs item AUX, vanilla UI discovery, form architecture, schema validation, or asset lookup
2. pick the source:
   - `bedrock-auxgen` for AUX IDs
   - `JSON-UI-Dumper` for vanilla UI discovery
   - `StarLibV2` for form-library architecture reference
   - Ztech for vanilla asset truth
   - schemas for static validation
3. document license and confidence caveats
4. translate tool output into direct JSON UI file changes

## Expected result

- chosen tool/source
- why it fits
- what must still be verified
- exact next files to inspect or patch
