// tools/_lib/vanilla-names.mjs
// Name extraction shared by tools/sync-bedrock-samples-ui.mjs (--diff) and
// tools/vanilla-name-check.mjs. Works on parsed Bedrock JSON UI documents plus
// their raw text so that bindings and button ids inside strings are found too.

import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { parseUiSource, DEFAULT_RUNTIME_DIALECT } from "./json-dialect.mjs";

export const NAME_KINDS = Object.freeze(["control", "binding", "variable", "button_id", "renderer", "texture", "screen", "factory", "collection", "entity", "attachable", "geometry", "animation", "animation_controller", "render_controller", "material_name", "molang_query"]);
// Folders of a resource_pack mirror that carry pack identifiers (client entities, attachables,
// geometry, animation, animation controller and render controller ids, material short names).
export const PACK_FOLDERS = Object.freeze(["attachables", "entity", "models", "animations", "animation_controllers", "render_controllers"]);

// Identifiers declared by one parsed pack file (not a JSON UI file).
export function collectPackNames(document) {
  const names = { entities: new Set(), attachables: new Set(), geometries: new Set(), animations: new Set(), animationControllers: new Set(), renderControllers: new Set(), materialNames: new Set() };
  if (!document || typeof document !== "object") return names;
  for (const [key, bucket] of [["minecraft:client_entity", names.entities], ["minecraft:attachable", names.attachables]]) {
    const description = document[key]?.description;
    if (!description || typeof description !== "object") continue;
    if (typeof description.identifier === "string") bucket.add(description.identifier);
    for (const value of Object.values(description.materials || {})) if (typeof value === "string") names.materialNames.add(value);
  }
  const geometry = document["minecraft:geometry"];
  if (Array.isArray(geometry)) for (const entry of geometry) { const id = entry?.description?.identifier; if (typeof id === "string") names.geometries.add(id); }
  for (const key of Object.keys(document)) if (key.startsWith("geometry.")) names.geometries.add(key.split(":")[0]);
  for (const [key, bucket] of [["animations", names.animations], ["animation_controllers", names.animationControllers], ["render_controllers", names.renderControllers]]) {
    const map = document[key];
    if (map && typeof map === "object" && !Array.isArray(map)) for (const name of Object.keys(map)) bucket.add(name);
  }
  return names;
}
const COLLECTION_KEYS = new Set(["collection_name", "binding_collection_name", "toggle_grid_collection_name", "slider_collection_name", "text_edit_box_grid_collection_name"]);

// Factory names exist in two shapes ("factory": {"name": ...} on a panel, and a nested control
// whose "type" is "factory", such as server_form.main_screen_content/server_form_factory) and
// collection names only exist as values of collection keys or of $...collection_name variables,
// so they are read from the parsed document rather than from the raw text.
function collectStructuredNames(node, names) {
  if (Array.isArray(node)) { for (const item of node) collectStructuredNames(item, names); return; }
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    if (key === "factory" && value && typeof value === "object" && typeof value.name === "string") names.factories.add(value.name);
    if (value && typeof value === "object" && !Array.isArray(value) && value.type === "factory") names.factories.add(key.split("@")[0]);
    const bareKey = key.replace(/\|default$/, "");
    if ((COLLECTION_KEYS.has(bareKey) || /collection_name$/.test(bareKey)) && typeof value === "string" && value && !value.startsWith("$") && !value.startsWith("#")) names.collections.add(value);
    collectStructuredNames(value, names);
  }
}

function portable(path) {
  return path.split(sep).join("/");
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else if (/\.jsonc?$/i.test(entry.name)) out.push(path);
  }
  return out.sort();
}

export function collectNames(text, document, fileName) {
  const names = { topLevel: new Set(), controls: new Set(), bindings: new Set(), buttonIds: new Set(), variables: new Set(), renderers: new Set(), textures: new Set(), screens: new Set(), factories: new Set(), collections: new Set() };
  if (fileName.endsWith("_ui_defs.json")) {
    for (const entry of document?.ui_defs || []) if (typeof entry === "string") names.screens.add(entry);
    return names;
  }
  const namespace = typeof document?.namespace === "string" ? document.namespace : null;
  for (const key of Object.keys(document || {})) {
    if (key === "namespace") continue;
    const name = key.split("@")[0];
    names.topLevel.add(name);
    if (namespace) names.controls.add(`${namespace}.${name}`);
  }
  for (const match of text.matchAll(/"(#[A-Za-z0-9_]+)"/g)) names.bindings.add(match[1]);
  for (const match of text.matchAll(/"(button\.[A-Za-z0-9_.]+)"/g)) names.buttonIds.add(match[1]);
  for (const match of text.matchAll(/"(\$[A-Za-z0-9_]+)(?:\|default)?"/g)) names.variables.add(match[1]);
  for (const match of text.matchAll(/"renderer"\s*:\s*"([A-Za-z0-9_]+)"/g)) names.renderers.add(match[1]);
  for (const match of text.matchAll(/"(textures\/[A-Za-z0-9_./-]+)"/g)) names.textures.add(match[1]);
  collectStructuredNames(document, names);
  return names;
}

export async function parseVanillaFile(path) {
  const text = (await readFile(path, "utf8")).replace(/^﻿/, "");
  const document = parseUiSource(text, { kind: "runtime", dialect: DEFAULT_RUNTIME_DIALECT }).document;
  return { text, document, lines: text.split(/\r?\n/).length };
}

// Index: kind -> name -> sorted list of "source:relative/file.json".
// A source is { label, root } for a JSON UI folder, or { label, root, kind: "pack" } for a
// resource_pack root whose PACK_FOLDERS are indexed for pack identifiers. options.molang is a
// parsed data/molang-queries-*.json document (documented query names plus vanilla usage).
export async function buildNameIndex(sources, options = {}) {
  const index = { controls: new Map(), bindings: new Map(), variables: new Map(), buttonIds: new Map(), renderers: new Map(), textures: new Map(), screens: new Map(), factories: new Map(), collections: new Map(), entities: new Map(), attachables: new Map(), geometries: new Map(), animations: new Map(), animationControllers: new Map(), renderControllers: new Map(), materialNames: new Map(), molang: new Map(), files: [] };
  const add = (map, name, location) => { if (!map.has(name)) map.set(name, []); const list = map.get(name); if (!list.includes(location)) list.push(location); };
  if (options.molang?.queries) {
    for (const query of options.molang.queries) add(index.molang, query.name, `documented:${options.molang.source?.version || "?"}${query.usedInVanilla?.length ? ` vanilla:${query.usedInVanilla.join("|")}` : ""}`);
    for (const query of options.molang.usedInVanillaButNotDocumented || []) add(index.molang, query.name, `vanilla:${(query.folders || []).join("|")}`);
  }
  for (const source of sources) {
    if (source.kind === "pack") {
      for (const folder of PACK_FOLDERS) {
        const dir = join(source.root, folder);
        let files = [];
        try { files = await walk(dir); } catch { continue; }
        for (const file of files) {
          const rel = portable(relative(source.root, file));
          const location = `${source.label}:${rel}`;
          let parsed;
          try { parsed = await parseVanillaFile(file); }
          catch (error) { index.files.push({ source: source.label, path: rel, error: String(error?.message || error) }); continue; }
          index.files.push({ source: source.label, path: rel, namespace: null });
          const names = collectPackNames(parsed.document);
          for (const [bucket, map] of [["entities", index.entities], ["attachables", index.attachables], ["geometries", index.geometries], ["animations", index.animations], ["animationControllers", index.animationControllers], ["renderControllers", index.renderControllers], ["materialNames", index.materialNames]]) {
            for (const name of names[bucket]) add(map, name, location);
          }
        }
      }
      continue;
    }
    const files = await walk(source.root);
    for (const file of files) {
      const rel = portable(relative(source.root, file));
      const location = `${source.label}:${rel}`;
      let parsed;
      try { parsed = await parseVanillaFile(file); }
      catch (error) { index.files.push({ source: source.label, path: rel, error: String(error?.message || error) }); continue; }
      index.files.push({ source: source.label, path: rel, namespace: typeof parsed.document?.namespace === "string" ? parsed.document.namespace : null });
      const names = collectNames(parsed.text, parsed.document, rel);
      for (const name of names.controls) add(index.controls, name, location);
      for (const name of names.bindings) add(index.bindings, name, location);
      for (const name of names.variables) add(index.variables, name, location);
      for (const name of names.buttonIds) add(index.buttonIds, name, location);
      for (const name of names.renderers) add(index.renderers, name, location);
      for (const name of names.textures) add(index.textures, name, location);
      for (const name of names.screens) add(index.screens, name, location);
      for (const name of names.factories) add(index.factories, name, location);
      for (const name of names.collections) add(index.collections, name, location);
    }
  }
  return index;
}

// Classify a raw query so lookups do not need the caller to know the kind.
export function lookupName(index, rawQuery) {
  const query = String(rawQuery).trim().replace(/^[`"']+|[`"']+$/g, "");
  const matches = [];
  const push = (kind, name, files) => matches.push({ kind, name, files: files.slice(0, 12), fileCount: files.length });
  if (query.startsWith("#")) { if (index.bindings.has(query)) push("binding", query, index.bindings.get(query)); }
  else if (/^(?:query|q)\./.test(query)) { const name = query.replace(/^q\./, "query."); if (index.molang.has(name)) push("molang_query", name, index.molang.get(name)); }
  else if (query.startsWith("geometry.")) { if (index.geometries.has(query)) push("geometry", query, index.geometries.get(query)); }
  else if (query.startsWith("controller.animation.")) { if (index.animationControllers.has(query)) push("animation_controller", query, index.animationControllers.get(query)); }
  else if (query.startsWith("controller.render.")) { if (index.renderControllers.has(query)) push("render_controller", query, index.renderControllers.get(query)); }
  else if (query.startsWith("animation.")) { if (index.animations.has(query)) push("animation", query, index.animations.get(query)); }
  else if (/^[a-z0-9_]+:[a-z0-9_.]+$/.test(query)) {
    if (index.entities.has(query)) push("entity", query, index.entities.get(query));
    if (index.attachables.has(query)) push("attachable", query, index.attachables.get(query));
  }
  else if (query.startsWith("$")) { if (index.variables.has(query)) push("variable", query, index.variables.get(query)); }
  else if (query.startsWith("button.")) { if (index.buttonIds.has(query)) push("button_id", query, index.buttonIds.get(query)); }
  else if (query.startsWith("textures/")) { if (index.textures.has(query)) push("texture", query, index.textures.get(query)); }
  else if (query.endsWith(".json")) {
    const screen = query.startsWith("ui/") ? query : `ui/${query}`;
    if (index.screens.has(screen)) push("screen", screen, index.screens.get(screen));
    const file = index.files.filter((entry) => entry.path === query.replace(/^ui\//, ""));
    if (file.length) push("file", query, file.map((entry) => `${entry.source}:${entry.path}`));
  } else {
    if (index.controls.has(query)) push("control", query, index.controls.get(query));
    if (index.renderers.has(query)) push("renderer", query, index.renderers.get(query));
    if (index.factories.has(query)) push("factory", query, index.factories.get(query));
    if (index.collections.has(query)) push("collection", query, index.collections.get(query));
    if (index.materialNames.has(query)) push("material_name", query, index.materialNames.get(query));
    if (!query.includes(".")) {
      const suffix = `.${query}`;
      const anyNamespace = [...index.controls.keys()].filter((name) => name.endsWith(suffix));
      if (anyNamespace.length) push("control_any_namespace", query, anyNamespace);
    }
  }
  return { query, found: matches.length > 0, matches };
}
