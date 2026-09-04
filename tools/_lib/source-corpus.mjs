import { access, readdir, readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { PNG } from "pngjs";
import { readJsonc } from "./jsonc.mjs";

const ENGINE_ENTRIES = ["hud_screen.json", "chat_screen.json", "server_form.json"];
const TEXTURE_KEYS = new Set(["texture", "texture_path", "default_texture", "hover_texture", "pressed_texture", "locked_texture"]);

export const slash = (value) => value.split(sep).join("/");
const codepointCompare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export async function fileExists(path) { try { await access(path); return true; } catch { return false; } }
function isInside(root, target) {
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !rel.startsWith("/") && !rel.startsWith("\\"));
}

export async function validateWithSchema(value, schemaPath) {
  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  return { ok: validate(value), errors: validate.errors || [] };
}

function globRegex(pattern) {
  const escaped = slash(pattern)
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*\//g, "\u0001")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]")
    .replace(/\u0001/g, "(?:.*/)?")
    .replace(/\u0000/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

function allowed(path, include, exclude) {
  const normalized = slash(path);
  return (!include.length || include.some((item) => globRegex(item).test(normalized))) && !exclude.some((item) => globRegex(item).test(normalized));
}

async function walk(root) {
  const output = [];
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else output.push(path);
    }
  }
  if (await fileExists(root)) await visit(root);
  return output;
}

function inspectControlTree(value, context, key = "") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectControlTree(item, context, `${key}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (typeof value.type === "string") {
    context.controls.push({
      id: key || "root",
      type: value.type,
      size: Array.isArray(value.size) ? value.size : null,
      offset: Array.isArray(value.offset) ? value.offset : null,
      anchorFrom: value.anchor_from || null,
      anchorTo: value.anchor_to || null,
      textRole: typeof value.text === "string" ? "label" : null,
      states: ["default", "hover", "pressed", "locked"].filter((state) => Object.keys(value).some((name) => name.toLowerCase().includes(state))),
    });
  }
  for (const [name, child] of Object.entries(value)) {
    const inheritedKey = name.match(/^[^@]+@([a-z][a-z0-9_]*\.[a-z][a-z0-9_]*)$/i);
    if (inheritedKey) context.inherited.add(inheritedKey[1]);
    if (TEXTURE_KEYS.has(name) && typeof child === "string") context.textures.add(child);
    inspectControlTree(child, context, key ? `${key}.${name}` : name);
  }
}

async function resolveTexture(rpRoot, texture) {
  if (!texture.startsWith("textures/")) return null;
  if (texture.replace(/\\/g, "/").split("/").includes("..")) return { error: "texture path escapes RP root" };
  const candidates = extname(texture) ? [texture] : [`${texture}.png`, `${texture}.tga`, `${texture}.jpg`, `${texture}.jpeg`];
  for (const candidate of candidates) {
    const absolute = resolve(rpRoot, ...candidate.split("/"));
    if (await fileExists(absolute)) {
      const stem = absolute.slice(0, -extname(absolute).length);
      const sidecar = `${stem}.json`;
      let image = null;
      if (extname(absolute).toLowerCase() === ".png") {
        try { const png = PNG.sync.read(await readFile(absolute)); image = { width: png.width, height: png.height, alpha: png.data.some((value, index) => index % 4 === 3 && value < 255) }; } catch {}
      }
      let nineslice = null;
      if (await fileExists(sidecar)) {
        try {
          const data = await readJsonc(sidecar);
          const inset = data.nineslice_size;
          const baseSize = data.base_size;
          nineslice = { path: slash(relative(rpRoot, sidecar)), valid: (typeof inset === "number" || (Array.isArray(inset) && inset.length === 4)) && Array.isArray(baseSize) && baseSize.length === 2, inset: inset ?? null, baseSize: baseSize ?? null };
        } catch (error) { nineslice = { path: slash(relative(rpRoot, sidecar)), valid: false, error: error.message }; }
      }
      return { kind: "local-texture", path: slash(relative(rpRoot, absolute)), nineslice, image, evidence: [] };
    }
  }
  return null;
}

export async function scanSource(source, configDir) {
  const rpRoot = resolve(configDir, source.rpRoot);
  const uiRoot = resolve(rpRoot, "ui");
  const unresolved = [];
  const vanillaIndexPath = process.env.MCBEKIT_VANILLA_TEXTURE_INDEX || fileURLToPath(new URL("../../vanilla-index/textures.json", import.meta.url));
  let vanillaTextures = null;
  try {
    const index = JSON.parse(await readFile(vanillaIndexPath, "utf8"));
    vanillaTextures = index && index.textures && typeof index.textures === "object" ? index.textures : null;
  } catch {}
  let reportedMissingVanillaIndex = false;
  const entrySet = new Set();
  const defsPath = resolve(uiRoot, "_ui_defs.json");
  if (await fileExists(defsPath)) {
    entrySet.add(defsPath);
    try {
      const defs = await readJsonc(defsPath);
      for (const item of defs.ui_defs || []) {
        if (typeof item !== "string") continue;
        const normalized = item.replace(/^ui[\\/]/i, "");
        const target = resolve(uiRoot, ...normalized.split(/[\\/]/));
        if (!isInside(uiRoot, target)) unresolved.push({ kind: "ui-entry", blocking: true, reference: item, from: "ui/_ui_defs.json", reason: "entry escapes ui root" });
        else if (await fileExists(target)) entrySet.add(target);
        else unresolved.push({ kind: "ui-entry", blocking: true, reference: item, from: "ui/_ui_defs.json", reason: "registered UI entry does not exist" });
      }
    } catch (error) {
      unresolved.push({ kind: "parse", blocking: true, reference: "ui/_ui_defs.json", reason: error.message });
    }
  }
  for (const name of ["_global_variables.json", ...ENGINE_ENTRIES, ...(source.overrides.entryFiles || [])]) {
    const target = name.includes("/") ? resolve(rpRoot, ...name.split("/")) : resolve(uiRoot, name);
    if (await fileExists(target)) entrySet.add(target);
  }

  const allFiles = await walk(rpRoot);
  const includedEntries = [...entrySet].filter((path) => allowed(slash(relative(rpRoot, path)), source.include, source.exclude)).sort();
  const screens = [];
  const metadataFiles = [];
  const assets = new Map();
  const namespaces = new Set();
  for (const file of includedEntries) {
    const rel = slash(relative(rpRoot, file));
    try {
      const json = await readJsonc(file);
      const context = { controls: [], textures: new Set(), inherited: new Set() };
      inspectControlTree(json, context);
      if (typeof json.namespace === "string") namespaces.add(json.namespace);
      for (const texture of context.textures) {
        if (texture.startsWith("$") || texture.startsWith("#")) {
          unresolved.push({ kind: "dynamic-texture", blocking: false, reference: texture, from: rel, reason: "runtime variable or binding texture reference cannot be resolved statically" });
          continue;
        }
        const found = await resolveTexture(rpRoot, texture);
        if (found?.error) unresolved.push({ kind: "missing-texture", blocking: true, reference: texture, from: rel, reason: found.error });
        else if (found) assets.set(texture, { reference: texture, ...found });
        else if (texture.startsWith("textures/") && vanillaTextures && Array.isArray(vanillaTextures[texture])) {
          assets.set(texture, { reference: texture, kind: "vanilla-texture", path: null, nineslice: null, evidence: vanillaTextures[texture] });
        } else if (texture.startsWith("textures/")) {
          if (!vanillaTextures && !reportedMissingVanillaIndex) {
            unresolved.push({ kind: "vanilla-index", blocking: true, reference: slash(vanillaIndexPath), reason: "vanilla texture index is unavailable; vanilla references cannot be verified" });
            reportedMissingVanillaIndex = true;
          }
          unresolved.push({ kind: "missing-texture", blocking: true, reference: texture, from: rel, reason: vanillaTextures ? "texture is absent from the RP and vanilla texture index" : "texture is absent from the RP and the vanilla texture index is unavailable" });
        } else {
          unresolved.push({ kind: "dynamic-texture", blocking: false, reference: texture, from: rel, reason: "non-path texture expression cannot be resolved statically" });
        }
      }
      const record = { path: rel, namespace: json.namespace || null, controls: context.controls, inherited: [...context.inherited].sort(), textureReferences: [...context.textures].sort() };
      if (["ui/_ui_defs.json", "ui/_global_variables.json"].includes(rel.toLowerCase())) metadataFiles.push(record);
      else screens.push(record);
    } catch (error) {
      unresolved.push({ kind: "parse", blocking: true, reference: rel, reason: error.message });
    }
  }
  for (const screen of screens) {
    for (const inherited of screen.inherited) {
      const namespace = inherited.split(".")[0];
      if (!namespaces.has(namespace)) unresolved.push({ kind: "inherited-control", blocking: true, reference: inherited, from: screen.path, reason: "inherited namespace is not present in collected UI entries" });
    }
  }
  const protocolFiles = [];
  for (const configured of source.overrides.protocolFiles || []) {
    const absolute = resolve(source.bpRoot ? resolve(configDir, source.bpRoot) : rpRoot, ...configured.split("/"));
    if (await fileExists(absolute)) protocolFiles.push(configured);
    else unresolved.push({ kind: "protocol-file", blocking: true, reference: configured, reason: "configured protocol evidence file does not exist" });
  }
  const runtimeEvidence = [];
  for (const configured of source.overrides.runtimeEvidence || []) {
    const absolute = resolve(configDir, ...configured.split("/"));
    if (await fileExists(absolute)) runtimeEvidence.push(configured);
    else unresolved.push({ kind: "runtime-evidence", blocking: true, reference: configured, reason: "configured runtime evidence file does not exist" });
  }
  const visualEvidence = [];
  const visualProfiles = new Set();
  const evidenceWarnings = [];
  for (const configured of source.overrides.visualEvidence || []) {
    const absolute = resolve(configDir, configured);
    try {
      const bytes = await readFile(absolute);
      const item = { path: slash(configured), sha256: createHash("sha256").update(bytes).digest("hex") };
      if (configured.toLowerCase().endsWith(".json")) {
        try {
          const metadata = JSON.parse(bytes.toString("utf8"));
          if (Array.isArray(metadata.profiles) && metadata.profiles.every((profile) => typeof profile === "string" && profile.length)) {
            item.profiles = [...metadata.profiles];
            metadata.profiles.forEach((profile) => visualProfiles.add(profile));
          } else evidenceWarnings.push(`visual evidence ${configured} has no verified profiles array; using safe default profile`);
        } catch { evidenceWarnings.push(`visual evidence ${configured} cannot be parsed for profiles; using safe default profile`); }
      }
      visualEvidence.push(item);
    } catch (error) {
      unresolved.push({ kind: "visual-evidence", blocking: true, reference: configured, reason: `visual evidence cannot be read: ${error.message}` });
    }
  }
  return {
    schemaVersion: 1,
    source: { id: source.id, kind: source.kind, tier: source.tier, redistribution: source.redistribution, license: source.license, revision: source.revision },
    files: { entries: includedEntries.map((path) => slash(relative(rpRoot, path))), metadata: metadataFiles.map((item) => item.path), protocol: protocolFiles, runtimeEvidence, visualEvidence, visualProfiles: [...visualProfiles].sort(codepointCompare) },
    warnings: evidenceWarnings,
    screens,
    assets: [...assets.values()].sort((a, b) => codepointCompare(a.reference, b.reference)),
    unresolved,
    stats: { candidateFiles: allFiles.length, entryFiles: includedEntries.length, screens: screens.length, controls: screens.reduce((sum, item) => sum + item.controls.length, 0), assets: assets.size, unresolved: unresolved.length, blockingUnresolved: unresolved.filter((item) => item.blocking === true).length },
  };
}

export function recipesFromCorpus(corpus) {
  const recipes = [];
  for (const scan of corpus.sources || []) {
    for (const screen of scan.screens || []) {
      const useful = screen.controls.filter((control) => control.type && (control.size || control.offset || control.anchorFrom || control.anchorTo));
      if (!useful.length) continue;
      const slug = screen.path.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      recipes.push({
        id: `${scan.source.id}:${slug}`,
        family: screen.namespace || "json-ui",
        role: screen.path.split("/").pop().replace(/\.jsonc?$/i, ""),
        sourceTier: scan.source.tier,
        targetProfiles: scan.files.visualProfiles?.length ? scan.files.visualProfiles : ["pc-16x9"],
        controls: useful,
        padding: [], gap: [],
        anchors: [...new Set(useful.flatMap((item) => [item.anchorFrom, item.anchorTo]).filter(Boolean))].sort(),
        textRoles: [...new Set(useful.map((item) => item.textRole).filter(Boolean))].sort(),
        states: [...new Set(useful.flatMap((item) => item.states))].sort(),
        textures: (scan.assets || []).filter((asset) => screen.textureReferences.includes(asset.reference)),
        protocol: scan.files.protocol.length ? { files: scan.files.protocol } : null,
        evidence: [{ sourceId: scan.source.id, screen: screen.path, visualEvidence: scan.files.visualEvidence }],
        validation: { static: scan.stats.blockingUnresolved === 0, visual: scan.stats.blockingUnresolved === 0 && scan.files.visualEvidence.length > 0 && scan.files.visualEvidence.every((item) => /^[a-f0-9]{64}$/.test(item.sha256)), runtime: scan.source.tier === "gold" && scan.stats.blockingUnresolved === 0 && scan.files.runtimeEvidence.length > 0 },
        warnings: scan.warnings || [],
        redistribution: scan.source.redistribution,
      });
    }
  }
  return recipes.sort((a, b) => codepointCompare(a.id, b.id));
}
