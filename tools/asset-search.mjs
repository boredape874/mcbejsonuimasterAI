import { access, readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readJsonc } from "./_lib/jsonc.mjs";
import { writeJson } from "./_lib/fsx.mjs";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DEFAULT_CATEGORIES = [
  "json-ui",
  "supporting-json",
  "texture-metadata",
  "textures/bars",
  "textures/buttons",
  "textures/feature-icons",
  "textures/focus-selection",
  "textures/font-glyphs",
  "textures/forms-features",
  "textures/hud-overlays",
  "textures/icons",
  "textures/panels-frames",
  "textures/sliders-scrollbars",
  "textures/slots-containers",
  "textures/tabs-navigation",
  "textures/toggles",
];

const HELP = `Usage: node tools/asset-search.mjs [query] [options]

Search a local MCBE JSON UI asset catalog without copying assets.

Options:
  --config <path>       Local source config (default: config/sources.local.json)
  --source-id <id>      Tooling source containing indexes/assets.json
                        (default: json-ui-asset-library)
  --root <path>         Asset-library root; overrides config lookup
  --category <list>     Comma-separated exact categories or prefixes
  --source <id>         Filter catalog sourceId
  --min-width <n>       Minimum PNG width
  --max-width <n>       Maximum PNG width
  --min-height <n>      Minimum PNG height
  --max-height <n>      Maximum PNG height
  --include-duplicates  Include records whose duplicateOf is set
  --all-categories      Include non-UI catalog categories
  --absolute            Include resolved local asset paths in output
  --limit <n>           Maximum results (default: 40, max: 500)
  --json                Print one JSON report
  --report <path>       Write the report inside this repository
  --help                Show this help`;

function parseArgs(args) {
  const options = {
    query: [], config: "config/sources.local.json", sourceId: "json-ui-asset-library",
    root: null, categories: null, source: null, minWidth: null, maxWidth: null,
    minHeight: null, maxHeight: null, includeDuplicates: false, allCategories: false,
    absolute: false, limit: 40, json: false, report: null,
  };
  const values = new Set(["--config", "--source-id", "--root", "--category", "--source", "--min-width", "--max-width", "--min-height", "--max-height", "--limit", "--report"]);
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help") return { help: true };
    if (values.has(arg)) {
      const value = args[++index];
      if (!value) return null;
      const key = arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      options[key] = value;
    } else if (arg === "--include-duplicates") options.includeDuplicates = true;
    else if (arg === "--all-categories") options.allCategories = true;
    else if (arg === "--absolute") options.absolute = true;
    else if (arg === "--json") options.json = true;
    else if (arg.startsWith("--")) return null;
    else options.query.push(arg);
  }
  for (const key of ["minWidth", "maxWidth", "minHeight", "maxHeight", "limit"]) {
    if (options[key] !== null) options[key] = Number(options[key]);
    if (options[key] !== null && (!Number.isFinite(options[key]) || options[key] < 0)) return null;
  }
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 500) return null;
  options.query = options.query.join(" ").trim().toLowerCase();
  options.categories = options.categories ? options.categories.split(",").map((value) => value.trim()).filter(Boolean) : null;
  return options;
}

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function resolveLibraryRoot(options) {
  if (options.root) return resolve(options.root);
  const configPath = resolve(REPO, options.config);
  const config = await readJsonc(configPath);
  const source = (config.sources || []).find((item) => item.id === options.sourceId);
  if (!source) throw new Error(`asset source id not found in ${options.config}: ${options.sourceId}`);
  if (source.kind !== "tooling-pattern") throw new Error(`asset source must use kind=tooling-pattern: ${options.sourceId}`);
  return resolve(dirname(configPath), source.rpRoot);
}

function categoryMatches(category, allowed) {
  return allowed.some((item) => category === item || category.startsWith(`${item}/`) || (item.endsWith("*") && category.startsWith(item.slice(0, -1))));
}

function numberMatches(value, min, max) {
  if (min !== null && (!Number.isFinite(value) || value < min)) return false;
  if (max !== null && (!Number.isFinite(value) || value > max)) return false;
  return true;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options || options.help) {
    console.log(HELP);
    process.exitCode = options ? 0 : 64;
    return;
  }
  const root = await resolveLibraryRoot(options);
  const indexPath = resolve(root, "indexes", "assets.json");
  if (!await exists(indexPath)) throw new Error(`asset index not found: ${indexPath}`);
  const catalog = JSON.parse(await readFile(indexPath, "utf8"));
  const assets = Array.isArray(catalog) ? catalog : catalog.assets;
  if (!Array.isArray(assets)) throw new Error("asset index must be an array or contain an assets array");
  const categories = options.allCategories ? null : (options.categories || DEFAULT_CATEGORIES);
  const terms = options.query.split(/\s+/).filter(Boolean);
  const matches = [];
  for (const asset of assets) {
    if (categories && !categoryMatches(String(asset.category || ""), categories)) continue;
    if (options.source && asset.sourceId !== options.source) continue;
    if (!options.includeDuplicates && asset.duplicateOf) continue;
    if (!numberMatches(asset.width, options.minWidth, options.maxWidth)) continue;
    if (!numberMatches(asset.height, options.minHeight, options.maxHeight)) continue;
    const haystack = [asset.id, asset.sourceId, asset.sourceKind, asset.sourceRelativePath, asset.category, asset.libraryPath].filter(Boolean).join(" ").toLowerCase();
    if (!terms.every((term) => haystack.includes(term))) continue;
    const item = {
      id: asset.id,
      sourceId: asset.sourceId,
      sourceKind: asset.sourceKind,
      sourceUrl: asset.sourceUrl ?? null,
      sourceRelativePath: asset.sourceRelativePath,
      category: asset.category,
      extension: asset.extension,
      width: asset.width ?? null,
      height: asset.height ?? null,
      hasAlpha: asset.hasAlpha ?? null,
      bytes: asset.bytes,
      sha256: asset.sha256,
      duplicateOf: asset.duplicateOf ?? null,
      libraryPath: asset.libraryPath,
    };
    if (options.absolute) item.resolvedPath = resolve(root, "library", asset.libraryPath);
    matches.push(item);
    if (matches.length >= options.limit) break;
  }
  const report = {
    schema: "mcbe-jsonui-ai-kit/asset-search@1",
    ok: true,
    query: options.query,
    filters: { categories: categories || "all", source: options.source, uniqueOnly: !options.includeDuplicates },
    count: matches.length,
    results: matches,
    redistributionNotice: "Catalog presence is not redistribution permission. Verify each source license before copying.",
  };
  if (options.report) {
    const reportPath = resolve(REPO, options.report);
    const rel = relative(REPO, reportPath);
    if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("--report must stay inside the repository");
    await writeJson(reportPath, report);
  }
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else if (!matches.length) console.log("No UI assets matched.");
  else for (const item of matches) console.log(`${item.category}\t${item.width ?? "?"}x${item.height ?? "?"}\t${item.sourceId}\t${item.libraryPath}`);
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }));
  process.exit(1);
});
