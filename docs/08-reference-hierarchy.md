# Reference Hierarchy

This repository uses a layered reference model so the AI reads only what it needs.

## Level 1: top-level routing

Read these first only for broad orientation:

- `docs/03-skill-map.md`
- `docs/27-token-efficient-routing.md`

Then pick only the exact topic document.

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
- JSON UI file responsibilities
- vanilla screen-by-screen responsibilities
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
- community string, score, and interactive HUD patterns
- dumper, AUX, and library tooling
- binding and hardcoded value lookup
- pack merge and version update workflow
- Bedrock resource-pack basics
- JSON UI layout units
- PMMP-to-JSON UI bridge
- common failure triage
- token-efficient routing

## Rule

The AI should not load every reference file. It should load:

1. one routing file
2. one topic index
3. one or two exact subtopic files
