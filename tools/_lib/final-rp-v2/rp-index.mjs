import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { parseUiSource, DEFAULT_RUNTIME_DIALECT } from "../json-dialect.mjs";
import { validateUiFile } from "../ui-validator.mjs";

const pointerEscape = value => value.replaceAll("~", "~0").replaceAll("/", "~1");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

export async function indexResourcePack(targetRoot, options = {}) {
  const targetLayer = options.targetLayer ?? "target";
  const roots = [...(options.overlays || []).map(root => ({ root: resolve(root), layer: "overlay" })), { root: resolve(targetRoot), layer: targetLayer }];
  const controls = new Map(), controlCandidates = new Map(), files = [], unresolved = [], globals = {}, globalSources = [];
  for (const source of roots) {
    const globalsFile = join(source.root, "ui", "_global_variables.json");
    try {
      const parsedGlobals = await parseFile(globalsFile);
      Object.assign(globals, parsedGlobals.document);
      globalSources.push({ file: globalsFile, hash: parsedGlobals.hash, layer: source.layer });
    } catch (error) {
      if (error?.code !== "ENOENT") unresolved.push({ kind: "unreadable_global_variables", file: globalsFile, message: error.message });
    }
    let defs;
    const defsFile = join(source.root, "ui", "_ui_defs.json");
    try { defs = await parseFile(defsFile); } catch (error) { unresolved.push({ kind: "unreadable_ui_defs", file: defsFile, message: error.message }); continue; }
    for (const relative of defs.document.ui_defs || []) {
      const file = join(source.root, ...String(relative).split("/"));
      let parsed;
      try { parsed = await parseFile(file); } catch (error) { unresolved.push({ kind: "unreadable_ui_file", file, relative, message: error.message }); continue; }
      const namespace = parsed.document.namespace;
      files.push({ file, relative, namespace, hash: parsed.hash, layer: source.layer });
      if (source.layer === "target") {
        const validationIssues = await validateUiFile(parsed.document, relative);
        for (const issue of validationIssues.filter(entry => entry.severity === "error")) {
          unresolved.push({ kind: "invalid_ui_property", file, relative, path: issue.path, message: issue.message, suggestion: issue.suggestion });
        }
      }
      if (!namespace) { unresolved.push({ kind: "missing_namespace", file, relative }); continue; }
      for (const [declaration, value] of Object.entries(parsed.document)) {
        if (declaration === "namespace") continue;
        const at = declaration.indexOf("@"), id = at < 0 ? declaration : declaration.slice(0, at), baseRef = at < 0 ? null : declaration.slice(at + 1);
        const qualified = `${namespace}.${id}`;
        const provenance = options.includeControlProvenance === false ? null : provenanceTree(value, { file, relative, hash: parsed.hash, layer: source.layer }, `/${pointerEscape(declaration)}`);
        const candidate = { qualified, namespace, id, declaration, baseRef, value, provenance, file, relative, hash: parsed.hash, layer: source.layer, root: source.root };
        const candidates = controlCandidates.get(qualified) || [];
        candidates.push(candidate); controlCandidates.set(qualified, candidates);
        if (candidates.filter((entry) => entry.root === source.root).length > 1) {
          unresolved.push({ kind: "ambiguous_control", code: "CONTROL_AMBIGUOUS", qualified, candidates: candidates.map((entry) => entry.relative) });
        }
        controls.set(qualified, withModificationBase(controls.get(qualified), candidate));
      }
    }
  }
  return { targetRoot: resolve(targetRoot), roots, files, controls, controlCandidates, unresolved, globals, globalSources };
}

function hasModifications(value) {
  if (!value || typeof value !== "object") return false;
  return Object.hasOwn(value, "modifications") || Object.values(value).some(hasModifications);
}

function withModificationBase(lower, upper) {
  if (!lower || !hasModifications(upper.value)) return upper;
  // Only compose matching resource paths. Namespace equality alone does not
  // establish Bedrock's cross-file patch behavior.
  return lower.relative === upper.relative
    ? { ...upper, overlayBase: lower }
    : { ...upper, modificationBoundary: "cross_file_modification_unsupported" };
}

export function mergeResourcePackIndexes(lower, upper) {
  if (!lower) return upper;
  const controls = new Map(lower.controls), controlCandidates = new Map(lower.controlCandidates);
  for (const [name, record] of upper.controls) controls.set(name, withModificationBase(controls.get(name), record));
  for (const [name, candidates] of upper.controlCandidates || []) controlCandidates.set(name, [...(controlCandidates.get(name) || []), ...candidates]);
  return { targetRoot: upper.targetRoot, roots: [...lower.roots, ...upper.roots], files: [...lower.files, ...upper.files], controls, controlCandidates, unresolved: [...lower.unresolved, ...upper.unresolved], globals: { ...lower.globals, ...upper.globals }, globalSources: [...lower.globalSources, ...upper.globalSources] };
}

async function parseFile(file) {
  const bytes = await readFile(file);
  const text = bytes.toString("utf8").replace(/^\uFEFF/, "");
  return { document: parseUiSource(text, { kind: "runtime", dialect: DEFAULT_RUNTIME_DIALECT }).document, hash: hash(bytes) };
}

export function provenanceTree(value, source, pointer = "") {
  const result = { [pointer]: { ...source, pointer } };
  if (Array.isArray(value)) value.forEach((entry, index) => Object.assign(result, provenanceTree(entry, source, `${pointer}/${index}`)));
  else if (value && typeof value === "object") for (const [key, entry] of Object.entries(value)) Object.assign(result, provenanceTree(entry, source, `${pointer}/${pointerEscape(key)}`));
  return result;
}

export async function listUiFiles(root) {
  const output = [];
  async function walk(directory) { for (const entry of await readdir(directory, { withFileTypes: true })) entry.isDirectory() ? await walk(join(directory, entry.name)) : entry.name.endsWith(".json") && output.push(join(directory, entry.name)); }
  await walk(join(resolve(root), "ui"));
  return output.sort();
}
