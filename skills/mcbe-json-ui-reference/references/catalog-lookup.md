# Exact lookup workflow

Choose one evidence route and stop when the claim is resolved.

## Property, control, and binding names

1. Inspect the target screen and inherited control first.
2. Check `data/jsonui-spec.json` for the exact control, property, anchor, binding, or enum spelling.
3. Confirm context-sensitive behavior in an official or working included screen.
4. Use `docs/19-bindings-and-hardcoded-values.md`, `docs/34-binding-patterns-value-index.md`, or `docs/48-json-ui-field-catalogue.md` only for the matching question.

Report schema-only evidence separately from behavior observed in a working screen.

## Design catalog

Use `design.search` only when `tools/skill-doctor.mjs mcbe-json-ui-reference --json` reports it implemented and available. Otherwise inspect an existing checked-in design index or recipe file directly. Preserve the recipe ID, source tier, target profile, and evidence pointers in the answer.

## Vanilla evidence

Use an existing local vanilla index or configured vanilla mirror. Refresh an index only when the registered `vanilla.index` tool is implemented and its input source exists. Return the source revision when available and never convert a not-found result into a guessed path.

## Result labels

- `confirmed`: exact schema, catalog, official source, or target file evidence exists.
- `sample-observed`: a working included sample uses it, but broader support is not established.
- `inferred`: evidence suggests the result but does not prove it.
- `unresolved`: no sufficient evidence was found.
