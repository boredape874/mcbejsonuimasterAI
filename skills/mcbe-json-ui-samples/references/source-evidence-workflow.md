# Source evidence workflow

Use the configured source record as the authority for collection and redistribution.

## 1. Validate the source boundary

Read the source record fields in `config/sources.public.json` or the Git-ignored local configuration:

- `id`, `kind`, `revision`
- `tier`: `gold`, `gold-candidate`, `pattern`, or `quarantine`
- `redistribution`: `public`, `metadata-only`, `local-only`, or `prohibited`
- `license` and `licenseEvidence`
- `rpRoot`, optional `bpRoot`, `include`, `exclude`, and `overrides`

Do not infer redistribution permission from file presence.

## 2. Run only available stages

Use `tools/skill-doctor.mjs mcbe-json-ui-samples --json` when available. Continue through the registered pipeline only when each stage is reported implemented and its required inputs exist:

1. `sources.validate`: validate paths, tiers, revisions, licenses, and public/local boundaries.
2. `source.scan`: collect UI entry files, inherited controls, referenced textures and nine-slice metadata, and linked BP sender evidence.
3. `catalog.build`: create source-linked recipes without promoting unresolved or restricted content.
4. `design.search`: query by screen role, profile, geometry, state, tier, and redistribution.

Stop at the first unavailable or failed stage and report its evidence. Do not simulate later outputs.

## 3. Extract a reusable pattern

Record the target screen, namespace and entry path, control inheritance, geometry, states, assets, bindings or collection source, and BP/server protocol dependency. Copy only the minimum structure needed for the target project and replace source-specific IDs and assets.

## 4. Apply tier and redistribution gates

- `gold`: may be recommended when runtime evidence is linked and redistribution permits it.
- `gold-candidate`: strong static evidence; label runtime verification pending.
- `pattern`: use only the evidenced component and state its limitations.
- `quarantine`: local inspection only; do not recommend automatically.

Public output may contain only `public` material. For `metadata-only`, report derived metadata and evidence pointers without copying source content. Keep `local-only` content in local artifacts; never output `prohibited` content.
