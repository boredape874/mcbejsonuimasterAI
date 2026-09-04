import { evaluateExpression } from "./expression.mjs";
import { materializeCollectionGraph } from "./collections.mjs";
import { deriveInteractionState, validateStateContentPersistence } from "./interaction-state.mjs";

export function materializeCollections(tree, fixture = {}) {
  return materializeCollectionGraph(tree, fixture);
}

export function projectInteractionState(tree, fixture = {}, options = {}) {
  const unresolved = [], diagnostics = [];
  const requestedState=options.interactionState==="focus"?"focused":options.interactionState;
  let unindexedStateApplied=false;
  const sourceStates = new Map();
  (function collect(node) {
    const props=node?.props||{}, toggle=fixture.toggleStates?.[props.toggle_name] ?? fixture.toggleStates?.[node.id] ?? props.toggle_default_state;
    if(props.type==="toggle"||toggle!==undefined){const state={"#toggle_state":Boolean(toggle)};sourceStates.set(node.id,state);if(node.qualified)sourceStates.set(node.qualified,state);if(props.toggle_name)sourceStates.set(props.toggle_name,state);}
    if(props.type==="edit_box"||props.type==="input_panel"){const value=fixture.textInputs?.[node.id]??fixture.searchText??"",state={"#item_name":String(value)};sourceStates.set(node.id,state);if(node.qualified)sourceStates.set(node.qualified,state);}
    for(const child of node?.controls||[])collect(child);
  })(tree);
  function visit(node, parentVisible = true, inheritedIndex = null) {
    const props = structuredClone(node.props || {}), index = node.collectionIndex;
    const effectiveIndex = index ?? inheritedIndex, item = node.collectionItem || (effectiveIndex == null ? null : fixture.buttons?.find(entry => entry.index === effectiveIndex) ?? fixture.buttons?.[effectiveIndex]);
    const locked = Boolean(item?.locked || fixture.lockedIndices?.includes(effectiveIndex)), selected = Boolean(item?.selected || fixture.selectedIndices?.includes(effectiveIndex) || String(item?.text || "").includes("|selected"));
    const stateTargets = controlTargets(props, node.controls || []);
    const model=deriveInteractionState({...node,props,collectionItem:item},fixture,{requestedState,effectiveIndex,index:effectiveIndex});
    let state = model.state;
    if(effectiveIndex==null&&state!=="default"&&stateTargets.size&&!unindexedStateApplied){unindexedStateApplied=true;diagnostics.push({kind:"unindexed_interaction_state_sample",control:node.qualified||node.id,state});}
    if(state==="default"&&effectiveIndex==null&&!unindexedStateApplied&&stateTargets.size&&["hover","pressed","focused","selected","locked"].includes(requestedState)){state=requestedState;unindexedStateApplied=true;diagnostics.push({kind:"unindexed_interaction_state_sample",control:node.qualified||node.id,state});}
    const environment = {
      "#hovered": state === "hover",
      "#pressed": state === "pressed",
      "#focused": state === "focused",
      "#locked": locked,
      "#selected": selected,
      "#form_button_text": item?.text ?? "",
      "#form_button_texture": item?.texture ?? "",
      "#form_button_texture_file_system": item?.textureFileSystem ?? item?.texture_file_system ?? "",
      "#title_text": fixture.title ?? "",
      "#form_text": fixture.body ?? "",
      "#item_name": fixture.searchText ?? "",
      "#query": fixture.searchText ?? "",
      ...Object.fromEntries(Object.entries(props).map(([key, value]) => [`#${key}`, value]))
    };
    for (const binding of props.bindings || []) {
      if (binding?.binding_type !== "view" || !binding.target_property_name) continue;
      const sourceEnvironment = binding.source_control_name ? { ...environment, ...(sourceStates.get(binding.source_control_name) || {}) } : environment;
      const result = evaluateExpression(binding.source_property_name, sourceEnvironment, { control: node.qualified || node.id, property: binding.target_property_name });
      if (!result.ok) { unresolved.push(...result.unresolved); continue; }
      props[binding.target_property_name.replace(/^#/, "")] = result.value;
    }
    for (const key of ["text", "texture", "texture_file_system"]) {
      const source = props[key];
      if (typeof source !== "string" || !source.startsWith("#")) continue;
      const local = source.slice(1);
      if (Object.hasOwn(props, local)) props[key] = props[local];
      else if (Object.hasOwn(environment, source)) props[key] = environment[source];
    }
    sampleAnimations(node, props, options.index, unresolved, diagnostics);
    const childIds = new Set((node.controls || []).map(child => child.id));
    for (const [slot, target] of stateTargets) if (!childIds.has(target)) unresolved.push({ kind: "unresolved_state_control", control: node.qualified || node.id, state: slot, target });
    const activeTarget = chooseTarget(state, stateTargets);
    const visible = parentVisible && props.visible !== false && props.ignored !== true;
    const controls = (node.controls || []).map(child => {
      const recognized = [...stateTargets.values()].includes(child.id) || KNOWN_STATE_NAMES.has(child.id);
      if (stateTargets.size && looksStateful(child.id) && !recognized) unresolved.push({ kind: "unresolved_state_control", control: node.qualified || node.id, child: child.id });
      return visit(child, visible && (!recognized || child.id === activeTarget), effectiveIndex);
    });
    unresolved.push(...validateStateContentPersistence({...node,props,controls}));
    return { ...node, props, collectionIndex: effectiveIndex, collectionItem: item, interaction:model, state, visible, controls };
  }
  return { tree: visit(tree), unresolved, diagnostics };
}

const STATE_PROPERTIES = new Map([["default_control","default"],["hover_control","hover"],["pressed_control","pressed"],["locked_control","locked"],["focus_control","focused"],["focused_control","focused"],["selected_control","selected"]]);
const KNOWN_STATE_NAMES = new Set(["default","hover","pressed","locked","focus","focused","selected"]);
function controlTargets(props, children) {
  const targets = new Map();
  for (const [property, state] of STATE_PROPERTIES) if (typeof props[property] === "string" && props[property]) targets.set(state, props[property]);
  const namedChildren = children.filter(child => KNOWN_STATE_NAMES.has(child.id)).length;
  if (targets.size || namedChildren >= 2) for (const name of KNOWN_STATE_NAMES) if (!targets.has(name) && children.some(child => child.id === name)) targets.set(name, name);
  return targets;
}
function chooseTarget(state, targets) { return targets.get(state) ?? targets.get(state === "focused" ? "hover" : state === "selected" ? "default" : "default"); }
function looksStateful(id) { return typeof id === "string" && /(state|control|default|hover|press|lock|focus|select)/i.test(id); }
function resolveAnimationTerminal(index, start, expectedType) {
  const visited = new Set(), chain = [], samples = [];
  let qualified = start;
  while (qualified && !visited.has(qualified)) {
    visited.add(qualified);
    const record = index?.controls?.get(qualified);
    if (!record) return { ok: false, reason: "missing_animation", chain };
    if (record.value?.anim_type !== expectedType) return { ok: false, reason: "unsupported_animation_type", chain };
    const terminalValue = record.value.to;
    const validTerminal = Number.isFinite(terminalValue) || (Array.isArray(terminalValue) && terminalValue.length === 2 && terminalValue.every(Number.isFinite));
    if (!validTerminal) return { ok: false, reason: "dynamic_terminal", chain };
    chain.push({ animation: qualified, file: record.file, hash: record.hash });
    samples.push(structuredClone(terminalValue));
    const next = typeof record.value.next === "string" && record.value.next.startsWith("@") ? record.value.next.slice(1) : null;
    if (!next) return { ok: true, value: record.value.to, chain, cyclic: false };
    qualified = next;
  }
  if (qualified && visited.has(qualified)) return { ok: true, value: expectedType === "alpha" ? Math.max(...samples) : samples.at(-1), chain, cyclic: true };
  return { ok: false, reason: "dynamic_terminal", chain };
}
function sampleAnimations(node, props, index, unresolved, diagnostics) {
  for (const [property, value] of Object.entries(props)) {
    if (typeof value !== "string" || !value.startsWith("@")) continue;
    const qualified = value.slice(1), expectedType = property === "alpha" ? "alpha" : property === "size" ? "size" : null;
    const terminal = expectedType ? resolveAnimationTerminal(index, qualified, expectedType) : null;
    if (terminal?.ok) {
      props[property] = terminal.value;
      const last = terminal.chain.at(-1) || {};
      const evidence = { kind: "animation_terminal_sample", property, animation: qualified, value: terminal.value, file: last.file, hash: last.hash, chain: terminal.chain.map(item => item.animation), cyclic: terminal.cyclic };
      node.provenance = { ...(node.provenance || {}), [`/${property}`]: evidence };
      diagnostics.push({ control: node.qualified || node.id, ...evidence });
    } else unresolved.push({ kind: "unresolved_animation", control: node.qualified || node.id, property, animation: qualified, reason: terminal?.reason || "unsupported_animation_type" });
  }
}
