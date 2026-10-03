// tools/_lib/vanilla-names.mjs
// Name extraction shared by tools/sync-bedrock-samples-ui.mjs (--diff) and
// tools/vanilla-name-check.mjs. Works on parsed Bedrock JSON UI documents plus
// their raw text so that bindings and button ids inside strings are found too.

import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { parseUiSource, DEFAULT_RUNTIME_DIALECT } from "./json-dialect.mjs";

export const NAME_KINDS = Object.freeze(["control", "binding", "variable", "button_id", "renderer", "texture", "screen", "factory", "collection"]);
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
export async function buildNameIndex(sources) {
  const index = { controls: new Map(), bindings: new Map(), variables: new Map(), buttonIds: new Map(), renderers: new Map(), textures: new Map(), screens: new Map(), factories: new Map(), collections: new Map(), files: [] };
  const add = (map, name, location) => { if (!map.has(name)) map.set(name, []); const list = map.get(name); if (!list.includes(location)) list.push(location); };
  for (const source of sources) {
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
    if (!query.includes(".")) {
      const suffix = `.${query}`;
      const anyNamespace = [...index.controls.keys()].filter((name) => name.endsWith(suffix));
      if (anyNamespace.length) push("control_any_namespace", query, anyNamespace);
    }
  }
  return { query, found: matches.length > 0, matches };
}
