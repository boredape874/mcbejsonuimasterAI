# Texture design workflow

`mcbe-json-ui-texture-design` converts local asset-catalog observations into an original texture specification. It does not make the local asset library redistributable and does not copy source art into public examples.

## Flow

1. Search the configured semantic catalog when available; otherwise run `npm run asset:search -- <role state shape>`.
2. Compare multiple results by function, state, dimensions, alpha silhouette, border, palette, pixel density, and nine-slice structure.
3. Write a private evidence summary and an original brief from `prompts/texture-asset-brief.yaml`.
4. Define every required state and output filename before image generation.
5. When the user requested image creation, generate new art from the brief. Do not put local paths, source names, or identifiable compositions in the prompt.
6. Store each scalable PNG beside a same-stem nine-slice JSON, then check dimensions, margins, transparency, and state completeness.
7. Use visual-design and IR tools to place the texture. Static preview and actual Bedrock runtime proof remain separate.

## Catalog query fallback

```powershell
npm run asset:search -- "primary button hover pixel" --category ui --limit 24 --json
```

Do not add `--absolute` to reports intended for publication. If semantic classification tools are added later, prefer their role/state/style filters and keep `asset:search` as the compatibility fallback.

## Deliverables

- evidence summary with confirmed, inferred, and unresolved fields;
- `texture-asset-brief.yaml` or equivalent JSON;
- generation prompt only when requested;
- exact state/file matrix;
- same-stem nine-slice metadata for scalable surfaces;
- static validation results and an explicit runtime-unverified list.
