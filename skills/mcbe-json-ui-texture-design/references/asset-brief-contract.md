# Asset brief contract

Read this reference when selecting evidence, writing an asset brief, or preparing an image-generation prompt.

## Evidence selection

Search by function before appearance. Useful query dimensions are:

- family: panel, button, tab, card, slot, meter, icon, badge, divider, tooltip;
- role: primary action, secondary action, destructive action, navigation, selection, status, decoration;
- state: default, hover, pressed, locked, selected, disabled;
- construction: fixed-size, tiled, mirrored, nine-slice, masked, animated frames;
- geometry: intended display size, source dimensions, aspect ratio, border thickness, corner radius;
- rendering: pixel density, alpha silhouette, palette size, contrast, highlight and shadow direction.

Prefer patterns repeated across independent sources. Keep provenance in a private evidence report using safe catalog identifiers; public outputs contain only aggregate measurements and generic role labels.

## Brief shape

Use `prompts/texture-asset-brief.yaml` as the writable template. Preserve these distinctions:

- `evidence`: measured facts or aggregate catalog observations;
- `designDecisions`: new choices made for this target;
- `stateSet`: exact visual differences between interaction states;
- `files`: RP-relative outputs and their dimensions;
- `nineSlice`: stretch center and protected borders in source-pixel units;
- `generationPrompt`: visual content only, with exclusions and output constraints;
- `validation`: checks that can be run without Minecraft;
- `unverified`: Bedrock-only behavior.

## State-set rules

- Keep silhouette, protected borders, and content-safe region stable across states.
- Measure both the PNG canvas and its non-transparent alpha bounds/visual centroid. Center the alpha content—not merely the canvas—inside a circular slot, card socket, or baked parent frame; the residual must be at most 1 UI unit after scaling.
- Before drawing a button frame, inspect the final parent shell. If the shell already contains the socket, bezel, or action plate, state assets must contain only the glyph, tint, outline, or glow; rendering a second framed button causes visible nesting and position drift.
- Do not use an unmasked rectangular `textures/ui/White` or `textures/ui/Black` overlay for a circular, angled, or rounded control. Reuse the verified control silhouette or a same-size alpha mask so hover/pressed cannot expose a foreign rectangle.
- Default, hover, and pressed files used by one image control must have the same canvas dimensions, aspect ratio, and alpha-content bounds within 1 source pixel. Reject the state set when those invariants differ unless the JSON intentionally uses independent measured rectangles.
- Express hover with a deliberate contrast, value, border, or highlight change rather than an unrelated redraw.
- Express pressed state with a readable depression cue; account for any content offset in layout rather than baking text into the texture.
- Locked/disabled must remain distinguishable without relying on hue alone.
- Do not bake dynamic labels, currency, counts, or localized text into reusable textures.

## Nine-slice contract

For a resizable `name.png`, emit `name.json` beside it. The brief must state:

- source PNG dimensions;
- left, top, right, and bottom protected margins;
- minimum rendered size, which cannot be smaller than opposing protected margins;
- whether the center stretches or tiles;
- content padding, kept separate from slice margins.

If a valid margin cannot be measured or designed confidently, mark nine-slice unresolved instead of inventing metadata.

## Generation prompt composition

Describe in this order: asset function, view and silhouette, pixel dimensions, pixel-art density, palette, material and border treatment, lighting direction, state-specific difference, transparency, and exclusions. Request one texture per named file or a deterministic grid with explicit cell order that will be split before use.

Exclude text, logos, signatures, watermarks, photographs, perspective tilt, soft antialiased outer edges, and UI elements outside the requested asset. Refer to catalog evidence as aggregate traits, never by private source or filename.
