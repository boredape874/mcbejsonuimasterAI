# Debugging Map

Use the first target `[UI][error]`, including its entire control path. Later missing-control, blank-screen, or hover errors are often consequences of that first failure.

## Evidence order

1. Confirm the active RP identity and `_ui_defs.json` registration.
2. Resolve the exact `namespace.control` chain at every `@` inheritance or factory boundary.
3. Validate each property against the actual control type and target-version evidence.
4. Trace collection ownership, item index, binding source, and button mapping.
5. Inspect resolved default/hover/pressed/focused states and pointer bounds.
6. Verify assets, visible protocol text, and layout/clipping.
7. Reproduce in Bedrock with mouse, controller, and touch where supported; inspect a clean target Content Log.

## Repeated failure matrix

| Symptom or log signature | Owning layer | Required diagnosis | Minimal correction |
|---|---|---|---|
| `UI control reference not found` or `Type not specified (or @-base not found)` | registration/reference | Follow the full control path, confirm file registration, namespace spelling, and the control definition before checking layout. | Register the file and use an exact qualified reference such as `instance@namespace.control`. |
| A key such as `item@$button_template` cannot resolve | template variable scope | Determine whether `$button_template` is declared in the inherited template scope and resolves to a qualified control id. | If it is not a real declared variable, use a literal `item@namespace.button_template`; do not use `$` merely as decoration. |
| `Expected variable not found in ancestor tree` on a button | variable scope at instantiation | Check which button property consumes the variable. A same-control TTS alias may be evaluated before the intended local variable is available; a child label and the button itself do not have the same ancestors. | Give the consuming button a literal TTS value, or place the needed variable on a real parent. Verify the actual ancestor chain and fresh client log. |
| `Unknown property` | control schema/version | Record the offending control type and property from the log, then confirm it in vanilla/schema/local working evidence. | Remove or relocate it to the control type that owns it. Do not replace it with another guessed property. |
| `collection_name` or `collection_index` is rejected | collection ownership | Find the collection/factory owner and the materialized item template. | Put `collection_name` on the verified `collection_panel`/factory owner and `collection_index` on each item instance; never put both on an unrelated plain panel. |
| Binding parse failure says a source property is required | binding | Inspect `binding_type`, `source_control_name`, `source_property_name`, and `target_property_name`. | A view expression needs `source_property_name`; a collection binding needs its verified binding name/collection. Do not mix the two shapes. |
| Screen opens blank although JSON parses | route/factory/data | Verify exact route token, fallback route, factory `control_ids`, collection payload, and active pack fingerprint. | Repair the first broken link; do not add placeholder panels that hide the missing route/data. |
| Hover remains active everywhere | hitbox/state/input | Compare the button's resolved rectangle with visual children, overlays, and pointer-consuming panels. Test each device path. | Keep pointer bounds on the actual button, make overlays non-intercepting by verified pattern, and scope state to the current collection index. |
| Hovering one item hides title/icon/text or changes every item | state composition | Diff default and hover trees and check whether state controls replace the full content subtree or share a global value. | Keep persistent content outside visual-state shells, switch only the background/accent, and bind state per item/index. |
| Search or close looks clickable but does nothing | input mapping | Trace the concrete `button_mappings`, destination button id, focus path, and cancel/close semantics for mouse, controller, and touch. | Reuse a verified vanilla/sample mapping and test all requested devices; a hover texture is not an input mapping. |
| Search only sees the selected category | data owner | Determine which collection is materialized while searching and whether original indices survive filtering. | Give search a full cross-category data owner or sender payload. A visual toggle cannot search buttons that are not present. |
| Input box renders but inline submit/reply does nothing | custom-form contract | Trace `common.text_edit_box`, custom-form collection ordering, submit/clear button events, sender form kind, and typed `response.formValues`. | Keep field order identical across RP/BP, parse each returned value by expected type, and handle cancel separately. |
| Hidden route, amount, or formatting marker appears in a label | protocol cleanup | List every displayed label derived from title/body/button text and identify the stripping boundary. | Parse once into hidden/raw and visible/display values; bind only the display value to labels and run the marker-leak check. |
| Value appears briefly, disappears, or never refreshes | competing binding/lifecycle | Find all writers to `#visible`, `#text`, animation start state, and form-open snapshot data. | Establish one owner for each target property; update/reopen at the real data lifecycle and do not use animation as data storage. |
| Animation runs immediately on screen open instead of after the game event | initial state/trigger lifecycle | Trace initial visible/alpha/frame values, controller entry, explicit start event, reset path, and terminal property ownership. | Keep the pre-trigger state explicit and start the animation only from the verified event/binding transition; do not infer timing from a static terminal-frame sample. |
| Magenta/blank texture, distorted panel, or icon covering text | asset/layout | Verify target-pack texture/atlas ownership, nine-slice metadata, base size, resolved rectangles, and clipping. | Use an existing target asset and measured regions; fix layout separately from data bindings. |
| A black divider/stripe crosses the form | inherited surface/viewport | Inspect inherited backgrounds, scroll viewport/track, clipping bounds, and zero/negative-size children in the resolved tree. | Remove or size the exact inherited surface; do not cover it with another panel before identifying the source. |

## Literal control reference vs template variable

These are different contracts:

```json
{ "row@namespace.button_template": { "collection_index": 0 } }
```

uses a literal, qualified control reference. By contrast:

```json
{ "row@$button_template": { "collection_index": 0 } }
```

is valid only when the surrounding template actually declares and supplies `$button_template` as a control reference. When the log reports the variable name itself as missing, first prove its declaration and override chain; otherwise replace it with the literal qualified control. Also verify that the referenced namespace file is registered.

## Bindings and visible marker cleanup

- `binding_type: "view"` requires a resolvable `source_property_name` expression and `target_property_name`.
- `binding_type: "collection"` reads from the named collection and must run in a valid materialized item context.
- Do not bind raw route/search/amount markers directly to visible text. Preserve raw data in a separate property, derive the display value once, then bind the display value.
- If two bindings or an animation target the same property, document precedence rather than assuming the last JSON entry wins at runtime.

## Hover and interaction proof

Inspect default, hover, pressed, focused/selected, and locked states separately. For collection items, verify at least two different indices so a shared/global state bug is visible. Confirm:

- the icon, title, price, discount, and count remain present in every intended state;
- the hit rectangle matches the card rather than the whole screen;
- tooltip controls do not consume pointer input unexpectedly;
- close, search, submit, and item-select actions have verified mappings;
- keyboard/mouse, controller focus, and touch paths behave as requested.

An arbitrary `hover_text` property is not a tooltip implementation. Use a verified `common.hover_text`/renderer or local working template and its documented bindings.

## Static and runtime evidence ladder

- JSON/JSONC parse: syntax only.
- Schema/static route/collection/marker checks: structural evidence only.
- Local resolved render: geometry and supported visual-state evidence only; dynamic binding/input may remain unresolved.
- Bedrock Content Log: client-load evidence for the active pack.
- Bedrock interaction capture: only evidence for clicks, focus, hover persistence, search scope, typed reply, live refresh, and animation lifecycle.

Never promote a static pass to runtime success. Record the exact pending interaction when Bedrock was not run.

## Compare against these sources

- `references/official/bedrock-samples-ui/server_form.json`
- `references/official/bedrock-samples-ui/ui_common.json`
- `references/source-packs/modern-cloud-ui-reference/ui/_ui_defs.json`
- `references/source-packs/modern-cloud-ui-reference/ui/server_form.json`
- `references/source-packs/rpg-server-ui-reference/ui/server_form.json`
- `references/patterns/server-form-direct-input/`
- `tests/fixtures/runtime-regressions/server-form/`

Use community/restricted packs for pattern evidence only and retain their provenance/licensing boundaries.
