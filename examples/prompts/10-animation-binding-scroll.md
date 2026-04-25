# Prompt: Animation, Binding, Or Scroll Pattern

Use this prompt when a pack needs a practical animation, binding, vertical scroll, horizontal scroll, or carousel pattern.

```text
Use mcbe-json-ui-master.

Target pack:
<absolute or repo-relative resource pack path>

Goal:
<animated HUD bar / title fade / toast slide / searchable form / horizontal carousel / scroll panel>

Rules:
- Do not load every source archive.
- Read docs/33-animation-patterns-and-dumper-values.md, docs/34-binding-patterns-value-index.md, or docs/35-scroll-and-carousel-patterns.md depending on the goal.
- Search the listed sources with rg.
- Open only one exact source file and the target pack file.
- Adapt the smallest working fragment.
- Keep target namespace, _ui_defs.json registration, texture paths, and screen context correct.
- Validate JSON parsing.

Return:
- files changed
- source file used
- why the fragment applies
- validation result
- any required in-game test
```
