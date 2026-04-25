# Fragment-Based Adaptation Prompts

Use this when Codex should adapt only the necessary part of an example.

## Adapt one feature

```text
Use mcbe-json-ui-master. Use docs/30-file-and-code-fragment-usage.md and docs/31-fragment-routing-table.md.

Task:
Add <feature> to this pack:
<target pack path>

Rules:
- find one working example
- split it into _ui_defs entry, utility control, screen insertion, bindings, textures, and server payload
- copy/adapt only the necessary fragments
- rename namespaces and variables for the target pack
- cite the source pattern and changed names
- run JSON UI validation after patching
```

## Explain how to use a file

```text
Use mcbe-json-ui-master. Explain this file by fragment:
<file path>

For each fragment, list:
- role
- dependencies
- how to reference it from another file
- safe reuse method
- common breakage points
```
