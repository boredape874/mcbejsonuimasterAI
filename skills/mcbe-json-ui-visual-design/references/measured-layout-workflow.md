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

Do not treat `collection_panel` as a grid unless explicit grid dimensions/item size establish grid flow. A collection-backed custom form may use absolute child offsets. Likewise, defer `#form_button_*` and view-binding expressions until the collection fixture is attached; evaluating them as ordinary variables during inheritance resolution creates false errors and missing visual data.

For circular chips, history badges, glyph-only utility buttons, and irregular betting regions, compare the child alpha centroid to the baked parent socket center. A matching declared rectangle is insufficient when transparent padding shifts the visible art. Reject rectangular hover overlays on non-rectangular controls unless a verified mask clips them.

Use Minecraft glyph metrics from the installed font profile. If the required atlas or glyph page is unavailable, record `FONT_UNAVAILABLE` and leave fit/baseline conclusions unresolved; a system font measurement is not evidence.
Measure `font_size` and `font_scale_factor` together, center the glyph block vertically inside the declared label rect, and validate the actual glyph bbox/baseline rather than the label box alone.

## 5. Validate and report

Run only commands confirmed in the current checkout or the matching tool profile. Record unsupported properties, unresolved texture roots, and unresolved dynamic expressions. Inspect the machine-readable preview report rather than inferring success from PNG creation.

If the final UI was adapted into a resource pack after IR compilation, compare the final RP screen file against the compiled artifact and validate the final route, namespace graph, texture paths, and state controls. The workspace IR preview does not cover those later edits.

Before proposing a coordinate patch, run pinned offline upstream compatibility fixtures, render the relevant state matrix, compare against a calibrated Bedrock screenshot, and retain the server-issued evidence ID plus project revision. A proposal is read-only evidence with a known source pointer and expected residual; it is not an automatic edit.

External editor output may supply pinned compatibility fixtures. It cannot replace installed vanilla/font evidence, screenshot calibration, or Bedrock runtime capture.

Report four separate statuses where applicable: geometry, approximate preview, final pack structure, and Bedrock runtime. Server-form hover, pressed, focus, binding, collection data, and final placement remain runtime-unverified until demonstrated by actual in-game screenshots and the content log.
