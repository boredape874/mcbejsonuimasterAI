# Addon Map

## Main integrated source

- `docs/pack-analyses/rpg-server-ui-reference.md`

## Key files

- `references/source-packs/rpg-server-ui-reference/ui/hud_screen.json`
- `references/source-packs/rpg-server-ui-reference/ui/server_form.json`
- `references/source-packs/rpg-server-ui-reference/ui/_ui_defs.json`

## Why it matters

This source shows that Bedrock UI often depends on broader addon-side conventions. In this public kit, keep the reference focused on JSON UI files and texture path usage; inspect restricted or target-pack assets only when the user provides them.

## Runtime dependency trace

For a dynamic UI, record one row per value or interaction:

| Field | Questions |
| --- | --- |
| owner | RP constant, server-form payload, scoreboard, BP Script API, or another source? |
| snapshot | Is the value created on form open, on an event, per tick, or only after reopening? |
| transport | Which title/body/button/collection/binding field carries it? |
| consumer | Which exact qualified control and property reads it? |
| refresh | What action makes a new value visible? |
| proof | Static trace, final-RP render, or Bedrock interaction capture? |

Use this trace for stale balances, disappearing scores, category-limited search, reward icons, result cards, and animations that start before their game event. If the client never receives the complete dataset, a JSON UI search bar cannot discover omitted entries.

Before editing assets, fingerprint the exact installed RP/BP and resolve texture paths target-first. A correct source edit can look unchanged when another pack copy, cached preview server, or older installed revision is active.
