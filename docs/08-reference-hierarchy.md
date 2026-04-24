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
- `docs/13-vanilla-asset-workflow.md`
- `docs/14-json-ui-best-practices.md`

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
- vanilla asset workflow
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
- vanilla asset usage workflow
- performance and compatibility patterns

## Rule

The AI should not load every reference file. It should load:

1. one routing file
2. one topic index
3. one or two exact subtopic files
