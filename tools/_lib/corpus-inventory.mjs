import { createHash } from "node:crypto";
import { opendir, readFile, stat } from "node:fs/promises";
import { basename, extname, relative, resolve, sep } from "node:path";
import { PNG } from "pngjs";
import { readJsonc } from "./jsonc.mjs";

const SKIP_DIRS = new Set([".git", ".cache", "cache", "caches", "node_modules", "dist", "build", "generated", "workspace", "archives", "archive", "backup", "backups", "__macosx"]);
const TEXT_EXTENSIONS = new Set([".json", ".jsonc", ".js", ".ts", ".mcfunction"]);
const UI_NAMES = new Set(["_ui_defs.json", "_global_variables.json", "hud_screen.json", "chat_screen.json", "server_form.json"]);
const ANALYZER_VERSION = 4;
const slash = (value) => value.split(sep).join("/");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const neutralId = (index) => `local-source-${String(index + 1).padStart(3, "0")}`;

function excludedDirectory(name, canonicalName) {
  const lower = name.toLowerCase();
  return lower === canonicalName.toLowerCase() || SKIP_DIRS.has(lower) || lower.startsWith(".tmp") || lower.endsWith(".zip");
}

export async function discoverSources(root, { canonicalName = "mcbejsonuimasterAI" } = {}) {
  const entries = [];
  const dir = await opendir(root);
  for await (const item of dir) if (item.isDirectory() && !excludedDirectory(item.name, canonicalName)) entries.push(item.name);
  entries.sort((a, b) => a.localeCompare(b, "en"));
  return entries.map((name, index) => ({ id: neutralId(index), root: resolve(root, name), privateLabel: name, tier: "quarantine", redistribution: "local-only" }));
}

async function* walk(root, current = root) {
  let dir;
  try { dir = await opendir(current); } catch { return; }
  for await (const item of dir) {
    if (item.isSymbolicLink()) continue;
    const absolute = resolve(current, item.name);
    if (item.isDirectory()) {
      if (!excludedDirectory(item.name, "__never__")) yield* walk(root, absolute);
    } else if (item.isFile() && !item.name.startsWith("._")) yield { absolute, path: slash(relative(root, absolute)) };
  }
}

function uiCandidate(path) {
  const lower = path.toLowerCase();
  const name = basename(lower);
  const parts = lower.split("/");
  const uiIndex = parts.indexOf("ui");
  return UI_NAMES.has(name) || (uiIndex >= 0 && parts[uiIndex - 1] !== "textures") || lower.includes("json_ui") || lower.includes("json-ui");
}

function visitControls(node, result, prefix = "") {
  if (!node || typeof node !== "object") return;
  if (!Array.isArray(node)) {
    if (typeof node.type === "string") {
      result.controls++;
      const states = [node.default_control && "default", node.hover_control && "hover", node.pressed_control && "pressed", node.locked_control && "locked"].filter(Boolean);
      const control = { id: prefix || `control-${result.controls}`, type: node.type, size: Array.isArray(node.size) ? node.size : null, offset: Array.isArray(node.offset) ? node.offset : null, anchorFrom: node.anchor_from || null, anchorTo: node.anchor_to || null, textRole: node.type === "label" ? "label" : null, states };
      result.controlItems.push(control);
      if (control.size) result.geometry.push({ id: control.id, role: node.type, size: control.size, offset: control.offset, anchorFrom: control.anchorFrom, anchorTo: control.anchorTo });
      if (node.type === "label") result.labels.push({ fontSize: node.font_size ?? null, fontScale: node.font_scale_factor ?? null, size: Array.isArray(node.size) ? node.size : null });
      if (node.type === "button" || node.default_control || node.hover_control || node.pressed_control) result.states.push({ default: node.default_control || null, hover: node.hover_control || null, pressed: node.pressed_control || null, locked: node.locked_control || null });
    }
    for (const [key, value] of Object.entries(node)) {
      if (["texture", "texture_path", "default_texture", "hover_texture", "pressed_texture", "locked_texture"].includes(key) && typeof value === "string") result.textures.add(value);
      if (key.includes("binding") && value && typeof value === "object") result.bindings++;
      if (key.includes("collection") && typeof value === "string") result.collections.add(value);
    }
  }
  for (const [index, value] of Object.entries(node)) visitControls(value, result, prefix ? `${prefix}.${index}` : index);
}

async function inspectFile(file, cached) {
  const info = await stat(file.absolute);
  const fingerprint = `${info.size}:${Math.trunc(info.mtimeMs)}`;
  if (cached?.fingerprint === fingerprint && cached.analyzerVersion === ANALYZER_VERSION) return cached;
  const extension = extname(file.path).toLowerCase();
  const record = { path: file.path, analyzerVersion: ANALYZER_VERSION, fingerprint, bytes: info.size, sha256: null, kind: "other" };
  if (extension === ".png") {
    const bytes = await readFile(file.absolute); record.sha256 = hash(bytes); record.kind = "texture";
    try { const png = PNG.sync.read(bytes, { skipRescale: true }); record.image = { width: png.width, height: png.height, alpha: png.alpha === true }; } catch (error) { record.error = `png: ${error.message}`; }
    return record;
  }
  if (!TEXT_EXTENSIONS.has(extension)) return record;
  const bytes = await readFile(file.absolute); record.sha256 = hash(bytes); record.kind = uiCandidate(file.path) ? "ui-or-protocol" : "text";
  if ([".json", ".jsonc"].includes(extension) && uiCandidate(file.path)) {
    try {
      const json = await readJsonc(file.absolute);
      const result = { controls: 0, controlItems: [], geometry: [], labels: [], states: [], textures: new Set(), collections: new Set(), bindings: 0 };
      visitControls(json, result);
      record.ui = { namespace: json.namespace || null, controls: result.controls, controlItems: result.controlItems.slice(0, 5000), geometry: result.geometry.slice(0, 2000), labels: result.labels.slice(0, 500), states: result.states.slice(0, 500), textures: [...result.textures].sort(), collections: [...result.collections].sort(), bindings: result.bindings, entry: UI_NAMES.has(basename(file.path.toLowerCase())) };
    } catch (error) { record.error = `json: ${error.message}`; }
  } else if ([".js", ".ts", ".mcfunction"].includes(extension)) {
    const text = bytes.toString("utf8");
    const hits = [...text.matchAll(/(?:setTitle|setActionBar|show|sendMessage|runCommand(?:Async)?)\s*\(([^\r\n]{0,180})/g)].slice(0, 200).map((match) => match[0]);
    if (hits.length) record.protocol = { calls: hits.length, families: [...new Set(hits.map((value) => value.split("(")[0].trim()))].sort() };
  }
  return record;
}

async function mapLimit(items, limit, mapper) {
  const output = new Array(items.length); let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (true) { const index = cursor++; if (index >= items.length) return; output[index] = await mapper(items[index], index); } }));
  return output;
}

export async function inventorySource(source, previous = null, { concurrency = 12 } = {}) {
  const files = []; for await (const file of walk(source.root)) { const ext = extname(file.path).toLowerCase(); if (TEXT_EXTENSIONS.has(ext) || ext === ".png") files.push(file); }
  files.sort((a, b) => a.path.localeCompare(b.path, "en"));
  const cache = new Map((previous?.files || []).map((item) => [item.path, item]));
  const inspected = await mapLimit(files, concurrency, (file) => inspectFile(file, cache.get(file.path)));
  const uiFiles = inspected.filter((item) => item.ui);
  const textureFiles = inspected.filter((item) => item.kind === "texture");
  const textureRefs = new Map(); for (const file of uiFiles) for (const ref of file.ui.textures) textureRefs.set(ref, (textureRefs.get(ref) || 0) + 1);
  const geometry = {}; for (const file of uiFiles) for (const item of file.ui.geometry) { const key = JSON.stringify([item.role, item.size, item.offset, item.anchorFrom, item.anchorTo]); geometry[key] = (geometry[key] || 0) + 1; }
  const recipeCandidates = uiFiles.filter((item) => item.ui.controls > 0).map((item, index) => ({ id: `${source.id}-recipe-${String(index + 1).padStart(4, "0")}`, screen: item.path, namespace: item.ui.namespace, controls: item.ui.controls, textureCount: item.ui.textures.length, stateCount: item.ui.states.length, geometryCount: item.ui.geometry.length, staticParse: !item.error })).sort((a, b) => b.controls - a.controls || a.id.localeCompare(b.id, "en"));
  const unresolved = inspected.filter((item) => item.error).map((item) => ({ path: item.path, kind: item.error.split(":", 1)[0], blocking: true, reason: item.error }));
  return { schemaVersion: 1, id: source.id, tier: source.tier, redistribution: source.redistribution, generatedAt: new Date().toISOString(), stats: { files: inspected.length, uiFiles: uiFiles.length, entryFiles: uiFiles.filter((item) => item.ui.entry).length, controls: uiFiles.reduce((n, item) => n + item.ui.controls, 0), textures: textureFiles.length, textureReferences: textureRefs.size, protocolFiles: inspected.filter((item) => item.protocol).length, errors: unresolved.length, recipeCandidates: recipeCandidates.length }, patterns: { textureUsage: [...textureRefs].sort((a, b) => b[1] - a[1]).slice(0, 2000).map(([reference, uses]) => ({ reference, uses })), geometry: Object.entries(geometry).sort((a, b) => b[1] - a[1]).slice(0, 2000).map(([key, uses]) => ({ value: JSON.parse(key), uses })) }, recipeCandidates, unresolved, files: inspected };
}

function measuredSpacing(controls) {
  const counts = new Map();
  for (let i = 1; i < controls.length; i++) {
    const before = controls[i - 1], after = controls[i];
    if (!Array.isArray(before.offset) || !Array.isArray(after.offset) || !Array.isArray(before.size) || !Array.isArray(after.size)) continue;
    if (![...before.offset, ...after.offset, ...before.size, ...after.size].every(Number.isFinite)) continue;
    const dx = after.offset[0] - before.offset[0] - before.size[0], dy = after.offset[1] - before.offset[1] - before.size[1];
    for (const [axis, value] of [["x", dx], ["y", dy]]) if (value >= 0 && value <= 256) { const key = `${axis}:${value}`; counts.set(key, (counts.get(key) || 0) + 1); }
  }
  return [...counts].filter(([, uses]) => uses >= 2).sort((a, b) => b[1] - a[1]).slice(0, 20).map(([key, uses]) => { const [axis, value] = key.split(":"); return { axis, value: Number(value), uses }; });
}

export function designRecipesFromInventory(reports) {
  const recipes = [];
  for (const report of reports) {
    const textureFiles = report.files.filter((item) => item.kind === "texture");
    const protocolFiles = report.files.filter((item) => item.protocol);
    const protocolSummary = protocolFiles.length ? { scope: "source-wide-unlinked", fileCount: protocolFiles.length, calls: protocolFiles.reduce((sum, item) => sum + item.protocol.calls, 0), families: [...new Set(protocolFiles.flatMap((item) => item.protocol.families))].sort() } : null;
    for (const candidate of report.recipeCandidates) {
      const file = report.files.find((item) => item.path === candidate.screen); if (!file?.ui) continue;
      const controls = file.ui.controlItems || [];
      const rootSize = controls[0]?.size || null;
      const textures = file.ui.textures.map((reference) => {
        const wanted = `${reference.replace(/\\/g, "/").replace(/^\/+/, "")}.png`.toLowerCase();
        const image = textureFiles.find((item) => item.path.toLowerCase().endsWith(wanted));
        return { reference, kind: "local-texture", path: image?.path || null, nineslice: null, image: image?.image || null, evidence: image?.sha256 ? [{ sha256: image.sha256 }] : [] };
      });
      const warnings = [];
      if (!rootSize) warnings.push("unresolved: rootSize was not measurable");
      warnings.push("unresolved: targetProfiles require rendered or runtime evidence");
      warnings.push("unresolved: padding could not be proven from flat static geometry");
      if (!textures.length) warnings.push("unresolved: no texture reference was measured");
      if (textures.some((item) => !item.path)) warnings.push("unresolved: one or more texture paths were not resolved inside this source");
      if (!protocolSummary) warnings.push("unresolved: no BP or command protocol evidence was measured");
      else warnings.push("unresolved: protocol evidence is source-wide and is not statically linked to this screen");
      const states = [...new Set(controls.flatMap((item) => item.states))].sort();
      const anchors = [...new Set(controls.flatMap((item) => [item.anchorFrom, item.anchorTo]).filter(Boolean))].sort();
      const textRoles = [...new Set(controls.map((item) => item.textRole).filter(Boolean))].sort();
      const gaps = measuredSpacing(controls); if (!gaps.length) warnings.push("unresolved: no repeated gap was measurable");
      const recipe = { id: candidate.id, family: file.ui.namespace || "mcbe-json-ui", role: basename(file.path).replace(/\.jsonc?$/i, ""), sourceTier: report.tier, targetProfiles: [], ...(rootSize ? { rootSize } : {}), controls, padding: [], gap: gaps, anchors, textRoles, states, textures, protocol: protocolSummary, evidence: [{ sourceId: report.id, screen: file.path, sha256: file.sha256, measurement: "static-local-corpus", unresolved: warnings }], validation: { static: !file.error, visual: false, runtime: false }, warnings, redistribution: report.redistribution };
      recipes.push(recipe);
    }
  }
  return recipes.sort((a, b) => a.id.localeCompare(b.id, "en"));
}
