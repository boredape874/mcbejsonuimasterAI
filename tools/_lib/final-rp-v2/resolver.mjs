import { materializeEnvironment } from "./expression.mjs";

const clone = value => value == null ? value : structuredClone(value);
const object = value => value && typeof value === "object" && !Array.isArray(value);
const escapePointer = value => value.replaceAll("~", "~0").replaceAll("/", "~1");

export function resolveControl(index, reference, options = {}) {
  const unresolved = [...index.unresolved], maxDepth = options.maxDepth ?? 96;
  function resolveOne(name, inline = {}, namespace = options.namespace, env = options.environment || {}, ancestry = [], path = "", inlineEvidence = {}) {
    const ref = splitReference(name, namespace), record = index.controls.get(`${ref.namespace}.${ref.id}`);
    if (ancestry.length >= maxDepth) return failure("max_depth", name, path);
    if (record && ancestry.includes(record.qualified)) return failure("inheritance_cycle", record.qualified, path);
    let base = record?.value || {}, baseProvenance = record ? resolvedEvidence(record.value, record, path) : {}, inheritedControls = [];
    const inheritedEnvironment = collectVariables(base, inline, env);
    if (!record && !inline.type) unresolved.push({ kind: "unresolved_control", control: `${ref.namespace}.${ref.id}`, path });
    if (record?.baseRef) {
      const inherited = resolveOne(record.baseRef, {}, record.namespace, inheritedEnvironment, [...ancestry, record.qualified], `${path}/@base`);
      if (inherited) {
        const inheritedMerge = mergeWithEvidence(inherited.props, base, inherited.provenance, resolvedEvidence(record.value, record, path), path);
        base = inheritedMerge.value; baseProvenance = inheritedMerge.provenance; inheritedControls = inherited.controls;
      }
    }
    const variables = collectVariables(base, inline, inheritedEnvironment);
    const merged = mergeWithEvidence(record ? stripVariables(base) : {}, stripVariables(inline), baseProvenance, inlineEvidence, path);
    const evaluated = materializeEnvironment(merged.value, variables, { control: record?.qualified || name });
    unresolved.push(...evaluated.unresolved);
    const props = applyConditionalVariables(evaluated.value), ownChildren = [];
    for (const [entryIndex, entry] of (props.controls || []).entries()) for (const [childName, childInline] of Object.entries(entry)) {
      const childPath=`${path}/controls/${ownChildren.length}`,declarationPath=`${path}/controls/${entryIndex}/${escapePointer(childName)}`;
      ownChildren.push(resolveOne(materializeControlDeclaration(childName, variables), childInline, record?.namespace || namespace, variables, record ? [...ancestry, record.qualified] : ancestry, childPath, rebaseEvidence(merged.provenance,declarationPath,childPath)));
    }
    materializeFormButtonChildren(props, ownChildren, variables, record?.namespace || namespace, record ? [...ancestry, record.qualified] : ancestry, path, options.fixture, resolveOne);
    delete props.controls;
    return { id: String(name).split("@")[0] || ref.id, qualified: record?.qualified || null, namespace: record?.namespace || namespace, props, variables, provenance: merged.provenance, source: record ? { file: record.file, relative: record.relative, hash: record.hash, layer: record.layer } : null, controls: mergeResolvedChildren(inheritedControls, ownChildren.filter(Boolean)) };
  }
  function failure(kind, control, path) { unresolved.push({ kind, control, path }); return null; }
  const environment = { ...(index.globals || {}), ...(options.environment || {}) };
  return { tree: resolveOne(reference, options.overrides || {}, options.namespace, environment), unresolved };
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
function mergeResolvedChildren(base, override) {
  const result = base.map(clone), positions = new Map(result.map((child, index) => [child.id, index]));
  for (const child of override) {
    if (!positions.has(child.id)) { positions.set(child.id, result.length); result.push(child); continue; }
    const at = positions.get(child.id), inherited = result[at];
    result[at] = { ...inherited, ...child, props: deepMerge(inherited.props, child.props), variables: { ...inherited.variables, ...child.variables }, provenance: { ...inherited.provenance, ...child.provenance }, controls: mergeResolvedChildren(inherited.controls || [], child.controls || []) };
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
  for (const entry of record.value.controls || []) for (const [name, value] of Object.entries(entry)) {
    if (typeof value?.$form_type === "string" && title.includes(value.$form_type) && value.$factory_control_ids?.long_form) matches.push({ name, token: value.$form_type, target: value.$factory_control_ids.long_form });
  }
  return matches.length === 1 ? { route: matches[0], unresolved: [] } : { route: matches[0] || null, unresolved: [{ kind: matches.length ? "ambiguous_route" : "route_not_found", title, matches: matches.length }] };
}
