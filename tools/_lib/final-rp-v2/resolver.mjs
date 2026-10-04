import { materializeEnvironment } from "./expression.mjs";
import { applyModifications } from "./modifications.mjs";

const clone = value => value == null ? value : structuredClone(value);
const object = value => value && typeof value === "object" && !Array.isArray(value);
const escapePointer = value => value.replaceAll("~", "~0").replaceAll("/", "~1");

export function resolveControl(index, reference, options = {}) {
  const unresolved = [...index.unresolved], maxDepth = options.maxDepth ?? 96;
  function resolveOne(name, inline = {}, namespace = options.namespace, env = options.environment || {}, ancestry = [], path = "", inlineEvidence = {}, recordOverride = null, inheritedNode = null) {
    const ref = splitReference(name, namespace), record = recordOverride || index.controls.get(`${ref.namespace}.${ref.id}`);
    if (ancestry.length >= maxDepth) return failure("max_depth", name, path);
    if (record && ancestry.includes(record.qualified)) return failure("inheritance_cycle", record.qualified, path);
    let base = record?.value || inheritedNode?.props || {}, baseProvenance = record ? resolvedEvidence(record.value, record, path) : rebaseEvidence(inheritedNode?.provenance, inheritedNode?.pointer ?? path, path), inheritedControls = inheritedNode?.controls || [];
    let modificationArrayOrigins = { ...inheritedNode?.modificationArrayOrigins };
    for (const key of ["controls", "bindings"]) if (Array.isArray(base[key])) modificationArrayOrigins[key] = "own";
    if (record?.modificationBoundary) unresolved.push({ kind: "unresolved_modification", impact: "blocking", control: record.qualified, pointer: `${path}/modifications`, reason: record.modificationBoundary });
    let inheritedEnvironment = collectVariables(base, inline, { ...inheritedNode?.variables, ...env });
    if (!record && !inline.type && !inheritedNode) unresolved.push({ kind: "unresolved_control", control: `${ref.namespace}.${ref.id}`, path });
    if (record?.overlayBase) {
      const inherited = resolveOne(name, {}, record.namespace, inheritedEnvironment, ancestry, path, {}, record.overlayBase);
      if (inherited) {
        modificationArrayOrigins = { ...inherited.modificationArrayOrigins, ...modificationArrayOrigins };
        const overlayMerge = mergeWithEvidence(inherited.props, base, inherited.provenance, baseProvenance, path);
        base = overlayMerge.value; baseProvenance = overlayMerge.provenance; inheritedControls = inherited.controls;
        inheritedEnvironment = { ...inherited.variables, ...inheritedEnvironment };
      }
    }
    if (record?.baseRef) {
      const inherited = resolveOne(record.baseRef, {}, record.namespace, inheritedEnvironment, [...ancestry, record.qualified], `${path}/@base`);
      if (inherited) {
        for (const key of Object.keys(inherited.modificationArrayOrigins || {})) modificationArrayOrigins[key] ??= "inherited";
        const inheritedMerge = mergeWithEvidence(inherited.props, base, rebaseEvidence(inherited.provenance, inherited.pointer, path), resolvedEvidence(record.value, record, path), path);
        base = inheritedMerge.value; baseProvenance = inheritedMerge.provenance; inheritedControls = mergeResolvedChildren(inherited.controls, inheritedControls);
      }
    }
    const variables = collectVariables(base, inline, inheritedEnvironment);
    const merged = mergeWithEvidence(record || inheritedNode ? stripVariables(base) : {}, stripVariables(inline), baseProvenance, inlineEvidence, path);
    const evaluated = materializeEnvironment(merged.value, variables, { control: record?.qualified || name });
    unresolved.push(...evaluated.unresolved);
    const props = applyConditionalVariables(evaluated.value), ownChildren = [];
    for (const key of ["controls", "bindings"]) if (Array.isArray(inline[key])) modificationArrayOrigins[key] = "own";
    const inheritedOnlyModifications = (Array.isArray(props.modifications) ? props.modifications : []).flatMap((entry, ordinal) => {
      const array = entry?.array_name || (entry?.control_name ? "controls" : null);
      return modificationArrayOrigins[array] === "inherited" ? [{ kind: "unresolved_modification", impact: "blocking", control: record?.qualified || name, pointer: `${path}/modifications/${ordinal}`, reason: "inherited_array_modification_unsupported", array }] : [];
    });
    unresolved.push(...inheritedOnlyModifications);
    if (props.modifications && !props.type && !record?.baseRef && !record?.overlayBase && !inheritedNode) unresolved.push({ kind: "unresolved_modification", impact: "blocking", control: record?.qualified || name, pointer: `${path}/modifications`, reason: "base_control_not_found" });
    for (const [entryIndex, entry] of (props.controls || []).entries()) for (const [childName, childInline] of Object.entries(entry)) {
      const childPath=`${path}/controls/${ownChildren.length}`,declarationPath=`${path}/controls/${entryIndex}/${escapePointer(childName)}`;
      ownChildren.push(resolveOne(materializeControlDeclaration(childName, variables), childInline, record?.namespace || namespace, variables, record ? [...ancestry, record.qualified] : ancestry, childPath, rebaseEvidence(merged.provenance,declarationPath,childPath), null, inheritedControls.find(child => child.id === childName.split("@")[0])));
    }
    materializeFormButtonChildren(props, ownChildren, variables, record?.namespace || namespace, record ? [...ancestry, record.qualified] : ancestry, path, options.fixture, resolveOne);
    const modified = applyModifications(inheritedOnlyModifications.length ? { ...props, modifications: [] } : props, mergeResolvedChildren(inheritedControls, ownChildren.filter(Boolean), true), {
      control: record?.qualified || name, pointer: path,
      resolveChildren(entries, ordinal) {
        return entries.flatMap((entry, at) => Object.entries(entry).map(([childName, childInline]) => {
          const valueIndex = Array.isArray(props.modifications[ordinal].value) ? `/${at}` : "";
          const sourcePath = `${path}/modifications/${ordinal}/value${valueIndex}/${escapePointer(childName)}`;
          return resolveOne(materializeControlDeclaration(childName, variables), childInline, record?.namespace || namespace, variables, record ? [...ancestry, record.qualified] : ancestry, sourcePath, rebaseEvidence(merged.provenance, sourcePath, sourcePath));
        })).filter(Boolean);
      }
    });
    unresolved.push(...modified.unresolved);
    if (modified.bindingOrigins) {
      const origins = {};
      modified.bindingOrigins.forEach((source, ordinal) => Object.assign(origins, rebaseEvidence(merged.provenance, source, `${path}/bindings/${ordinal}`)));
      for (const key of Object.keys(merged.provenance)) if (key.startsWith(`${path}/bindings/`)) delete merged.provenance[key];
      Object.assign(merged.provenance, origins);
    }
    delete props.controls;
    delete props.modifications;
    return { id: String(name).split("@")[0] || ref.id, qualified: record?.qualified || inheritedNode?.qualified || null, namespace: record?.namespace || inheritedNode?.namespace || namespace, pointer: path, props, variables, provenance: merged.provenance, modificationArrayOrigins, source: record ? { file: record.file, relative: record.relative, hash: record.hash, layer: record.layer } : inheritedNode?.source || null, controls: modified.controls };
  }
  function failure(kind, control, path) { unresolved.push({ kind, control, path }); return null; }
  const environment = { ...(index.globals || {}), ...(options.environment || {}) };
  const tree = resolveOne(reference, options.overrides || {}, options.namespace, environment);
  function assignFinalPointers(node, pointer = "") {
    if (!node) return;
    node.provenance = rebaseEvidence(node.provenance, node.pointer, pointer);
    node.pointer = pointer;
    node.controls.forEach((child, ordinal) => assignFinalPointers(child, `${pointer}/controls/${ordinal}`));
  }
  assignFinalPointers(tree);
  return { tree, unresolved };
}
function applyConditionalVariables(props) {
  if (!props || !Array.isArray(props.variables)) return props;
  for (const entry of props.variables) {
    if (!entry || entry.requires !== true) continue;
    for (const [key, value] of Object.entries(entry)) if (key !== "requires") props[key] = clone(value);
  }
  delete props.variables;
  return props;
}

function splitReference(name, namespace) {
  const raw = String(name).includes("@") ? String(name).slice(String(name).indexOf("@") + 1) : String(name);
  const dot = raw.indexOf(".");
  return dot < 0 ? { namespace, id: raw } : { namespace: raw.slice(0, dot), id: raw.slice(dot + 1) };
}
function materializeControlDeclaration(name, environment) {
  const source = String(name), at = source.indexOf("@");
  if (at < 0) return variableControlPart(source, environment);
  return `${variableControlPart(source.slice(0, at), environment)}@${variableControlPart(source.slice(at + 1), environment, true)}`;
}
function variableControlPart(value, environment, reference = false) {
  if (Object.hasOwn(environment, value) && typeof environment[value] === "string") return environment[value];
  if (reference) {
    const match = /(?:^|\.)(\$[A-Za-z_][\w.-]*)$/.exec(value);
    if (match && Object.hasOwn(environment, match[1]) && typeof environment[match[1]] === "string") return environment[match[1]];
  }
  return value;
}
function materializeFormButtonChildren(props, children, variables, namespace, ancestry, path, fixture, resolveOne) {
  if (props.collection_name !== "form_buttons" || !Array.isArray(fixture?.buttons)) return;
  const target = props.type === "grid" && typeof props.grid_item_template === "string"
    ? props.grid_item_template
    : typeof props.factory?.control_ids?.button === "string"
      ? props.factory.control_ids.button
      : typeof props.factory?.control_name === "string"
        ? props.factory.control_name
        : null;
  if (!target) return;
  const maximum = Number.isInteger(props.maximum_grid_items) ? props.maximum_grid_items : fixture.buttons.length;
  for (const item of fixture.buttons.slice(0, maximum)) {
    const index = Number.isInteger(item.index) ? item.index : fixture.buttons.indexOf(item);
    const alias = `collection_item_${index}@${String(target).replace(/^@/, "")}`;
    children.push(resolveOne(alias, { collection_index: index }, namespace, variables, ancestry, `${path}/collection/${index}`));
  }
}
function collectVariables(base, inline, inherited) {
  const result = {};
  function apply(source) { for (const [key, value] of Object.entries(source || {})) if (key.startsWith("$")) {
    const name = key.split("|default")[0];
    if (key.includes("|default")) { if (!Object.hasOwn(result, name)) result[name] = clone(value); }
    else result[name] = clone(value);
  } }
  apply(base);
  for (const [key, value] of Object.entries(inherited || {})) result[key] = clone(value);
  apply(inline);
  return result;
}
function stripVariables(value) { return Object.fromEntries(Object.entries(value || {}).filter(([key]) => !key.startsWith("$"))); }
function mergeResolvedChildren(base, override, completeOverrides = false) {
  const result = base.map(clone), positions = new Map(result.map((child, index) => [child.id, index]));
  for (const child of override) {
    if (!positions.has(child.id)) { positions.set(child.id, result.length); result.push(child); continue; }
    const at = positions.get(child.id), inherited = result[at];
    if (completeOverrides) { result[at] = clone(child); continue; }
    result[at] = { ...inherited, ...child, props: deepMerge(inherited.props, child.props), variables: { ...inherited.variables, ...child.variables }, provenance: { ...rebaseEvidence(inherited.provenance, inherited.pointer, child.pointer), ...child.provenance }, controls: mergeResolvedChildren(inherited.controls || [], child.controls || []) };
  }
  return result;
}
function deepMerge(base, override) {
  if (!object(base) || !object(override)) return clone(override);
  const result = clone(base);
  for (const [key, value] of Object.entries(override)) result[key] = object(result[key]) && object(value) ? deepMerge(result[key], value) : clone(value);
  return result;
}
function resolvedEvidence(value, record, pointer) {
  const result = {};
  function visit(item, at) {
    const suffix=at.startsWith(pointer)?at.slice(pointer.length):at;
    result[at] = { file: record.file, relative: record.relative, hash: record.hash, layer: record.layer, pointer: at, sourcePointer: `/${escapePointer(record.declaration)}${suffix}` };
    if (Array.isArray(item)) item.forEach((entry, index) => visit(entry, `${at}/${index}`));
    else if (object(item)) for (const [key, entry] of Object.entries(item)) visit(entry, `${at}/${escapePointer(key)}`);
  }
  visit(value, pointer);
  return result;
}
function rebaseEvidence(provenance, from, to) {
  const result={};
  for(const [pointer,evidence] of Object.entries(provenance||{}))if(pointer===from||pointer.startsWith(`${from}/`)){
    const rebased=`${to}${pointer.slice(from.length)}`;
    result[rebased]={...evidence,pointer:rebased};
  }
  return result;
}
function mergeWithEvidence(base, override, baseEvidence, overrideEvidence, pointer) {
  const value = clone(base), provenance = { ...baseEvidence };
  for (const [key, next] of Object.entries(override || {})) {
    const child = `${pointer}/${escapePointer(key)}`;
    if (key === "controls" && Array.isArray(value[key]) && Array.isArray(next)) {
      value[key] = mergeControlDeclarations(value[key], next);
    } else if (object(value[key]) && object(next)) {
      const merged = mergeWithEvidence(value[key], next, provenance, overrideEvidence, child);
      value[key] = merged.value; Object.assign(provenance, merged.provenance);
    } else value[key] = clone(next);
    provenance[child] = overrideEvidence[child] || { kind: "inline_override", pointer: child };
    for(const [descendant,evidence] of Object.entries(overrideEvidence||{}))if(descendant.startsWith(`${child}/`))provenance[descendant]=evidence;
  }
  return { value, provenance };
}

function mergeControlDeclarations(base, override) {
  const result = base.map(clone), positions = new Map();
  result.forEach((entry, index) => { const declaration = Object.keys(entry || {})[0]; if (declaration) positions.set(declaration.split("@")[0], index); });
  for (const entry of override) {
    const declaration = Object.keys(entry || {})[0], id = declaration?.split("@")[0];
    if (!id || !positions.has(id)) { if (id) positions.set(id, result.length); result.push(clone(entry)); continue; }
    const at = positions.get(id), oldDeclaration = Object.keys(result[at])[0];
    result[at] = { [declaration]: deepMerge(result[at][oldDeclaration], entry[declaration]) };
  }
  return result;
}

export function resolveRoute(index, fixture, control = "server_form.main_screen_content") {
  const record = index.controls.get(control), title = String(fixture?.title || ""), matches = [];
  if (!record) return { route: null, unresolved: [{ kind: "unresolved_control", control }] };
  const resolved = record.overlayBase || record.modificationBoundary || record.value.modifications ? resolveControl(index, control, { fixture }) : null;
  const declarations = resolved ? (resolved.tree?.controls || []).map(child => ({ [child.id]: child.variables })) : record.value.controls || [];
  for (const entry of declarations) for (const [name, value] of Object.entries(entry)) {
    if (typeof value?.$form_type === "string" && title.includes(value.$form_type) && value.$factory_control_ids?.long_form) matches.push({ name, token: value.$form_type, target: value.$factory_control_ids.long_form });
  }
  const diagnostics = resolved?.unresolved.filter(item => item.kind === "unresolved_modification") || [];
  return matches.length === 1 ? { route: matches[0], unresolved: diagnostics } : { route: matches[0] || null, unresolved: [...diagnostics, { kind: matches.length ? "ambiguous_route" : "route_not_found", title, matches: matches.length }] };
}
