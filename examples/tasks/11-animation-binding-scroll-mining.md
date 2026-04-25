# Task: Mine Animation, Binding, And Scroll Examples

Use this when the target pack needs a practical Bedrock JSON UI pattern and the AI should borrow from the curated sources without loading every archive.

## Prompt

```text
Find one working Bedrock JSON UI example for <animation / binding / vertical scroll / horizontal carousel>.

Use this route:
1. Read docs/33-animation-patterns-and-dumper-values.md, docs/34-binding-patterns-value-index.md, or docs/35-scroll-and-carousel-patterns.md.
2. Search only the listed source folders.
3. Open one exact source file and the target pack file.
4. Adapt the smallest fragment.
5. Update _ui_defs.json if a new utility file is added.
6. Validate JSON parsing and list any in-game test required.
```

## Good targets

- animated HUD progress bar
- title/actionbar fade sequence
- toast slide in/out
- searchable server form list
- fixed-width sliced text payload
- vertical long form scroll panel
- clipped horizontal carousel

## Output requirements

- changed files
- copied/adapted source path
- why the source was chosen
- target namespace and screen
- validation command
