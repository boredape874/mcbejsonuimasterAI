import { access, readdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { readJsonc } from "./jsonc.mjs";

const ANCHORS = {
  top_left: [0, 0], top_middle: [0.5, 0], top_right: [1, 0],
  left_middle: [0, 0.5], center: [0.5, 0.5], right_middle: [1, 0.5],
  bottom_left: [0, 1], bottom_middle: [0.5, 1], bottom_right: [1, 1],
};

async function exists(path) { try { await access(path); return true; } catch { return false; } }
function clone(value) { return value == null ? value : structuredClone(value); }
function isObject(value) { return value && typeof value === "object" && !Array.isArray(value); }
function merge(base, override) {
  if (!isObject(base) || !isObject(override)) return clone(override);
  const out = clone(base);
  for (const [key, value] of Object.entries(override)) out[key] = isObject(value) && isObject(out[key]) ? merge(out[key], value) : clone(value);
  return out;
}
function splitControlRef(value, currentNamespace) {
  const text = String(value || "");
  const at = text.indexOf("@");
  const raw = at >= 0 ? text.slice(at + 1) : text;
  const dot = raw.indexOf(".");
  return dot >= 0 ? { namespace: raw.slice(0, dot), id: raw.slice(dot + 1) } : { namespace: currentNamespace, id: raw };
}
function substitute(value, vars, unresolved, path) {
  if (typeof value === "string" && value.startsWith("$") && Object.hasOwn(vars, value)) return clone(vars[value]);
  if (Array.isArray(value)) return value.map((item, index) => substitute(item, vars, unresolved, `${path}/${index}`));
  if (!isObject(value)) return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) out[key] = substitute(item, vars, unresolved, `${path}/${key}`);
  return out;
}
function variableDefaults(node, inherited) {
  const vars = { ...inherited };
  for (const [key, value] of Object.entries(node || {})) {
    if (!key.startsWith("$")) continue;
    const pipe = key.indexOf("|default");
    const name = pipe >= 0 ? key.slice(0, pipe) : key;
    if (pipe >= 0 && !Object.hasOwn(vars, name)) vars[name] = clone(value);
    else if (pipe < 0) vars[name] = clone(value);
  }
  return vars;
}
function cleanVariables(node) {
  return Object.fromEntries(Object.entries(node || {}).filter(([key]) => !key.startsWith("$") || !key.includes("|default")));
}
function applySimpleVisibility(node, item, unresolved, path) {
  if (!item || !Array.isArray(node.bindings)) return;
  for (const binding of node.bindings) {
    if (binding?.binding_type !== "view" || binding.target_property_name !== "#visible") continue;
    const expression = String(binding.source_property_name || ""), text = String(item.text || "");
    if (expression.includes("'|selected'")) node.visible = text.includes("|selected");
    else if (expression.includes("'WIN'")) node.visible = text.includes("WIN");
    else unresolved.push({ kind: "unresolved_visibility_expression", path, expression });
  }
}

export async function loadRpProject(rpRoot, options = {}) {
  const root = resolve(rpRoot), vanillaRoot = options.vanillaRoot ? resolve(options.vanillaRoot) : null;
  const files = [], controls = new Map(), diagnostics = [];
  async function loadRoot(sourceRoot, sourceKind, overwrite) {
    const defsPath = join(sourceRoot, "ui", "_ui_defs.json"), defs = await readJsonc(defsPath);
    for (const relative of defs.ui_defs || []) {
      const file = join(sourceRoot, ...String(relative).split("/"));
      if (!(await exists(file))) { diagnostics.push({ kind: "missing_ui_def", sourceKind, file: relative }); continue; }
      let document;
      try { document = await readJsonc(file); } catch (error) { diagnostics.push({ kind: "invalid_ui_def", sourceKind, file: relative, message: error.message }); continue; }
      const namespace = document.namespace;
      files.push({ relative, file, namespace, document, sourceKind });
      if (!namespace) { diagnostics.push({ kind: "missing_namespace", sourceKind, file: relative }); continue; }
      for (const [id, value] of Object.entries(document)) if (id !== "namespace") {
        const key = `${namespace}.${id}`;
        if (overwrite || !controls.has(key)) controls.set(key, { namespace, id, value, file, relative, sourceKind });
      }
    }
  }
  if (vanillaRoot) await loadRoot(vanillaRoot, "vanilla", false);
  await loadRoot(root, "target", true);
  return { rpRoot: root, vanillaRoot, textureRoots: [root, ...(vanillaRoot ? [vanillaRoot] : [])], defsPath: join(root, "ui", "_ui_defs.json"), files, controls, diagnostics };
}

export function resolveControl(project, controlRef, options = {}) {
  const unresolved = [...project.diagnostics], maxDepth = options.maxDepth ?? 80;
  const rootNamespace = options.namespace || (String(controlRef).includes(".") ? String(controlRef).split(".")[0].replace(/^@/, "") : null);
  const fixture = options.fixture || {};

  function resolveOne(name, inline = {}, currentNamespace = rootNamespace, inheritedVars = {}, ancestry = [], path = "root", inheritedCollectionIndex = null) {
    if (ancestry.length > maxDepth) { unresolved.push({ kind: "max_depth", path, control: name }); return null; }
    const ref = splitControlRef(name, currentNamespace), qualified = `${ref.namespace}.${ref.id}`;
    const record = project.controls.get(qualified);
    if (!String(name).includes("@") && inline?.type) {
      const vars = variableDefaults(inline, inheritedVars), combined = substitute(cleanVariables(inline), vars, unresolved, path), children = [];
      const collectionIndex = Number.isInteger(combined.collection_index) ? combined.collection_index : inheritedCollectionIndex;
      for (const entry of combined.controls || []) for (const [childName, childInline] of Object.entries(entry)) {
        const child = resolveOne(childName, childInline, currentNamespace, vars, ancestry, `${path}/controls/${children.length}`, collectionIndex);
        if (child) children.push(child);
      }
      delete combined.controls;
      const item = collectionIndex == null ? null : fixture.buttons?.find((button) => button.index === collectionIndex) ?? fixture.buttons?.[collectionIndex];
      if (item) { if (combined.text === "#form_button_text") combined.text = item.text ?? ""; if ((!combined.texture || String(combined.texture).startsWith("#")) && item.texture) combined.texture = item.texture; applySimpleVisibility(combined, item, unresolved, path); }
      return { id: String(name), qualified: null, namespace: currentNamespace, source: null, vars, props: combined, collectionIndex, fixture: item || null, controls: children };
    }
    if (!record) {
      unresolved.push({ kind: "unresolved_control", path, control: qualified });
      const combined = substitute(cleanVariables(inline), inheritedVars, unresolved, path), collectionIndex = Number.isInteger(combined.collection_index) ? combined.collection_index : inheritedCollectionIndex, children = [];
      for (const entry of combined.controls || []) for (const [childName, childInline] of Object.entries(entry)) {
        const child = resolveOne(childName, childInline, currentNamespace, inheritedVars, ancestry, `${path}/controls/${children.length}`, collectionIndex);
        if (child) children.push(child);
      }
      delete combined.controls;
      return { id: String(name).split("@")[0] || ref.id, qualified, namespace: ref.namespace, source: null, props: combined, collectionIndex, controls: children };
    }
    if (ancestry.includes(qualified)) { unresolved.push({ kind: "inheritance_cycle", path, control: qualified }); return null; }
    const vars = variableDefaults(record.value, inheritedVars);
    for (const [key, value] of Object.entries(inline || {})) if (key.startsWith("$") && !key.includes("|default")) vars[key] = clone(value);
    let combined = merge(cleanVariables(record.value), cleanVariables(inline));
    combined = substitute(combined, vars, unresolved, path);
    const ownCollectionIndex = Number.isInteger(combined.collection_index) ? combined.collection_index : inheritedCollectionIndex, children = [];
    for (const entry of combined.controls || []) {
      for (const [childName, childInline] of Object.entries(entry)) {
        const child = resolveOne(childName, childInline, record.namespace, vars, [...ancestry, qualified], `${path}/controls/${children.length}`, ownCollectionIndex);
        if (child) children.push(child);
      }
    }
    delete combined.controls;
    const collectionIndex = ownCollectionIndex;
    const item = collectionIndex == null ? null : fixture.buttons?.find((button) => button.index === collectionIndex) ?? fixture.buttons?.[collectionIndex];
    if (item) {
      if (combined.text === "#form_button_text") combined.text = item.text ?? "";
      if ((!combined.texture || String(combined.texture).startsWith("#")) && item.texture) combined.texture = item.texture;
      applySimpleVisibility(combined, item, unresolved, path);
    }
    return { id: String(name).split("@")[0] || ref.id, qualified, namespace: record.namespace, source: record.relative, vars, props: combined, collectionIndex, fixture: item || null, controls: children };
  }
  const tree = resolveOne(controlRef, options.overrides || {}, rootNamespace, options.variables || {});
  return { tree, unresolved };
}

export function resolveServerFormRoute(project, fixture) {
  const server = project.controls.get("server_form.main_screen_content");
  if (!server) return { route: null, unresolved: [{ kind: "missing_server_form" }] };
  const title = String(fixture?.title || ""), routes = [];
  for (const entry of server.value.controls || []) for (const [name, value] of Object.entries(entry)) {
    if (!value?.$form_type || !title.includes(value.$form_type)) continue;
    const target = value.$factory_control_ids?.long_form;
    if (target) routes.push({ name, token: value.$form_type, target });
  }
  if (routes.length !== 1) return { route: routes[0] || null, unresolved: [{ kind: routes.length ? "ambiguous_route" : "route_not_found", title, matches: routes.length }] };
  return { route: routes[0], unresolved: [] };
}

function parseDimension(value, parent, unresolved, path) {
  if (Number.isFinite(value)) return value;
  if (typeof value !== "string") { unresolved.push({ kind: "unresolved_dimension", path, value }); return 0; }
  const text = value.trim();
  if (text === "fill") return parent;
  const match = text.match(/^(-?\d+(?:\.\d+)?)%(?:\s*([+-])\s*(\d+(?:\.\d+)?)px)?$/);
  if (match) return parent * Number(match[1]) / 100 + (match[2] === "-" ? -1 : 1) * Number(match[3] || 0);
  if (/^-?\d+(?:\.\d+)?px$/.test(text)) return Number(text.slice(0, -2));
  unresolved.push({ kind: "unresolved_dimension", path, value }); return 0;
}
function anchor(name) { return ANCHORS[name] || ANCHORS.center; }

export function layoutResolvedTree(tree, options = {}) {
  const viewport = options.viewport || [480, 270], unresolved = [], nodes = [];
  function walk(node, parentRect, path, inheritedVisible = true) {
    const props = node.props || {}, size = Array.isArray(props.size) ? props.size : ["100%", "100%"];
    const w = parseDimension(size[0], parentRect.w, unresolved, `${path}/size/0`), h = parseDimension(size[1], parentRect.h, unresolved, `${path}/size/1`);
    const af = anchor(props.anchor_from || "center"), at = anchor(props.anchor_to || "center"), offset = Array.isArray(props.offset) ? props.offset : [0, 0];
    const x = parentRect.x + parentRect.w * at[0] - w * af[0] + Number(offset[0] || 0);
    const y = parentRect.y + parentRect.h * at[1] - h * af[1] + Number(offset[1] || 0);
    const rect = { x, y, w, h }, visible = inheritedVisible && props.visible !== false;
    const out = { ...node, path, rect, visible };
    nodes.push(out);
    node.controls.forEach((child, index) => walk(child, rect, `${path}/${child.id || index}`, visible));
    return out;
  }
  const synthetic = { x: 0, y: 0, w: viewport[0], h: viewport[1] };
  const root = walk(tree, synthetic, tree?.id || "root");
  return { root, nodes, viewport, unresolved };
}

export async function findTexture(rpRoot, texture, overlayRoots = []) {
  if (typeof texture !== "string" || texture.startsWith("#") || texture.startsWith("$") || texture.startsWith("@")) return null;
  const relative = texture.replaceAll("/", "\\");
  for (const root of [rpRoot, ...overlayRoots]) for (const suffix of extname(relative) ? [""] : [".png", ".tga", ".jpg"]) { const candidate = join(root, relative + suffix); if (await exists(candidate)) return candidate; }
  return null;
}

export async function listUiJson(rpRoot) {
  const root = join(resolve(rpRoot), "ui"), result = [];
  async function walk(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) entry.isDirectory() ? await walk(join(dir, entry.name)) : entry.name.endsWith(".json") && result.push(join(dir, entry.name)); }
  await walk(root); return result;
}
