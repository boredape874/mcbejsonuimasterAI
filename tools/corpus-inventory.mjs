import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { designRecipesFromInventory, discoverSources, inventorySource } from "./_lib/corpus-inventory.mjs";
import { writeJson } from "./_lib/fsx.mjs";
import { validateWithSchema } from "./_lib/source-corpus.mjs";

function args(values) {
  const out = { root: null, output: "workspace/corpus-local/archive", concurrency: 12, json: false, limit: null };
  for (let i = 0; i < values.length; i++) { const value = values[i]; if (value === "--json") out.json = true; else if (["--root", "--out", "--concurrency", "--limit"].includes(value)) out[value.slice(2) === "out" ? "output" : value.slice(2)] = values[++i]; else if (value === "--help") out.help = true; else return null; }
  out.concurrency = Number(out.concurrency); out.limit = out.limit == null ? null : Number(out.limit); return out;
}
async function optionalJson(path) { try { return JSON.parse(await readFile(path, "utf8")); } catch { return null; } }

const options = args(process.argv.slice(2));
if (!options || options.help || !options.root) { console.log("usage: node tools/corpus-inventory.mjs --root <archive-root> [--out workspace/corpus-local/archive] [--concurrency 12] [--limit N] [--json]"); process.exit(options?.help ? 0 : 64); }
const root = resolve(options.root), output = resolve(options.output);
let sources = await discoverSources(root); if (options.limit != null) sources = sources.slice(0, options.limit);
const reports = [];
for (const source of sources) {
  const path = resolve(output, `${source.id}.json`);
  const report = await inventorySource(source, await optionalJson(path), { concurrency: options.concurrency });
  await writeJson(path, report); reports.push(report);
}
const policy = { scope: "local-only", identifiers: "neutral", exclusions: ["canonical-repository", "archive-directories", "zip-files", "node_modules", "build-and-dist", "generated-and-cache", "workspace", "symbolic-links", "unsupported-file-extensions"] };
const index = { schemaVersion: 1, generatedAt: new Date().toISOString(), privacy: "local-only-neutral-identifiers", policy, sources: reports.map((item) => ({ id: item.id, tier: item.tier, redistribution: item.redistribution, stats: item.stats })) };
await writeJson(resolve(output, "index.json"), index);
const recipes = designRecipesFromInventory(reports);
const catalog = { schemaVersion: 1, generatedAt: null, contentHash: createHash("sha256").update(JSON.stringify(recipes)).digest("hex"), recipes };
const catalogValidation = await validateWithSchema(catalog, resolve("schemas/design-recipe.schema.json"));
if (!catalogValidation.ok) throw new Error(`local design catalog schema failed: ${catalogValidation.errors.map((item) => `${item.instancePath} ${item.message}`).join("; ")}`);
await writeJson(resolve(output, "design-recipes.local.json"), catalog);
const map = { schemaVersion: 1, generatedAt: new Date().toISOString(), warning: "private local mapping; never publish", sources: sources.map(({ id, root: sourceRoot, privateLabel }) => ({ id, root: sourceRoot, privateLabel })) };
await writeJson(resolve(output, "private-source-map.json"), map);
const summary = { ok: true, output: options.output, sources: reports.length, files: reports.reduce((n, item) => n + item.stats.files, 0), uiFiles: reports.reduce((n, item) => n + item.stats.uiFiles, 0), controls: reports.reduce((n, item) => n + item.stats.controls, 0), textures: reports.reduce((n, item) => n + item.stats.textures, 0), recipes: recipes.length, errors: reports.reduce((n, item) => n + item.stats.errors, 0) };
console.log(options.json ? JSON.stringify(summary, null, 2) : `corpus inventory complete: ${JSON.stringify(summary)}`);
