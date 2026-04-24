# Master Routing

## Read these docs first

- `../../../docs/00-overview.md`
- `../../../docs/01-source-catalog.md`
- `../../../docs/02-mastery-map.md`
- `../../../docs/03-skill-map.md`
- `../../../docs/04-source-priority.md`
- `../../../docs/05-external-research-map.md`
- `../../../docs/06-json-ui-rules.md`
- `../../../docs/07-external-example-sources.md`
- `../../../docs/08-reference-hierarchy.md`
- `../../../docs/09-schema-and-tooling.md`
- `../../../docs/10-bedrock-wiki-mirror.md`
- `../../../docs/11-basics-and-mental-model.md`
- `../../../docs/12-local-utils-and-patterns.md`
- `../../../docs/13-vanilla-asset-workflow.md`
- `../../../docs/14-json-ui-best-practices.md`
- `../../../docs/15-json-ui-file-role-catalog.md`
- `../../../docs/16-screen-by-screen-reference.md`
- `../../../docs/17-community-patterns-string-score-hud.md`
- `../../../docs/18-tooling-auxgen-dumper-starlib.md`
- `../../../docs/19-bindings-and-hardcoded-values.md`
- `../../../docs/20-pack-merge-playbook.md`
- `../../../docs/21-update-policy.md`
- `../../../docs/22-ai-response-quality.md`

## Route by request type

### structure

Use `mcbe-json-ui-foundations`.
Then load:

- `topics/foundations/index.md`
- and only the exact needed subtopic under `topics/foundations/`

### basics, mental model, pack overview, beginner explanation

Use `mcbe-json-ui-basics`.
Then load:

- `topics/basics/index.md`
- and only the exact needed subtopic under `topics/basics/`

### bindings, variables, parsing, conditions

Use `mcbe-json-ui-logic`.
Then load:

- `topics/logic/index.md`
- and only the exact needed subtopic under `topics/logic/`

For community string splitting, fixed-width slicing, or Unicode byte-width payloads, prefer `topics/logic/string-splitting-and-slicing.md`.

### HUD, chat, title, actionbar, scoreboard

Use `mcbe-json-ui-hud-and-chat`.
Then load:

- `topics/hud-chat/index.md`
- and only the exact needed subtopic under `topics/hud-chat/`

For individual scoreboard HUD or interactable HUD menus, prefer `topics/hud-chat/personal-score-and-interactable-hud.md`.

### server form or chest form routing

Use `mcbe-json-ui-server-forms`.
Then load:

- `topics/server-forms/index.md`
- and only the exact needed subtopic under `topics/server-forms/`

### progress bar, chest UI, reusable templates

Use `mcbe-json-ui-patterns`.
Then load:

- `topics/patterns/index.md`
- and only the exact needed subtopic under `topics/patterns/`

### bug or rendering failure

Use `mcbe-json-ui-debugging`.
Then load:

- `topics/debugging/index.md`
- and only the exact needed subtopic under `topics/debugging/`

### UI plus addon resource linkage

Use `mcbe-json-ui-addon-integration`.
Then load:

- `topics/addon/index.md`
- and only the exact needed subtopic under `topics/addon/`

### vanilla icon or texture path verification

Use `mcbe-json-ui-vanilla-assets`.
Then load:

- `topics/vanilla/index.md`
- and only the exact needed subtopic under `topics/vanilla/`

### "what is the right vanilla source and how do I use it"

Use `mcbe-json-ui-vanilla-assets`.
Then load:

- `topics/vanilla/index.md`
- and only the exact needed subtopic under `topics/vanilla/`

### source selection or external confirmation

Use `mcbe-json-ui-research`.
Then load:

- `topics/research/index.md`
- and only the exact needed subtopic under `topics/research/`

### schema validation or VSCode schema setup

Use `mcbe-json-ui-schemas`.
Then load:

- `topics/schemas/index.md`
- and only the exact needed subtopic under `topics/schemas/`

### visual editor, builder, or tool-generated UI workflow

Use `mcbe-json-ui-tooling`.
Then load:

- `topics/tooling/index.md`
- and only the exact needed subtopic under `topics/tooling/`

For bedrock-auxgen, JSON-UI-Dumper, or StarLibV2, prefer `topics/tooling/aux-dumper-starlib.md`.
