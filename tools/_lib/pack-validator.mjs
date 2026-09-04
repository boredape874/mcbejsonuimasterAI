import { readdir, stat } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, relative, resolve, sep } from "node:path";
import { exists, readJson } from "./fsx.mjs";
import { readUiJson, JsonDialectError } from "./json-dialect.mjs";
import { PATHS } from "./paths.mjs";
import { partition, validateUiFile } from "./ui-validator.mjs";

const TEXTURE_EXTENSIONS = ["", ".png", ".tga", ".jpg", ".jpeg", ".json"];

function portable(path) {
  return path.split(sep).join("/");
}

async function listJsonFiles(root) {
  const files = [];
  async function visit(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile() && [".json", ".jsonc"].includes(extname(entry.name).toLowerCase())) files.push(path);
    }
  }
  await visit(root);
  return files;
}

function collectTextureRefs(value, out) {
  if (typeof value === "string") {
    if (value.startsWith("textures/")) out.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectTextureRefs(item, out);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const item of Object.values(value)) collectTextureRefs(item, out);
}

function collectModificationInheritance(value, path, out) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectModificationInheritance(item, `${path}[${index}]`, out));
    return;
  }
  if (Array.isArray(value.modifications)) {
    value.modifications.forEach((modification, index) => {
      const queue = [{ value: modification && modification.value, path: `${path}.modifications[${index}].value` }];
      while (queue.length) {
        const current = queue.pop();
        if (!current.value || typeof current.value !== "object") continue;
        if (Array.isArray(current.value)) {
          current.value.forEach((item, childIndex) => queue.push({ value: item, path: `${current.path}[${childIndex}]` }));
          continue;
        }
        for (const [key, child] of Object.entries(current.value)) {
          if (key.includes("@") && key.split("@")[1]?.includes(".")) {
            out.push({
              severity: "warning",
              path: `${current.path}.${key}`,
              message: "Cross-namespace inheritance inside modifications[].value may fail with 'Type not specified'",
              suggestion: "Route the inherited control outside the modification and gate it with #visible.",
            });
          }
          queue.push({ value: child, path: `${current.path}.${key}` });
        }
      }
    });
  }
  for (const [key, child] of Object.entries(value)) {
    if (key !== "modifications") collectModificationInheritance(child, `${path}.${key}`, out);
  }
}

async function locatePack(inputPath) {
  const input = resolve(inputPath);
  if (!(await exists(input))) throw new Error(`pack path does not exist: ${input}`);
  if ((await stat(input)).isFile()) throw new Error(`pack path must be a directory: ${input}`);

  const nestedUi = resolve(input, "ui");
  if (await exists(nestedUi)) return { packRoot: input, uiRoot: nestedUi };
  if (await exists(resolve(input, "_ui_defs.json"))) return { packRoot: dirname(input), uiRoot: input };
  throw new Error(`missing ui directory or _ui_defs.json under: ${input}`);
}

async function textureExists(packRoot, texture, vanillaTextures) {
  if (vanillaTextures.has(texture)) return true;
  const base = resolve(packRoot, texture);
  const rel = relative(packRoot, base);
  if (rel.startsWith("..") || isAbsolute(rel)) return false;
  for (const extension of TEXTURE_EXTENSIONS) {
    if (await exists(base + extension)) return true;
  }
  return false;
}

export async function validatePack(inputPath, options = {}) {
  const { packRoot, uiRoot } = await locatePack(inputPath);
  const files = await listJsonFiles(uiRoot);
  const issues = [];
  const textureRefs = new Set();
  const parsedFiles = new Map();
  const dialect = options.dialect || "bedrock-json@1.21.100";
  const vanillaProfileId = options.vanillaProfile || "bedrock-1.21.100";
  let vanillaProfile = null;
  try {
    const profiles = await readJson(resolve(PATHS.root, "data", "vanilla-screen-profiles.json"));
    vanillaProfile = profiles.profiles?.[vanillaProfileId] || null;
  } catch {}
  if (!vanillaProfile) issues.push({ severity: "error", code: "VANILLA_OVERRIDE_PROFILE_UNVERIFIED", path: "data/vanilla-screen-profiles.json", message: `Vanilla screen profile is not verified: ${vanillaProfileId}` });
  else if (vanillaProfile.dialect !== dialect) issues.push({ severity: "error", code: "OUTPUT_DIALECT_MISMATCH", path: "data/vanilla-screen-profiles.json", message: `Profile ${vanillaProfileId} requires ${vanillaProfile.dialect}, received ${dialect}` });
  const vanillaOverrides = new Set(vanillaProfile?.overrideFiles || []);

  if (files.length === 0) {
    issues.push({ severity: "error", path: portable(relative(packRoot, uiRoot)), message: "ui directory contains no JSON files" });
  }

  for (const file of files) {
    const filePath = portable(relative(packRoot, file));
    try {
      if (extname(file).toLowerCase() === ".jsonc") {
        throw new JsonDialectError("TOOLING_JSONC_ONLY", "Runtime resource packs must contain emitted .json, not authoring .jsonc");
      }
      const ui = (await readUiJson(file, { kind: "runtime", dialect })).document;
      parsedFiles.set(file, ui);
      collectTextureRefs(ui, textureRefs);
      collectModificationInheritance(ui, filePath, issues);
      if (basename(file) !== "_ui_defs.json") {
        if (typeof ui.namespace !== "string" || !ui.namespace) {
          issues.push({ severity: "error", path: filePath, message: "JSON UI file is missing a namespace" });
        }
        issues.push(...await validateUiFile(ui, filePath));
      }
    } catch (error) {
      issues.push({ severity: "error", code: error?.code || "JSON_SYNTAX_ERROR", path: filePath, message: `Invalid JSON: ${String(error && error.message || error)}` });
    }
  }

  const defsPath = resolve(uiRoot, "_ui_defs.json");
  const defs = parsedFiles.get(defsPath);
  if (!defs) {
    issues.push({ severity: "warning", path: portable(relative(packRoot, defsPath)), message: "No _ui_defs.json was parsed" });
  } else if (!Array.isArray(defs.ui_defs)) {
    issues.push({ severity: "error", path: portable(relative(packRoot, defsPath)), message: "_ui_defs.json must define ui_defs as an array" });
  } else {
    const registered = new Set();
    for (const entry of defs.ui_defs) {
      if (typeof entry !== "string") {
        issues.push({ severity: "error", path: portable(relative(packRoot, defsPath)), message: "_ui_defs entries must be strings" });
        continue;
      }
      const candidate = resolve(packRoot, entry);
      const candidateRelative = relative(packRoot, candidate);
      if (candidateRelative.startsWith("..") || isAbsolute(candidateRelative)) {
        issues.push({ severity: "error", path: entry, message: "_ui_defs entry escapes the pack root" });
        continue;
      }
      registered.add(candidate);
      if (!(await exists(candidate))) {
        issues.push({
          severity: options.allowPartialUiDefs ? "warning" : "error",
          path: entry,
          message: "_ui_defs entry does not exist",
        });
      }
    }
    for (const file of files) {
      if (file === defsPath || registered.has(file)) continue;
      const relativeFile = portable(relative(packRoot, file));
      if (vanillaOverrides.has(relativeFile)) {
        issues.push({ severity: "info", code: "VANILLA_OVERRIDE", path: relativeFile, message: "Vanilla screen override does not require custom _ui_defs registration" });
      } else {
        issues.push({ severity: "warning", code: "UI_DEFS_ORPHAN", path: relativeFile, message: "Custom JSON UI file is not registered in _ui_defs.json" });
      }
    }
  }

  let vanillaTextures = new Set();
  if (await exists(PATHS.vanillaIndexTextures)) {
    const index = await readJson(PATHS.vanillaIndexTextures);
    vanillaTextures = new Set(Object.keys(index.textures || {}));
  }
  if (!options.allowMissingTextures) {
    for (const texture of [...textureRefs].sort()) {
      if (!(await textureExists(packRoot, texture, vanillaTextures))) {
        issues.push({ severity: "warning", path: texture, message: "Texture reference was not found in the pack or vanilla index" });
      }
    }
  }

  const { errors, warnings, infos } = partition(issues);
  return {
    schema: "mcbe-jsonui-ai-kit/pack-report@1",
    dialect,
    ok: errors.length === 0,
    clean: errors.length === 0 && warnings.length === 0,
    pack: packRoot,
    uiRoot,
    files: files.length,
    textureReferences: textureRefs.size,
    errors,
    warnings,
    infos,
    checkedAt: new Date().toISOString(),
  };
}
