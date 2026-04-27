# MCBE JSON UI Master AI

Portable Codex skills and research notes for Minecraft Bedrock JSON UI.

This repository is designed to be usable as a standalone GitHub project, not just as a local note dump.  
The goal is simple:

- install the skills once
- keep all important JSON UI references inside this repository
- let Codex route itself to the right subtopic instead of loading everything every time

## What this repository is for

Use this repository when you want Codex to work well on:

- Bedrock JSON UI
- HUD and chat driven UI
- title and actionbar text protocols
- `server_form.json` customization
- chest or furnace based custom UIs
- addon RP/BP integration
- vanilla texture path lookup
- schema validation and VSCode setup
- JSON UI editing workflows and builder examples

It is written in Bedrock addon and PMMP terms, not generic web UI terms.

## What is included

### Skills

- `mcbe-json-ui-basics`
- `mcbe-json-ui-master`
- `mcbe-json-ui-foundations`
- `mcbe-json-ui-logic`
- `mcbe-json-ui-hud-and-chat`
- `mcbe-json-ui-server-forms`
- `mcbe-json-ui-patterns`
- `mcbe-json-ui-debugging`
- `mcbe-json-ui-addon-integration`
- `mcbe-json-ui-vanilla-assets`
- `mcbe-json-ui-research`
- `mcbe-json-ui-schemas`
- `mcbe-json-ui-tooling`

### Local pack references

- `references/source-packs/modern-cloud-ui-reference/`
- `references/source-packs/farm-ui-variants/`
- `references/source-packs/rpg-server-ui-reference/`

### Local utility mirrors

- `references/local-utils/json-ui-utils/`
- `references/local-utils/integrated-sample/`

### External mirrored references

- `references/external/bedrock-wiki-json-ui/`
- `references/external/json-ui-examples/`
- `references/external/EasyUIBuilder/`
- `references/external/Chest-UI/`
- `references/external/bedrock-json-ui-editor/`

### Schema references

- `references/schemas/Blockception/`
- `references/schemas/DJStompZone/`

## Source policy

This repository uses a strict source priority model:

1. included local working packs in `references/source-packs/`
2. official Mojang `bedrock-samples`
3. Bedrock Wiki JSON UI pages
4. `ZtechNetwork/MCBVanillaResourcePack` for vanilla asset truth

For vanilla texture validation, the canonical upstream authority is:

- <https://github.com/ZtechNetwork/MCBVanillaResourcePack>

See:

- [Source Priority](docs/04-source-priority.md)
- [External Research Map](docs/05-external-research-map.md)
- [JSON UI Rules](docs/06-json-ui-rules.md)
- [External Example Sources](docs/07-external-example-sources.md)
- [Reference Hierarchy](docs/08-reference-hierarchy.md)
- [Schema And Tooling](docs/09-schema-and-tooling.md)
- [Wiki Mirror Guide](docs/10-bedrock-wiki-mirror.md)
- [Basics And Mental Model](docs/11-basics-and-mental-model.md)
- [Local Utils And Patterns](docs/12-local-utils-and-patterns.md)
- [Vanilla Asset Workflow](docs/13-vanilla-asset-workflow.md)
- [JSON UI Best Practices](docs/14-json-ui-best-practices.md)
- [JSON UI File Role Catalog](docs/15-json-ui-file-role-catalog.md)
- [Screen-By-Screen Reference](docs/16-screen-by-screen-reference.md)
- [Community Patterns: String, Score, And HUD Input](docs/17-community-patterns-string-score-hud.md)
- [Tooling: AUX, Dumper, And StarLib](docs/18-tooling-auxgen-dumper-starlib.md)
- [Bindings And Hardcoded Values](docs/19-bindings-and-hardcoded-values.md)
- [Pack Merge Playbook](docs/20-pack-merge-playbook.md)
- [Update Policy](docs/21-update-policy.md)
- [AI Response Quality Rules](docs/22-ai-response-quality.md)
- [Bedrock Resource Pack Basics](docs/23-bedrock-resource-pack-basics.md)
- [JSON UI Layout Units](docs/24-json-ui-layout-units.md)
- [PMMP To JSON UI Bridge](docs/25-pmmp-json-ui-bridge.md)
- [Common Failure Modes](docs/26-common-failure-modes.md)
- [Token-Efficient Routing](docs/27-token-efficient-routing.md)
- [Local Example Mining](docs/28-local-example-mining.md)
- [MCBE JSON UI Resource Upstream](docs/29-mcbe-json-ui-resource-upstream.md)
- [File And Code Fragment Usage](docs/30-file-and-code-fragment-usage.md)
- [Fragment Routing Table](docs/31-fragment-routing-table.md)
- [Minecraft Bedrock JSON UI Sample Upstream](docs/32-minecraft-bedrock-json-ui-sample-upstream.md)
- [Animation Patterns And Dumper Values](docs/33-animation-patterns-and-dumper-values.md)
- [Binding Patterns Value Index](docs/34-binding-patterns-value-index.md)
- [Scroll And Carousel Patterns](docs/35-scroll-and-carousel-patterns.md)
- [Dumper Value Cookbook](docs/36-dumper-value-cookbook.md)
- [Vanilla Dumper Screen Recipes](docs/37-vanilla-dumper-screen-recipes.md)
- [Advanced JSON UI Recipes](docs/38-advanced-json-ui-recipes.md)
- [Design Recommendation Catalog](docs/39-design-recommendation-catalog.md)
- [Server Form Example Index](docs/40-server-form-example-index.md)
- [Custom AUX IDs And Server Form Progress](docs/47-custom-auxid-and-form-progress.md)
- [JSON UI Field Catalogue](docs/48-json-ui-field-catalogue.md)
- [JSON UI Tutorial Index](docs/49-json-ui-tutorial-index.md)
- [Advanced Adventure UI Reference Analysis](docs/50-advanced-ui-reference-analysis.md)
- [IR Spec](docs/41-ir-spec.md) (tools layer)
- [Tools Reference](docs/42-tools-reference.md) (tools layer)
- [Self-Bootstrap Protocol](docs/43-self-bootstrap-protocol.md) (tools layer)
- [Design → IR Mapping](docs/44-design-to-ir-mapping.md) (tools layer)
- [JSON UI Spec & Preset Catalogs](docs/45-jsonui-spec-and-presets.md) (tools layer)

## Quick start

### 1. Clone

```powershell
git clone https://github.com/boredape874/mcbejsonuimasterAI.git
cd mcbejsonuimasterAI
```

### 2. Install the skills into Codex

```powershell
.\scripts\install-skills.ps1
```

This copies every directory under `skills/` into:

```text
%USERPROFILE%\.codex\skills\
```

### 3. Optional: sync the upstream vanilla pack mirror

```powershell
.\scripts\sync-ztech-vanilla.ps1
```

That creates:

```text
references/upstreams/MCBVanillaResourcePack/
```

This mirror is intentionally not committed to Git because it is large and reproducible.

### 4. Optional: sync selected Mojang `bedrock-samples` UI files

```powershell
.\scripts\sync-bedrock-samples-ui.ps1
```

This updates:

```text
references/official/bedrock-samples-ui/
```

### 5. Optional: sync the MCBE JSON UI resource archive

```powershell
.\scripts\sync-mcbe-json-ui-resource.ps1
```

That creates:

```text
references/upstreams/mcbe-json-ui-resource/
```

This mirror is intentionally not committed because it is large and searchable.

### 6. Optional: validate a JSON UI pack or reference mirror

```powershell
.\scripts\validate-json-ui-pack.ps1 -PackPath references\source-packs\modern-cloud-ui-reference
```

For partial reference mirrors:

```powershell
.\scripts\validate-json-ui-pack.ps1 -PackPath references\official\bedrock-samples-ui -AllowPartialUiDefs -AllowMissingTextures
```

### 7. AI tools layer (Node)

If your AI client uses [AGENTS.md](AGENTS.md), it can self-bootstrap on first open. To prepare manually:

```powershell
npm install
node tools/setup.mjs
```

Then, for any layout work:

```powershell
node tools/init-project.mjs my_screen
node tools/run.mjs workspace/my_screen/ir.yaml
```

See [AGENTS.md](AGENTS.md), [docs/41-ir-spec.md](docs/41-ir-spec.md), [docs/42-tools-reference.md](docs/42-tools-reference.md).

## How to use it with Codex

### Recommended default

If the request is broad, use:

```text
Use mcbe-json-ui-master.
```

If the request is beginner-oriented or first needs the mental model, use:

```text
Use mcbe-json-ui-basics and mcbe-json-ui-master.
```

That skill routes into smaller topic files such as:

- basics
- foundations
- logic
- hud-chat
- server-forms
- patterns
- debugging
- addon
- vanilla
- research
- schemas
- tooling
- best-practice-oriented pattern selection

For token efficiency, the master skill is designed to read one router, one topic index, and only the exact subtopic files needed for the request.

### Typical prompts

#### General JSON UI work

```text
Use mcbe-json-ui-master and fix this hud_screen.json layout.
```

#### Beginner explanation or onboarding

```text
Use mcbe-json-ui-basics and explain how Bedrock JSON UI is loaded, what _ui_defs.json does, and how HUD files fit together.
```

#### `_ui_defs.json` or namespace problems

```text
Use mcbe-json-ui-foundations and explain why this screen is not loading.
```

#### Title/actionbar/chat parsing

```text
Use mcbe-json-ui-logic and mcbe-json-ui-hud-and-chat for this title-based HP bar.
```

#### Server forms

```text
Use mcbe-json-ui-server-forms and convert this PMMP form protocol into server_form.json routing.
```

#### Reusable UI patterns

```text
Use mcbe-json-ui-patterns and build a chest-like menu with a progress bar.
```

#### Local utility adaptation

```text
Use mcbe-json-ui-patterns and mcbe-json-ui-hud-and-chat, and adapt the local topbar chat notification utility into this pack.
```

#### Vanilla path lookup

```text
Use mcbe-json-ui-vanilla-assets and verify the correct vanilla texture path for this icon.
```

#### Vanilla asset usage, not just path lookup

```text
Use mcbe-json-ui-vanilla-assets and explain how to find the right Bedrock vanilla UI texture, item icon, or block icon path for this JSON UI control.
```

#### Schema setup

```text
Use mcbe-json-ui-schemas and set up VSCode json.schemas for ui, _ui_defs, and _global_variables.
```

#### Tooling workflows

```text
Use mcbe-json-ui-tooling and explain whether bedrock-json-ui-editor or EasyUIBuilder fits this task better.
```

## Use with any AI (MCP-free)

Any AI client that can read files and run terminal commands works with this kit:

- Cursor, Claude Code, Codex, GitHub Copilot, Continue, Aider, etc.
- The AI reads `AGENTS.md` first, performs self-bootstrap if needed, then routes layout work through `tools/*.mjs` and bindings/animation work through the existing knowledge-layer skills.

Typical user flow:

```text
1. git clone <this repo>
2. open the folder in your AI client
3. ask "build a centered confirmation modal with two symmetric buttons"
   → AI authors workspace/<name>/ir.yaml, runs node tools/run.mjs, returns ui.json
```

For layout-only work the kit is deterministic: same IR → same JSON UI.

## Repository layout

- `skills/`
  - portable Codex skills
- `docs/`
  - concept maps, source priority, usage and research guides
- `references/`
  - sample packs, mirrored external references, schema files
- `examples/prompts/`
  - copy-paste prompt examples for Codex
- `examples/tasks/`
  - task templates that pair a real objective with the right skill flow
- `examples/vscode/`
  - workspace settings templates for schema-aware editing
- `examples/integration/`
  - PMMP and Script API integration notes
- `scripts/`
  - installation and sync helpers
- `AGENTS.md`, `.agent/`, `tools/`, `schemas/`, `data/`, `vanilla-index/`, `workspace/`
  - AI tools layer (Node CLI). See `docs/41`–`docs/45` and `AGENTS.md`.
  - `data/jsonui-spec.json` (control/anchor/binding catalog, ported from gamezaSRC/JSON-UI-Web-Editor MIT) and `data/presets-catalog.json` (vanilla preset references) drive the validator and the IR `extends` field.

## Ready-made examples

If you want something other people can use immediately after cloning, start here:

- [examples/prompts/README.md](examples/prompts/README.md)
- [examples/tasks/README.md](examples/tasks/README.md)

Prompt examples are for direct copy-paste.
Task examples are for slightly longer guided work where the AI should inspect files, trace dependencies, and then patch the pack.

## Recommended reading order

Read these first:

1. [Overview](docs/00-overview.md)
2. [Source Catalog](docs/01-source-catalog.md)
3. [Mastery Map](docs/02-mastery-map.md)
4. [Skill Map](docs/03-skill-map.md)
5. [Basics And Mental Model](docs/11-basics-and-mental-model.md)
6. [Reference Hierarchy](docs/08-reference-hierarchy.md)

Then read as needed:

- [Source Priority](docs/04-source-priority.md)
- [External Research Map](docs/05-external-research-map.md)
- [JSON UI Rules](docs/06-json-ui-rules.md)
- [External Example Sources](docs/07-external-example-sources.md)
- [Schema And Tooling](docs/09-schema-and-tooling.md)
- [Wiki Mirror Guide](docs/10-bedrock-wiki-mirror.md)
- [Local Utils And Patterns](docs/12-local-utils-and-patterns.md)
- [Vanilla Asset Workflow](docs/13-vanilla-asset-workflow.md)
- [JSON UI Best Practices](docs/14-json-ui-best-practices.md)
- [JSON UI File Role Catalog](docs/15-json-ui-file-role-catalog.md)
- [Screen-By-Screen Reference](docs/16-screen-by-screen-reference.md)
- [Community Patterns: String, Score, And HUD Input](docs/17-community-patterns-string-score-hud.md)
- [Tooling: AUX, Dumper, And StarLib](docs/18-tooling-auxgen-dumper-starlib.md)
- [Bindings And Hardcoded Values](docs/19-bindings-and-hardcoded-values.md)
- [Pack Merge Playbook](docs/20-pack-merge-playbook.md)
- [Update Policy](docs/21-update-policy.md)
- [AI Response Quality Rules](docs/22-ai-response-quality.md)
- [Bedrock Resource Pack Basics](docs/23-bedrock-resource-pack-basics.md)
- [JSON UI Layout Units](docs/24-json-ui-layout-units.md)
- [PMMP To JSON UI Bridge](docs/25-pmmp-json-ui-bridge.md)
- [Common Failure Modes](docs/26-common-failure-modes.md)
- [Token-Efficient Routing](docs/27-token-efficient-routing.md)
- [Local Example Mining](docs/28-local-example-mining.md)
- [MCBE JSON UI Resource Upstream](docs/29-mcbe-json-ui-resource-upstream.md)
- [File And Code Fragment Usage](docs/30-file-and-code-fragment-usage.md)
- [Fragment Routing Table](docs/31-fragment-routing-table.md)
- [Custom AUX IDs And Server Form Progress](docs/47-custom-auxid-and-form-progress.md)
- [JSON UI Field Catalogue](docs/48-json-ui-field-catalogue.md)
- [JSON UI Tutorial Index](docs/49-json-ui-tutorial-index.md)
- [Advanced Adventure UI Reference Analysis](docs/50-advanced-ui-reference-analysis.md)

## Is this enough to become a "JSON UI Master AI" in one shot?

Pragmatically: almost, yes.

What this repository now gives you:

- portable skills
- layered topic routing
- beginner-to-advanced mental model docs
- local working pack references
- local utility mirrors for topbar, title bars, tablist, tooltip, and integrated sample screens
- mirrored Bedrock Wiki JSON UI docs
- mirrored external example repositories
- schema references
- vanilla asset authority flow

What it does not magically guarantee:

- perfect answers for every future Bedrock version without updates
- runtime truth from schema files alone
- correct behavior when a pack has hidden dependencies outside the copied files

So the right claim is:

> this repository is now a strong portable base for an MCBE JSON UI specialist Codex, and it is structured so it can keep improving without collapsing into one giant unreadable skill

## Current state

If you clone this repository and run:

```powershell
.\scripts\install-skills.ps1
```

you get a working, installable MCBE JSON UI skill suite immediately.
