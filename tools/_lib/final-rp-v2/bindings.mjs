const SOURCE_FIELDS = ["binding_name", "source_property_name"];

export function buildBindingGraph(tree, { globals = {}, fixture = {} } = {}) {
  const nodes = [], edges = [], unresolved = [];
  const byControl = new Map();
  (function collect(node, parent = null) {
    const id = node.qualified || node.id || node.pointer || "<anonymous>";
    const entry = { id, pointer: node.pointer ?? null, parent, source: node.source ?? null, provenance: node.provenance ?? {} };
    nodes.push(entry); byControl.set(id, node); if (node.id) byControl.set(node.id, node);
    for (const child of node.controls || []) collect(child, id);
  })(tree);
  (function visit(node) {
    const control = node.qualified || node.id || node.pointer || "<anonymous>";
    for (const [ordinal, binding] of (node.props?.bindings || []).entries()) {
      if (!binding || typeof binding !== "object") continue;
      const type = binding.binding_type || "view";
      const sourceProperty = SOURCE_FIELDS.map(key => binding[key]).find(Boolean) ?? null;
      const targetProperty = binding.binding_name_override || binding.target_property_name || sourceProperty;
      const sourceControl = binding.source_control_name || (type === "global" ? "$global" : control);
      const pointer = `${node.pointer ?? ""}/bindings/${ordinal}`;
      const provenance = provenanceFor(node, pointer);
      const edge = { id: `${control}:${ordinal}`, type, sourceControl, sourceProperty, targetControl: control, targetProperty, collection: binding.binding_collection_name ?? null, pointer, provenance, binding: structuredClone(binding) };
      edges.push(edge);
      const endpointRequired = type !== "collection_details";
      if (endpointRequired && (!sourceProperty || !targetProperty)) unresolved.push({ kind: "unresolved_binding_endpoint", impact: "blocking", control, pointer, edge });
      if (binding.source_control_name && !byControl.has(binding.source_control_name)) unresolved.push({ kind: "unresolved_binding_source_control", impact: "blocking", control, pointer, sourceControl: binding.source_control_name, provenance });
      if (type === "global" && sourceProperty && !Object.hasOwn(globals, sourceProperty) && !Object.hasOwn(globals, sourceProperty.replace(/^#/, "$"))) unresolved.push({ kind: "unresolved_global_binding", impact: "blocking", control, pointer, sourceProperty, provenance });
      if ((type === "collection" || type === "collection_details") && !edge.collection && !fixture.buttons) unresolved.push({ kind: "unresolved_collection_source", impact: "blocking", control, pointer, provenance });
    }
    for (const child of node.controls || []) visit(child);
  })(tree);
  return { schema: "mcbe-jsonui-ai-kit/binding-graph@1", nodes, edges, unresolved };
}

function provenanceFor(node, pointer) {
  const direct = node.provenance?.[pointer] || node.provenance?.[pointer.replace(node.pointer || "", "")];
  if (direct) return direct;
  const inherited = Object.values(node.provenance || {}).find(value => value?.file || value?.hash || value?.sourcePointer);
  return inherited || node.source || null;
}
