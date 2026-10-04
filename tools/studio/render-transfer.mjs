// The full tree stays in the renderer; detailed binding evidence stays in its report file.
// Studio consumes flat geometry and immediate declaration/property origins.
export function compactStudioRender(result) {
  if (!result.editorLayout) return result;
  const { layout, ...editor } = result.editorLayout;
  const nodes = layout.nodes.map(node => {
    const pointer = node.pointer ?? '';
    const provenance = Object.fromEntries(Object.entries(node.provenance || {}).filter(([path]) => path === pointer || (path.startsWith(pointer + '/') && !path.slice(pointer.length + 1).includes('/'))));
    const { controls, modifications, ...props } = node.props || {};
    return { id:node.id, qualified:node.qualified, pointer, props, provenance, rect:node.rect, clip:node.clip, alpha:node.alpha, layer:node.layer, visible:node.visible };
  });
  const controls = Object.fromEntries(Object.entries(result.controls || {}).map(([key, control]) => {
    const { provenance, source, ...metrics } = control;
    const origin = source && Object.fromEntries(Object.entries(source).filter(([name]) => ['file','relative','hash','layer','pointer','namespace'].includes(name)));
    return [key, { ...metrics, ...(origin ? {source:origin} : {}) }];
  }));
  const { bindingGraph, ...report } = result;
  return { ...report, bindingGraphSummary:bindingGraph && {schema:bindingGraph.schema,nodeCount:bindingGraph.nodes?.length||0,edgeCount:bindingGraph.edges?.length||0,unresolvedCount:bindingGraph.unresolved?.length||0,detailReport:result.reportPath}, controls, render:result.render && {...result.render,controls}, editorLayout:{...editor,layout:{viewport:layout.viewport,nodes,unresolved:layout.unresolved}} };
}
