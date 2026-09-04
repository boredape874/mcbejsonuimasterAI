import { evaluateExpression } from "./expression.mjs";

export function materializeCollectionGraph(tree, fixture = {}) {
  const unresolved = [], provenance = [], seen = new Map();
  const items = Array.isArray(fixture.buttons) ? fixture.buttons : [];
  for (const [ordinal, item] of items.entries()) {
    const sourceIndex = Number.isInteger(item?.index) ? item.index : ordinal;
    if (seen.has(sourceIndex)) unresolved.push({ kind: "duplicate_collection_index", impact: "blocking", sourceIndex, ordinals: [seen.get(sourceIndex), ordinal] });
    else seen.set(sourceIndex, ordinal);
  }
  function visit(node, inheritedIndex = null) {
    const props = structuredClone(node.props || {});
    const sourceIndex = Number.isInteger(props.collection_index) ? props.collection_index : inheritedIndex;
    const ordinal = sourceIndex == null ? null : items.findIndex((item, at) => (Number.isInteger(item?.index) ? item.index : at) === sourceIndex);
    const item = ordinal >= 0 ? items[ordinal] : null;
    const environment = collectionEnvironment(item, sourceIndex, fixture);
    for (const key of ["text", "texture", "texture_file_system", "visible", "enabled"]) {
      if (typeof props[key] !== "string" || !props[key].startsWith("#")) continue;
      const result = evaluateExpression(props[key], environment, { control: node.qualified || node.id, property: key });
      if (result.ok) props[key] = result.value; else unresolved.push(...result.unresolved);
    }
    for (const [bindingOrdinal, binding] of (props.bindings || []).entries()) {
      if (!binding || !["collection", "collection_details"].includes(binding.binding_type)) continue;
      const source = binding.binding_name || binding.source_property_name;
      const target = String(binding.binding_name_override || binding.target_property_name || source || "").replace(/^#/, "");
      if (!source || !target || !Object.hasOwn(environment, source)) {
        unresolved.push({ kind: "unresolved_collection_binding", impact: "blocking", control: node.qualified || node.id, bindingOrdinal, sourceIndex, binding: structuredClone(binding) });
        continue;
      }
      props[target] = environment[source];
    }
    const visible = props.visible !== false && item?.hidden !== true && !fixture.hiddenIndices?.includes(sourceIndex);
    const record = { control: node.qualified || node.id, pointer: node.pointer ?? null, collection: props.collection_name || null, sourceIndex, responseIndex: sourceIndex, materializedOrdinal: ordinal, filteredHidden: !visible, item: item ? structuredClone(item) : null, source: node.source ?? null };
    if (sourceIndex != null) provenance.push(record);
    return { ...node, props: { ...props, visible }, collectionIndex: sourceIndex, collectionOrdinal: ordinal, collectionItem: item, collectionProvenance: record, controls: (node.controls || []).map(child => visit(child, sourceIndex)) };
  }
  return { tree: visit(tree), unresolved, provenance };
}

function collectionEnvironment(item, index, fixture) {
  return { "#form_button_text": item?.text ?? "", "#form_button_texture": item?.texture ?? "", "#form_button_texture_file_system": item?.textureFileSystem ?? item?.texture_file_system ?? "", "#collection_index": index, "#collection_details": item?.details ?? fixture.collectionDetails?.[index] ?? null };
}
