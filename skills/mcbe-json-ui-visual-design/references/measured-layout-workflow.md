# Measured layout workflow

Use this reference when translating visual evidence into JSON UI geometry.

## 1. Establish the coordinate space

Record the target profile, viewport, GUI scale, root rectangle, and any safe-area or clipping bounds. If a screenshot's scale or crop is unknown, normalize measurements as ratios and mark absolute pixels as provisional.

For an integrated RP, the coordinate space is not ready for final numbers until the installed vanilla profile and Minecraft font profile are available and the logical-to-screenshot transform is calibrated for this device. Use at least three non-collinear correspondences and retain calibration confidence/residual. Do not infer missing scale, safe area, glyph metrics, or coordinates from appearance.

## 2. Measure structure before decoration

Capture the root, major regions, repeated controls, text boxes, and interaction states. For each relevant control, record:

- role and parent
- position and size
- anchor and offset intent
- padding and gap
- aspect ratio
- text role and available height
- texture dimensions and same-stem nine-slice metadata
- declared control rectangle, rendered alpha-content bounds, and visual centroid
- evidence file or recipe ID

Separate measured values from values inferred to complete a pattern.

Record whether each visible surface is baked into a composite texture or rendered by a child control. For unexplained lines or bands, capture the parent chain, clip rectangles, scroll viewport/background controls, source pixels, adjacent nine-slice metadata, and sampling seams before classifying the defect as geometry. Separate a duplicated divider, nine-slice seam, texture-edge bleed, and clipping artifact before changing offsets.

For nine-slice controls, measure the rendered border in pixels in default, hover, and pressed crops. The sidecar margin describes how the source is sliced; it does not prove that the chosen source has an appropriate cap thickness for the target button. If a source produces an oversized top/bottom band, select a better role-matched asset or redesign the layered frame instead of falsifying its metadata. When the intended result is a narrow outline around a dark interior, constrain the inner surface by the measured inset on all four edges and verify the bottom edge separately; do not judge only from the center or hover state.

## 3. Convert intent to constraints

Use explicit constraints for visible relationships:

- paired controls: symmetry
- repeated rows or grids: same size and equal gaps
- centered clusters: group centering
- shared baselines or edges: alignment or edge equality
- deliberate separation: edge offset

Let `mcbe-json-ui-ir-authoring` choose the exact IR fields. Do not correct a solved layout by hand-editing compiled offsets.

## 4. Check visual states and text

Keep state geometry stable unless the design intentionally changes it. Check default, hover, pressed, and locked textures or colors. Test normal copy, a 30% longer Korean variant, and a long English variant inside the measured text region.

Compare layout identity and skin identity independently. A palette or texture change is not a new form shape. For a requested matrix, document the number of unique geometry definitions, texture families, their Cartesian product, and any extra protocol-stage screens separately.

Do not treat `collection_panel` as a grid unless explicit grid dimensions/item size establish grid flow. A collection-backed custom form may use absolute child offsets. Likewise, defer `#form_button_*` and view-binding expressions until the collection fixture is attached; evaluating them as ordinary variables during inheritance resolution creates false errors and missing visual data.

For circular chips, history badges, glyph-only utility buttons, and irregular betting regions, compare the child alpha centroid to the baked parent socket center. A matching declared rectangle is insufficient when transparent padding shifts the visible art. Reject rectangular hover overlays on non-rectangular controls unless a verified mask clips them.

Use Minecraft glyph metrics from the installed font profile. If the required atlas or glyph page is unavailable, record `FONT_UNAVAILABLE` and leave fit/baseline conclusions unresolved; a system font measurement is not evidence.
Measure `font_size` and `font_scale_factor` together, center the glyph block vertically inside the declared label rect, and validate the actual glyph bbox/baseline rather than the label box alone.

For product cards, assign independent content regions before styling states: price/discount at the top, icon in the visual field, quantity/name in the footer, and hover details outside any icon alpha bounds. Validate the longest localized strings and missing-texture fallback. Persistent title/content belongs outside state-only visual children so hover cannot erase it.

## 5. Validate and report

Run only commands confirmed in the current checkout or the matching tool profile. Record unsupported properties, unresolved texture roots, and unresolved dynamic expressions. Inspect the machine-readable preview report rather than inferring success from PNG creation.

If the final UI was adapted into a resource pack after IR compilation, compare the final RP screen file against the compiled artifact and validate the final route, namespace graph, texture paths, and state controls. The workspace IR preview does not cover those later edits.

Before proposing a coordinate patch, run pinned offline upstream compatibility fixtures, render the relevant state matrix, compare against a calibrated Bedrock screenshot, and retain the server-issued evidence ID plus project revision. A proposal is read-only evidence with a known source pointer and expected residual; it is not an automatic edit.

External editor output may supply pinned compatibility fixtures. It cannot replace installed vanilla/font evidence, screenshot calibration, or Bedrock runtime capture.

Report four separate statuses where applicable: geometry, approximate preview, final pack structure, and Bedrock runtime. Server-form hover, pressed, focus, binding, collection data, and final placement remain runtime-unverified until demonstrated by actual in-game screenshots and the content log.
