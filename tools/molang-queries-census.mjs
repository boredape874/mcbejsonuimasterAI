// tools/molang-queries-census.mjs
// Regenerate data/molang-queries-<version>.json: the query.* names documented in the Mojang
// release documentation (Molang.html as archived by bedrock-dot-dev/docs for the pinned
// version), which of them the pinned vanilla resource_pack mirror actually uses, and which
// have a MicrosoftDocs query_*.md page. Offline: it reads local files only.
//
// Usage:
//   node tools/molang-queries-census.mjs [--html <Molang.html>] [--mirror <bedrock-samples root>]
//        [--creator <minecraft-creator root>] [--version 1.26.50.4] [--out data/molang-queries-1.26.50.json] [--check]
//
//   --html     defaults to the design-library download cache of bedrock-dot-dev-docs-1-26-50, then to
//              workspace/research-clones/docs/1.26.0.0/<version>/Molang.html
//   --check    do not write; exit 3 when the regenerated document differs from the committed one
//
// Exit codes: 0 ok, 2 input missing, 3 --check mismatch.

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PATHS } from "./_lib/paths.mjs";
import { exists } from "./_lib/fsx.mjs";
import { log } from "./_lib/log.mjs";

const DEFAULT_VERSION = "1.26.50.4";
const DOCS_SOURCE_ID = "bedrock-dot-dev-docs-1-26-50";
const PACK_FOLDERS = ["attachables", "entity", "animations", "animation_controllers", "render_controllers", "models", "ui"];

function parseArgs(argv) {
  const options = { html: null, mirror: resolve(PATHS.root, "references", "upstreams", "bedrock-samples"), creator: resolve(PATHS.root, "workspace", "research-clones", "minecraft-creator"), version: DEFAULT_VERSION, out: null, check: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const value = () => { const next = argv[++index]; if (next === undefined) throw new Error(`${arg} requires a value`); return next; };
    if (arg === "--html") options.html = resolve(PATHS.root, value());
    else if (arg === "--mirror") options.mirror = resolve(PATHS.root, value());
    else if (arg === "--creator") options.creator = resolve(PATHS.root, value());
    else if (arg === "--version") options.version = value();
    else if (arg === "--out") options.out = resolve(PATHS.root, value());
    else if (arg === "--check") options.check = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  const major = options.version.split(".").slice(0, 2).join(".") + ".0.0";
  options.htmlCandidates = options.html ? [options.html] : [
    resolve(PATHS.root, "workspace", "design-library", "upstreams", DOCS_SOURCE_ID, major, options.version, "Molang.html"),
    resolve(PATHS.root, "workspace", "research-clones", "docs", major, options.version, "Molang.html"),
  ];
  options.out ??= resolve(PATHS.root, "data", `molang-queries-${options.version.split(".").slice(0, 3).join(".")}.json`);
  return options;
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(path));
    else if (entry.name.endsWith(".json")) out.push(path);
  }
  return out.sort();
}

export async function buildMolangCensus({ html, mirror, creator, version, revision }) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ");
  const documented = [...new Set([...text.matchAll(/\bquery\.([a-z_0-9]+)/g)].map((m) => m[1]))].sort();
  const mathFunctions = [...new Set([...text.matchAll(/\bmath\.([a-z_0-9]+)/g)].map((m) => m[1]))].sort();
  const used = new Map();
  const folders = [];
  for (const folder of PACK_FOLDERS) {
    const dir = join(mirror, "resource_pack", folder);
    if (!await exists(dir)) continue;
    folders.push(folder);
    for (const file of await walk(dir)) {
      const body = await readFile(file, "utf8");
      for (const m of body.matchAll(/\b(?:query|q)\.([a-z_0-9]+)/g)) { if (!used.has(m[1])) used.set(m[1], new Set()); used.get(m[1]).add(folder); }
    }
  }
  const creatorDir = join(creator, "creator", "Reference", "Content", "MolangReference", "Examples", "MolangConcepts", "QueryFunctions");
  const creatorPages = new Set(await exists(creatorDir) ? (await readdir(creatorDir)).filter((f) => f.startsWith("query_") && f.endsWith(".md")).map((f) => f.slice(6, -3)) : []);
  return {
    schema: "mcbe-jsonui-ai-kit/molang-queries@1",
    source: { id: DOCS_SOURCE_ID, page: `${version.split(".").slice(0, 2).join(".")}.0.0/${version}/Molang.html`, revision, version, note: "Mojang release documentation archived by bedrock.dev; license not stated, so names only" },
    vanillaUsageSource: { id: "mojang-bedrock-samples", revision: "46ba6ea985fb5a92d79a9419198f10dda14c199d", folders },
    creatorPagesSource: { id: "microsoftdocs-minecraft-creator-reference", revision: "ba7a3b48ae80393780766f361b83698361ee3f3e", pagesIndexed: creatorPages.size },
    documentedCount: documented.length,
    queries: documented.map((n) => ({ name: `query.${n}`, usedInVanilla: [...(used.get(n) || [])].sort(), creatorPage: creatorPages.has(n) })),
    usedInVanillaButNotDocumented: [...used.keys()].filter((n) => !documented.includes(n)).sort().map((n) => ({ name: `query.${n}`, folders: [...used.get(n)].sort() })),
    mathFunctions,
  };
}

async function main() {
  let options;
  try { options = parseArgs(process.argv.slice(2)); } catch (error) { log.error(String(error.message || error)); process.exit(64); }
  let htmlPath = null;
  for (const candidate of options.htmlCandidates) if (await exists(candidate)) { htmlPath = candidate; break; }
  if (!htmlPath) { log.error("Molang.html not found", { tried: options.htmlCandidates, hint: `node tools/design-source-sync.mjs --source ${DOCS_SOURCE_ID} --download` }); process.exit(2); }
  const lock = JSON.parse(await readFile(resolve(PATHS.root, "config", "design-research-lock.json"), "utf8"));
  const revision = (lock.sources || []).find((s) => s.id === DOCS_SOURCE_ID)?.revision ?? null;
  const census = await buildMolangCensus({ html: await readFile(htmlPath, "utf8"), mirror: options.mirror, creator: options.creator, version: options.version, revision });
  const serialized = JSON.stringify(census, null, 2) + "\n";
  if (options.check) {
    const current = await readFile(options.out, "utf8").catch(() => null);
    if (current !== serialized) { log.error("committed molang census differs from the regenerated one", { out: options.out }); process.exit(3); }
    log.ok(`molang census up to date (${census.documentedCount} documented, ${census.queries.filter((q) => q.usedInVanilla.length).length} used in vanilla)`);
    return;
  }
  await writeFile(options.out, serialized);
  log.ok(`wrote ${options.out}`, { documented: census.documentedCount, usedInVanilla: census.queries.filter((q) => q.usedInVanilla.length).length, undocumentedButUsed: census.usedInVanillaButNotDocumented.length });
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main().catch((error) => { log.error("molang-queries-census crashed", { error: String(error && error.message || error) }); process.exit(1); });
