# Mine Local Resource Pack Examples

## Goal

Find a pattern inside a local resource-pack archive and adapt only the relevant parts into the target pack.

## Recommended skills

- `mcbe-json-ui-master`
- `mcbe-json-ui-patterns`
- `mcbe-json-ui-hud-and-chat`
- `mcbe-json-ui-server-forms`
- `mcbe-json-ui-addon-integration` when BP/RP linkage is involved

## Inspect first

Read:

- `docs/27-token-efficient-routing.md`
- `docs/28-local-example-mining.md`

Then inspect only the matching local mirror or local source path.

## Prompt

```text
Use mcbe-json-ui-master. Use docs/28-local-example-mining.md and token-efficient routing.

Task:
Find a local example for <RPG HUD / NPC dialogue / animated bar / tablist / addon integration> and adapt the pattern into this pack:
<target pack path>

Local archive path:
<local resource-pack archive path>

Rules:
- do not scan every local sample pack
- prefer references/local-examples if it contains the needed pattern
- if using a non-mirrored local folder, summarize the pattern and check license/copy restrictions before copying code
- patch only target pack files
- return changed files and validation command
```
