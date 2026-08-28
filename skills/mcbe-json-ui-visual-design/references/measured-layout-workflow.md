# Measured layout workflow

Use this reference when translating visual evidence into JSON UI geometry.

## 1. Establish the coordinate space

Record the target profile, viewport, GUI scale, root rectangle, and any safe-area or clipping bounds. If a screenshot's scale or crop is unknown, normalize measurements as ratios and mark absolute pixels as provisional.

## 2. Measure structure before decoration

Capture the root, major regions, repeated controls, text boxes, and interaction states. For each relevant control, record:

- role and parent
- position and size
- anchor and offset intent
- padding and gap
- aspect ratio
- text role and available height
- texture dimensions and same-stem nine-slice metadata
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

## 5. Validate and report

Run only commands confirmed in the current checkout or the matching tool profile. Record unsupported properties and unresolved dynamic expressions. Report static preview evidence separately from Bedrock runtime evidence.
