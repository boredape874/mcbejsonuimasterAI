# Tooling: AUX, Dumper, And StarLib

This document explains how external tools fit into the MCBE JSON UI workflow.

## `DreamlandMC/bedrock-auxgen`

Upstream:

- <https://github.com/DreamlandMC/bedrock-auxgen>

Observed license:

- MIT

What it does:

- generates Minecraft Bedrock AUX IDs from Mojang item metadata
- supports custom item IDs from a resource pack's `textures/item_texture.json`
- writes a JSON map from item identifier to AUX ID

Formula:

```text
aux = item_id << 16
```

Why it matters for JSON UI:

- Bedrock JSON UI sometimes references item representations through values such as `#item_id_aux`
- the Bedrock Wiki JSON UI documentation includes item-ID auxiliary value context
- plugin-side or server-side code may need a deterministic item identifier to AUX map

Use it when:

- a UI or plugin needs stable item AUX values
- a PMMP/Nukkit/Geyser-like integration needs item ID mapping
- custom resource-pack item icons must be mapped in a reproducible way

Do not use it for:

- direct `textures/ui/*` lookup
- normal UI image texture paths
- replacing `textures/item_texture.json` verification

## `TheoristMC/JSON-UI-Dumper`

Upstream:

- <https://github.com/TheoristMC/JSON-UI-Dumper>

Observed license:

- no repository license was visible during inspection

What it does:

- provides a web UI for browsing dumped vanilla JSON UI elements
- supports stable and preview version views
- is generated from latest Bedrock samples according to the upstream README

Use it when:

- you need to inspect vanilla UI elements quickly
- you need to compare stable vs preview UI structures
- you want to find likely vanilla control names before confirming against a pack mirror

AI rule:

- use dumper results as a discovery aid
- confirm critical paths against Ztech or bedrock-samples before making final claims
- do not vendor its source unless licensing is clarified

## `pipangry/StarLibV2`

Upstream:

- <https://github.com/pipangry/StarLibV2>
- docs: <https://pipangry.github.io/docs-starlib/>

Observed license:

- GPLv3

What it is:

- a JSON UI form library
- supports dynamic structure, multi forms, custom tabs, and reusable UI packages

Why it matters:

- it is a real-world example of structured JSON UI form authoring
- it shows how a library organizes package-level UI components
- it is useful for learning dynamic form architecture

AI rule:

- reference StarLib as an architecture and pattern source
- do not copy GPLv3 code into generated proprietary projects unless the user understands license implications
- if code is reused, preserve license terms and attribution

## Distribution policy for this repository

This repository should prefer:

- links and summarized workflow notes for GPL or unlicensed projects
- local mirrors only when licensing allows redistribution or when the repo has already been intentionally mirrored with license preserved
- generated docs and AI routing instructions over blind code vendoring

## Practical tool selection

| Need | Tool/source |
| --- | --- |
| item AUX mapping | `bedrock-auxgen` |
| vanilla UI element discovery | `JSON-UI-Dumper` |
| stable vanilla asset truth | `ZtechNetwork/MCBVanillaResourcePack` |
| official sample confirmation | Mojang `bedrock-samples` |
| dynamic form architecture | `StarLibV2` |
