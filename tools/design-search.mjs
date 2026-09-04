import { resolve } from "node:path";
import { readJson } from "./_lib/fsx.mjs";
import { log } from "./_lib/log.mjs";
import { fileExists } from "./_lib/source-corpus.mjs";
import { REPO_ROOT } from "./_lib/source-paths.mjs";

function parseArgs(args) {
  const options = { catalog: null, query: "", tier: null, role: null, limit: 20, json: false };
  const terms = [];
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help") return { help: true };
    if (arg === "--json") options.json = true;
    else if (["--catalog", "--tier", "--role", "--limit"].includes(arg)) { const value = args[++index]; if (!value) return null; options[arg.slice(2)] = arg === "--limit" ? Number(value) : value; }
    else if (arg.startsWith("--")) return null;
    else terms.push(arg);
  }
  if (!Number.isInteger(options.limit) || options.limit < 1) return null;
  options.query = terms.join(" ").toLowerCase();
  return options;
}

async function resolveCatalog(explicit) {
  if (explicit) return resolve(explicit);
  const local = resolve(process.env.MCBEKIT_DESIGN_CATALOG_LOCAL || resolve(REPO_ROOT, "workspace/catalog-local/design-recipes.json"));
  if (await fileExists(local)) return local;
  return resolve(process.env.MCBEKIT_DESIGN_CATALOG_PUBLIC || resolve(REPO_ROOT, "data/design-recipes.public.json"));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options || options.help) { console.log("usage: node tools/design-search.mjs [query] [--tier tier] [--role role] [--limit n] [--catalog path] [--json]"); process.exit(options ? 0 : 64); }
  const catalogPath = await resolveCatalog(options.catalog);
  const catalog = await readJson(catalogPath);
  const terms = options.query.split(/\s+/).filter(Boolean);
  const results = catalog.recipes.filter((recipe) => {
    if (options.tier && recipe.sourceTier !== options.tier) return false;
    if (options.role && recipe.role !== options.role) return false;
    if (!options.query) return true;
    const searchable = JSON.stringify([recipe.id, recipe.family, recipe.role, recipe.targetProfiles, recipe.controls, recipe.textures, recipe.protocol, recipe.evidence, recipe.redistribution, recipe.anchors, recipe.textRoles, recipe.states]).toLowerCase();
    return terms.every((term) => searchable.includes(term));
  }).map((recipe) => {
    const searchable = JSON.stringify(recipe).toLowerCase();
    const score = terms.reduce((sum, term) => sum + (searchable.split(term).length - 1), 0);
    const warnings = [...(recipe.warnings || [])];
    if (!recipe.validation.static) warnings.push("static validation has blocking evidence");
    if (!recipe.validation.runtime) warnings.push("Bedrock runtime evidence is not complete");
    if (recipe.redistribution !== "public") warnings.push(`redistribution is ${recipe.redistribution}`);
    return { ...recipe, score, warnings };
  }).sort((a, b) => b.score - a.score || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(0, options.limit);
  const output = { ok: true, catalog: catalogPath, query: options.query, count: results.length, results };
  if (options.json) console.log(JSON.stringify(output, null, 2));
  else if (!results.length) log.info("no design recipes matched");
  else results.forEach((recipe) => console.log(`${recipe.id}\t${recipe.sourceTier}\t${recipe.role}`));
}

main().catch((error) => { log.error("design search crashed", { error: error.message }); process.exit(1); });
