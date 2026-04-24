# MCBE JSON UI Master AI

Portable Codex skills and research notes for Minecraft Bedrock JSON UI.

This repository is built for three use cases:

1. Install the skills into `~/.codex/skills`
2. Study real Bedrock JSON UI patterns from included pack samples
3. Validate vanilla UI texture paths and screen structure against current upstream sources

## Scope

The repository is tuned for:

- Bedrock JSON UI
- HUD and chat driven UI
- server form replacement
- title and actionbar text protocols
- addon resource-pack integration
- debugging broken UI
- vanilla asset lookup

It is intentionally written in Bedrock addon and PMMP workflow terms, not generic web UI terms.

## Source policy

This repository uses a strict source priority model:

1. Included local sample packs in `references/source-packs/`
2. Official Mojang `bedrock-samples`
3. Bedrock Wiki JSON UI documentation and guides
4. `ZtechNetwork/MCBVanillaResourcePack` for vanilla texture and screen asset verification

For vanilla texture validation, the old local icon note is no longer the authority. The canonical upstream basis is:

- <https://github.com/ZtechNetwork/MCBVanillaResourcePack>

See:

- [Source Priority](docs/04-source-priority.md)
- [External Research Map](docs/05-external-research-map.md)
- [JSON UI Rules](docs/06-json-ui-rules.md)
- [External Example Sources](docs/07-external-example-sources.md)
- [Reference Hierarchy](docs/08-reference-hierarchy.md)
- [Schema And Tooling](docs/09-schema-and-tooling.md)
- [Wiki Mirror Guide](docs/10-bedrock-wiki-mirror.md)

## Repository layout

- `skills/`
  - portable Codex skills
- `docs/`
  - source catalog, mastery map, research map, rules
- `references/`
  - included sample packs and local reference notes
- `scripts/`
  - installation and upstream sync helpers

## Included local sample packs

### `references/source-packs/1seulbi/`

Used for:

- HUD injection
- chat protocol parsing
- scoreboard replacement
- server form routing

### `references/source-packs/bunnyfarm/`

Used for:

- animated bars
- chest and pocket container patterns
- alternative HUD and chat layouts
- reusable server form patterns

### `references/source-packs/custom-crops-reference/`

Used for:

- addon-linked UI
- multi-screen server form systems
- HUD progress bars
- custom textures tied to gameplay systems

## Main skills

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

## Install

PowerShell:

```powershell
.\scripts\install-skills.ps1
```

This copies every directory under `skills/` into `~/.codex/skills/`.

## Optional upstream sync

To keep a local mirror of the upstream vanilla pack authority:

```powershell
.\scripts\sync-ztech-vanilla.ps1
```

That script creates or updates:

- `references/upstreams/MCBVanillaResourcePack/`

## Read first

- [Overview](docs/00-overview.md)
- [Source Catalog](docs/01-source-catalog.md)
- [Mastery Map](docs/02-mastery-map.md)
- [Skill Map](docs/03-skill-map.md)
- [Source Priority](docs/04-source-priority.md)
- [External Research Map](docs/05-external-research-map.md)
- [JSON UI Rules](docs/06-json-ui-rules.md)
