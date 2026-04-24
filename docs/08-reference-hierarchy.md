# Reference Hierarchy

This repository uses a layered reference model so the AI reads only what it needs.

## Level 1: top-level routing

Read these first:

- `docs/11-basics-and-mental-model.md`
- `docs/03-skill-map.md`
- `docs/04-source-priority.md`
- `docs/05-external-research-map.md`
- `docs/06-json-ui-rules.md`
- `docs/12-local-utils-and-patterns.md`

## Level 2: topic indexes

Use topic indexes when the task type is known:

- structure
- basics and mental model
- logic
- HUD and chat
- server forms
- patterns
- debugging
- addon integration
- vanilla lookup
- external research

## Level 3: subtopic notes

Use subtopic notes only for the exact problem:

- entry points
- resource-pack basics
- screen-size and layout assumptions
- namespaces
- title parsing
- actionbar parsing
- chest substitution
- animated bars
- topbar chat notifications
- tablist HUD overlays
- scroll panels
- slider and toggle examples
- vanilla UI texture lookup

## Rule

The AI should not load every reference file. It should load:

1. one routing file
2. one topic index
3. one or two exact subtopic files
