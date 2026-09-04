import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonc } from "./_lib/jsonc.mjs";
import { writeJson } from "./_lib/fsx.mjs";
import {
  analyzePalette, assetDiskPath, buildTextureLookup, classifyAsset,
  collectTextureRefs, isJsonCandidate, isUiTexture, resolveTextureRef,
} from "./_lib/asset-semantics.mjs";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_OUT = "workspace/corpus-local/assets.semantic.json";
const DEFAULT_CACHE = "workspace/corpus-local/asset-semantics-cache.json";
const HELP = `Usage: node tools/asset-catalog-build.mjs [options]

Build an evidence-backed local semantic catalog without copying source assets.

  --root <path>         Asset-library root (otherwise sources.local.json)
  --config <path>       Local source config
  --source-id <id>      Config source id (default: json-ui-asset-library)
  --out <path>          Local output under workspace/corpus-local
  --cache <path>        Incremental palette cache under workspace/corpus-local
  --no-palette          Skip PNG palette decoding
  --refresh             Ignore existing cache
  --json                Print summary JSON
  --help                Show help`;

function parseArgs(args) {
  const out = { root: null, config: "config/sources.local.json", sourceId: "json-ui-asset-library", out: DEFAULT_OUT, cache: DEFAULT_CACHE, palette: true, refresh: false, json: false };
  const valued = new Set(["--root", "--config", "--source-id", "--out", "--cache"]);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help") return { help: true };
    if (valued.has(arg)) {
      const value = args[++i]; if (!value) return null;
      out[arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
    } else if (arg === "--no-palette") out.palette = false;
    else if (arg === "--refresh") out.refresh = true;
    else if (arg === "--json") out.json = true;
    else return null;
  }
  return out;
}

async function exists(path) { try { await access(path); return true; } catch { return false; } }
function insideLocalWorkspace(path) {
  const allowed = resolve(REPO, "workspace", "corpus-local");
  const rel = relative(allowed, path);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}
async function resolveRoot(options) {
  if (options.root) return resolve(options.root);
  const configPath = resolve(REPO, options.config);
  const config = await readJsonc(configPath);
  const source = (config.sources || []).find((item) => item.id === options.sourceId);
  if (!source) throw new Error(`asset source id not found: ${options.sourceId}`);
  return resolve(dirname(configPath), source.rpRoot);
}
function sameStemKey(asset) {
  return `${asset.sourceId}\0${String(asset.sourceRelativePath).replace(/\\/g, "/").replace(/\.[^.\/]+$/, "").toLowerCase()}`;
}
function screenFamily(path) {
  const value = String(path || "").toLowerCase();
  for (const family of ["server_form", "hud", "chat", "inventory", "container", "progress", "start", "pause", "settings", "play", "store", "quest", "book", "casino", "map"]) if (value.includes(family)) return family;
  return "other";
}
function stateFamilyKey(asset) {
  const path = String(asset.sourceRelativePath).replace(/\\/g, "/").replace(/\.png$/i, "").toLowerCase();
  return `${asset.sourceId}\0${path.replace(/(?:^|[_\-.])(hovered?|focused?|pressed?|down|disabled?|locked|selected|checked|normal|default|idle|active|inactive|on|off)(?=$|[_\-.])/g, "_").replace(/_+/g, "_")}`;
}
async function readMaybeJson(path) {
  try { return await readJsonc(path); } catch { return null; }
}

export async function buildAssetCatalog(options) {
  const root = await resolveRoot(options);
  const indexPath = resolve(root, "indexes", "assets.json");
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  const allAssets = Array.isArray(index) ? index : index.assets;
  if (!Array.isArray(allAssets)) throw new Error("assets index is invalid");
  const textures = allAssets.filter(isUiTexture);
  const jsonFiles = allAssets.filter(isJsonCandidate);
  const cachePath = resolve(REPO, options.cache);
  const oldCache = !options.refresh && await exists(cachePath) ? JSON.parse(await readFile(cachePath, "utf8")) : { entries: {}, jsonRefs: {} };
  const cache = { schema: "mcbe-jsonui-ai-kit/asset-analysis-cache@2", jsonRefsVersion: 2, entries: { ...(oldCache.entries || {}) }, jsonRefs: oldCache.jsonRefsVersion === 2 ? { ...(oldCache.jsonRefs || {}) } : {} };
  const lookup = buildTextureLookup(textures);
  const byId = new Map(textures.map((asset) => [asset.id, asset]));
  const sidecars = new Map(jsonFiles.map((asset) => [sameStemKey(asset), asset]));
  const usages = new Map();
  const unresolved = [];
  const vanillaReferences = [];
  const vanillaPath = resolve(REPO, "vanilla-index", "textures.json");
  const vanillaIndex = await exists(vanillaPath) ? JSON.parse(await readFile(vanillaPath, "utf8")).textures || {} : {};
  let jsonRead = 0, jsonCacheHits = 0;
  for (const jsonAsset of jsonFiles) {
    const cached = Object.hasOwn(cache.jsonRefs, jsonAsset.sha256);
    let refs = cache.jsonRefs[jsonAsset.sha256];
    if (cached) jsonCacheHits++;
    else {
      const parsed = await readMaybeJson(assetDiskPath(root, jsonAsset));
      if (!parsed) { cache.jsonRefs[jsonAsset.sha256] = null; continue; }
      jsonRead++;
      refs = collectTextureRefs(parsed);
      cache.jsonRefs[jsonAsset.sha256] = refs;
    }
    if (!refs) continue;
    for (const ref of refs) {
      const ids = resolveTextureRef(jsonAsset.sourceId, ref.texture, lookup);
      if (!ids.length) {
        const normalizedRef = String(ref.texture).replace(/\\/g, "/").replace(/\.png$/i, "").toLowerCase();
        if (vanillaIndex[normalizedRef]) {
          vanillaReferences.push({ uiAssetId: jsonAsset.id, screenFamily: screenFamily(jsonAsset.sourceRelativePath), controlId: ref.controlId, controlType: ref.controlType, propertyPath: ref.propertyPath, texture: normalizedRef, evidence: "vanilla-index" });
          continue;
        }
        unresolved.push({ kind: "texture-reference", sourceId: jsonAsset.sourceId, uiAssetId: jsonAsset.id, screenFamily: screenFamily(jsonAsset.sourceRelativePath), controlId: ref.controlId, controlType: ref.controlType, propertyPath: ref.propertyPath, texture: ref.texture });
        continue;
      }
      for (const id of ids) {
        const list = usages.get(id) || [];
        list.push({ uiAssetId: jsonAsset.id, screenFamily: screenFamily(jsonAsset.sourceRelativePath), controlId: ref.controlId, controlType: ref.controlType, propertyPath: ref.propertyPath, jsonPath: ref.jsonPath, texture: ref.texture, matchScope: byId.get(id)?.sourceId === jsonAsset.sourceId ? "same-source" : "cross-source" });
        usages.set(id, list);
      }
    }
  }
  const taxonomy = JSON.parse(await readFile(resolve(REPO, "data", "asset-taxonomy.json"), "utf8"));
  let cacheHits = 0, paletteAnalyzed = 0;
  if (options.palette) {
    const pending = [...new Map(textures.filter((asset) => !cache.entries[asset.sha256] || !Object.hasOwn(cache.entries[asset.sha256], "borderRunEstimate")).map((asset) => [asset.sha256, asset])).values()];
    let cursor = 0;
    const workers = Array.from({ length: Math.min(12, pending.length) }, async () => {
      while (cursor < pending.length) {
        const asset = pending[cursor++];
        try { cache.entries[asset.sha256] = await analyzePalette(assetDiskPath(root, asset)); paletteAnalyzed++; }
        catch (error) { unresolved.push({ kind: "png-decode", assetId: asset.id, message: error.message }); }
      }
    });
    await Promise.all(workers);
  }
  const records = [];
  for (const asset of textures) {
    const classification = classifyAsset(asset, taxonomy);
    let visual = null;
    if (options.palette) {
      if (cache.entries[asset.sha256]) { visual = cache.entries[asset.sha256]; if (!options.refresh && oldCache.entries?.[asset.sha256] && Object.hasOwn(oldCache.entries[asset.sha256], "borderRunEstimate")) cacheHits++; }
    }
    const sidecar = sidecars.get(sameStemKey(asset));
    const sidecarData = sidecar ? await readMaybeJson(assetDiskPath(root, sidecar)) : null;
    const usage = usages.get(asset.id) || [];
    const observed = classifyAsset({ sourceRelativePath: usage.map((item) => `${item.uiAssetId} ${item.jsonPath}`).join(" "), category: "" }, taxonomy);
    const roles = [...new Set([...classification.roles.filter((role) => role !== "unclassified"), ...observed.roles.filter((role) => role !== "unclassified")])];
    if (!roles.length) roles.push("unclassified");
    const state = classification.state !== "default" ? classification.state : observed.state;
    records.push({
      id: asset.id, sourceId: asset.sourceId, sourceKind: asset.sourceKind,
      sourceRelativePath: asset.sourceRelativePath, category: asset.category,
      dimensions: { width: asset.width ?? null, height: asset.height ?? null }, hasAlpha: asset.hasAlpha ?? null,
      sha256: asset.sha256, duplicateOf: asset.duplicateOf ?? null,
      semantic: { roles, state }, visual,
      nineSlice: sidecar ? { present: true, metadataAssetId: sidecar.id, margins: sidecarData?.nineslice_size ?? null, baseSize: sidecarData?.base_size ?? null, evidence: sidecarData ? "same-stem-metadata" : "same-stem-unreadable" } : { present: false },
      usages: usage, evidence: [...classification.evidence, ...usage.slice(0, 20).map((item) => ({ kind: "json-ui-texture-reference", ...item }))],
      confidence: usage.length ? "observed" : roles[0] === "unclassified" ? "unresolved" : "inferred",
      redistribution: "local-analysis-only"
    });
  }
  const families = new Map();
  for (const record of records) { const key = stateFamilyKey(record); const list = families.get(key) || []; list.push(record); families.set(key, list); }
  for (const list of families.values()) if (list.length > 1 && new Set(list.map((item) => item.semantic.state)).size > 1) {
    const members = list.map((item) => ({ id: item.id, state: item.semantic.state }));
    for (const item of list) item.stateFamily = { members };
  }
  const counts = (selector) => records.reduce((acc, item) => { const keys = selector(item); for (const key of keys) acc[key] = (acc[key] || 0) + 1; return acc; }, {});
  const catalog = {
    schema: "mcbe-jsonui-ai-kit/asset-semantic-catalog@1",
    source: { kind: "local-index", assetCount: allAssets.length, indexGeneratedAt: index.generatedAt ?? null, absolutePathsIncluded: false },
    summary: {
      textures: records.length, uniqueTextures: records.filter((item) => !item.duplicateOf).length,
      jsonFilesRead: jsonRead, jsonCacheHits, observedUsageAssets: records.filter((item) => item.usages.length).length,
      usageEdges: [...usages.values()].reduce((sum, list) => sum + list.length, 0),
      usageEdgesWithControlOwner: [...usages.values()].flat().filter((item) => item.controlId || item.controlType).length,
      vanillaUsageEdges: vanillaReferences.length,
      nineSlicePairs: records.filter((item) => item.nineSlice.present).length,
      nineSlicePairsWithMetrics: records.filter((item) => item.nineSlice.margins && item.nineSlice.baseSize).length,
      stateFamilies: [...families.values()].filter((list) => list.some((item) => item.stateFamily)).length,
      paletteAnalyzed, paletteCacheHits: cacheHits, unresolved: unresolved.length,
      byRole: counts((item) => item.semantic.roles), byState: counts((item) => [item.semantic.state]),
    },
    assets: records, vanillaReferences, unresolved,
    policy: { sourceFilesCopied: false, absolutePathsIncluded: false, publicPromotionAllowed: false, licenseReviewRequired: true }
  };
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(cache)}\n`, "utf8");
  return catalog;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options || options.help) { console.log(HELP); process.exitCode = options ? 0 : 64; return; }
  const outPath = resolve(REPO, options.out), cachePath = resolve(REPO, options.cache);
  if (!insideLocalWorkspace(outPath) || !insideLocalWorkspace(cachePath)) throw new Error("--out and --cache must stay inside workspace/corpus-local");
  const catalog = await buildAssetCatalog(options);
  await writeJson(outPath, catalog);
  if (options.json) console.log(JSON.stringify({ ok: true, output: options.out, summary: catalog.summary }, null, 2));
  else console.log(`asset catalog: ${catalog.summary.textures} textures, ${catalog.summary.observedUsageAssets} observed uses, ${catalog.summary.unresolved} unresolved`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(JSON.stringify({ ok: false, error: error.message })); process.exit(1); });
