# Task: Mine Dumper Recipes

Use this when the AI should find a useful JSON UI value or behavior in dumped vanilla files and adapt it.

## Prompt

```text
Use mcbe-json-ui-master.

Target pack:
<path>

Need:
<factory / collection grid / renderer / button_mappings / focus / scroll / variable branching / uv animation>

Process:
1. Read docs/36-dumper-value-cookbook.md.
2. If screen-specific, read docs/37-vanilla-dumper-screen-recipes.md.
3. If combining multiple patterns, read docs/38-advanced-json-ui-recipes.md.
4. Use rg to find one exact source object in references/official/bedrock-samples-ui.
5. Open the source object and the object that references it.
6. Patch only the smallest target files.
7. Validate JSON parsing.

Return:
- source object and file
- target files changed
- why the target screen supports this value
- remaining in-game checks
```
