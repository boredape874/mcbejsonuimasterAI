# Server Form Map

## End-to-end contract

Trace every form in this order:

```text
BP form kind and ordered payload
  -> exact title route/token
  -> server_form factory control id and fallback
  -> qualified RP control reference
  -> collection owner
  -> per-item collection_index / per-field order
  -> button mapping or submit event
  -> BP response index/type/cancel handling
```

Do not stop at a visually correct factory. A broken link later in the chain can produce a blank form, wrong callback, inert button, or mixed typed response.

## Registration and control references

- Confirm the routed file is in `_ui_defs.json` and its namespace matches the reference exactly.
- Use a literal qualified reference when the template is fixed: `instance@namespace.control`.
- Use `instance@$template_variable` only when the surrounding template declares that variable and it resolves to a qualified control id. An undefined `$button_template` is not a fallback alias.
- For `UI control reference not found`, start at the full Content Log control path and verify each namespace/factory hop. Do not add an empty control with the missing name just to silence the log.

## Title route, fallback, and button indices

The sender and RP must share one explicit contract:

- form kind: action, message, or modal/custom;
- exact title token/prefix/suffix used for routing;
- the normal vanilla fallback when the token does not match;
- ordered semantic button ids or modal field ids;
- cancel/close behavior;
- original server callback index after filtering or visual rearrangement.

Changing tab order, search result order, or hiding a button must not silently renumber the server callback. Preserve the original collection index or maintain a verified semantic-id-to-sender-index map. Test first, middle, last, and canceled paths.

## Collection ownership

For manual indexed server-form materialization, keep ownership explicit:

```json
{
  "items": {
    "type": "collection_panel",
    "collection_name": "form_buttons",
    "controls": [
      { "item@namespace.form_button": { "collection_index": 0 } }
    ]
  }
}
```

This shape is evidenced by the included furnace-form reference. A factory-driven form may use a different verified wrapper, but the responsibility remains the same: the collection/factory owner owns `collection_name`, while the item template or materialized instance owns `collection_index` and collection bindings. A plain wrapper/card does not become the collection owner by receiving both properties.

Unsupported-property errors are authoritative for the active client. Examples such as arbitrary `hover_text`, `grid_item_size`, or collection properties on the wrong control must be removed or moved according to verified evidence, not renamed by guesswork.

## Global search across categories

Define search scope before designing the view:

- **current-category**: filters only the active category collection;
- **all-categories**: filters one canonical collection containing every searchable product, with category and original callback identity retained.

Switching to a search-looking panel does not load missing products. Global search therefore requires a full data owner: either the BP sends the complete searchable payload, or the RP consumes an already materialized canonical collection. Category-only forms cannot become global search by toggling visibility.

For every result preserve:

- stable semantic id;
- original server callback index;
- category id;
- display/search key;
- icon/price/discount payload needed by the result view.

Filter visibility separately from callback identity. Case normalization, especially Korean/mixed text, is unsupported unless a verified helper and both query/key normalization paths are present; otherwise state the search is case-sensitive.

## Search edit box and inline reply

Use a verified `common.text_edit_box` or vanilla option-text-edit pattern. A view binding that computes visibility must include `source_property_name` and `target_property_name`; collection values must be acquired by valid collection bindings first.

For direct submit in the same screen:

1. Use the custom/modal form route and preserve the `custom_form` collection's field order.
2. Instantiate the edit box with focus enabled by the verified sample.
3. Map the visible submit/clear controls to the verified custom-form events (the local direct-input sample uses `button.submit_custom_form` and `button.clear_custom_form`).
4. In BP, handle `response.canceled` before reading values.
5. Read `response.formValues` by declared field order and expected type. Do not coerce the entire mixed array or assume every entry is a string.
6. Test empty, Unicode, maximum-length, cancel, clear, mouse, controller, and touch paths.

Keep the sender's modal fields and the RP's custom-form items in the same order. A beautifully rendered input cannot repair an order/type mismatch.

For a custom form whose artwork contains separate columns or field wells, the vanilla full-width `server_form.generated_contents` stack is not automatically a valid layout. A verified alternative is:

- one `collection_panel` that owns `collection_name: "custom_form"`;
- one materialized `field_N@server_form.custom_input|custom_dropdown|custom_slider|custom_toggle` per sender field;
- the original `collection_index` on each materialized field;
- absolute or constrained placement inside the measured field region without changing sender order.

This preserves native field behavior while allowing custom geometry. Validate that no field hitbox overlaps another column or submit/close control, and test returned `formValues` by type. An offline renderer without `custom_form` fixture data may show unresolved bindings or open-state dropdown artifacts; do not "fix" those by replacing native templates with inert images.

## Category, detail, and scrolling behavior

- Model category selection and detail-item selection as different response stages when their data owners or button indices differ. A BP may open a category route, receive a category index, then reopen a detail route with a new ordered payload.
- A selected-detail panel on the right must consume a stable materialized index or semantic id. Clicking a left row should change that selected payload and reopen or refresh by a verified mechanism; static right-side text is not selection behavior.
- Variable detail rows belong to a `form_buttons` collection/factory inside a vertical stack hosted by a verified scrolling panel. Test with more rows than fit, and confirm row positions change under wheel/drag/controller input.
- Keep the scroll rail and handle inside the list viewport. Do not confuse successful ModalForm slider dragging with successful content scrolling; they use different controls, data, and response evidence.

## Hover and persistent card content

A button's default/hover/pressed/focused controls should change the state surface, not replace its entire information model. Keep icon, title, price, discount, count, and accessibility text in a persistent subtree unless the intended state explicitly changes them.

For collection buttons:

- bind hover/focus state to the current item/index, not one global value;
- verify two different items do not enter hover together;
- keep state control rectangles identical unless measured evidence requires otherwise;
- use a verified `common.hover_text` or renderer pattern rather than an invented `hover_text` property;
- ensure tooltip/overlay controls do not consume clicks intended for the card.

## Close, search, and device input

For every interactive control record:

- `from_button_id` and `to_button_id` mapping;
- mouse/keyboard activation;
- controller focus and select/back behavior;
- touch activation and focus fallback;
- cancel/close result expected by BP;
- pointer/focus rectangle.

Build a focus graph per input mode. Reject missing targets, unreachable submit/clear/close controls, unintended cycles without an exit, conflicting select/cancel mappings, and overlays that absorb the required path. A list of mappings is not proof that the graph is traversable.

Search and close textures alone are not buttons. Confirm that no full-screen overlay steals input and that the close path reaches the server form's intended cancel/dismiss behavior. Test search focus entry/exit and controller navigation between tabs, results, search, and close.

If search mode has its own `X` or clear control, keep that event distinct from the outer form close/cancel mapping. Verify separately: clear query, exit search while retaining the form, dismiss the entire form, and the value/focus state after each path.

## Marker and visible text cleanup

Routing, amount, search, and formatting markers are protocol data. Parse them into hidden/raw properties and derive separate visible labels. Do not bind the raw title/body/button string to a display label. Run marker-leak checks and inspect all states; a marker hidden in default may reappear in hover or search results.

## Validation boundary

Required static checks when available:

- JSON/JSONC parse and namespace/control route trace;
- server-form contract check for title, form kind, semantic order, events, and search scope;
- collection owner/index validation;
- unsupported-property and binding-source diagnostics;
- visible protocol-marker leak check;
- resolved default/hover/pressed/focused render.

Required Bedrock proof for completion:

- active RP loads with no target `[UI][error]`;
- route and vanilla fallback both open;
- first/middle/last item callbacks match sender indices;
- category search and global search match the declared scope;
- close/cancel, typed reply, hover/focus, and requested device inputs work;
- live values refresh at their real lifecycle.

Static validation cannot prove any of those input/runtime behaviors.

## Primary evidence

- `references/official/bedrock-samples-ui/server_form.json`
- `references/official/bedrock-samples-ui/ui_common.json`
- `references/patterns/server-form-direct-input/`
- `tests/fixtures/runtime-regressions/server-form/`
- `references/source-packs/modern-cloud-ui-reference/ui/server_form.json`
- `references/source-packs/rpg-server-ui-reference/ui/server_form.json`
- `references/source-packs/rpg-server-ui-reference/ui/chest_server_form.json`
- `references/source-packs/rpg-server-ui-reference/ui/furnace_server_form.json`
- `references/source-packs/rpg-server-ui-reference/ui/chest_inventory_system.json`
- `references/source-packs/farm-ui-variants/GfE8ULhgL4I/ui/server_form.json`
- `references/source-packs/farm-ui-variants/GfE8ULhgL4I/ui/chest_screen.json`
- `references/external/EasyUIBuilder/ui/server_form.json`
- `references/external/Chest-UI/RP/ui/server_form.json`
- `references/external/Chest-UI/RP/ui/chest_server_form.json`
- `references/external/Chest-UI/RP/ui/furnace_server_form.json`
- `docs/40-server-form-example-index.md`

Restricted/community sources may demonstrate structure, but their code/assets, namespace names, hidden markers, and licensing do not become project defaults.

## Established pattern routes

- Search bar: `common.text_edit_box` plus a verified visibility binding against `#form_button_text`; case normalization requires the same verified normalization on query and key.
- Dialogue shell: title route, `common_dialogs.main_panel_no_buttons`, collection payload extraction, and explicit skip/visibility state.
- Custom button grid: `form_buttons` owner, stable original indices, state surfaces, and verified item texture renderer.
- Image row: hidden marker payload parsed into a display-safe texture path and label; raw marker never reaches visible text.
- Polished header: fixed shell, header factory, close mapping, and state buttons, with external helper namespaces rewritten or intentionally included.
- Vanilla fallback and compact/premium examples: `docs/47-custom-auxid-and-form-progress.md`, `docs/50-advanced-ui-reference-analysis.md`, `docs/51-compact-crafting-pocket-ui-reference.md`, `docs/60-advanced-ui-set-special-ui-reference.md`, `docs/61-advanced-ui-set-file-pattern-routes.md`, `docs/62-special-form-device-ui-patterns.md`, and `docs/63-premium-form-gallery.md`.
- Visual direction: `docs/39-design-recommendation-catalog.md` and `docs/40-server-form-example-index.md`.

Optional restricted neutral mirrors remain under `references/restricted/advanced-ui-set-ui/`. Select one exact routed form/template only after its neutral catalog entry matches the task; do not bulk-load or copy the suite.
