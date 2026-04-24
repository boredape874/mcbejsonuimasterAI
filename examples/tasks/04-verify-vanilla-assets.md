# Task: Verify Vanilla Assets

## Goal

Confirm whether a proposed vanilla texture or icon path is real and suitable for Bedrock JSON UI.

## Recommended skills

- `mcbe-json-ui-vanilla-assets`
- `mcbe-json-ui-research`

## Inspect first

- `docs/13-vanilla-asset-workflow.md`
- `references/vanilla/ztech-vanilla-authority.md`
- `references/vanilla/vanilla-search-guide.md`

## Expected workflow

1. classify the request as UI texture, item icon, block icon, or screen file
2. search the correct Ztech source
3. return only verified names
4. if not verified, recommend a custom texture instead of guessing

## Expected result

- confirmed path or explicit non-verification
- explanation of which upstream file was checked
