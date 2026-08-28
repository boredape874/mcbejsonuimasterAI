import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { readJson, writeJson } from "./_lib/fsx.mjs";
import { log } from "./_lib/log.mjs";
import { recipesFromCorpus, validateWithSchema } from "./_lib/source-corpus.mjs";
import { REPO_ROOT, resolveSafeOutput } from "./_lib/source-paths.mjs";

function parseArgs(args) {
  const options = { corpus: null, out: null, json: false, public: false, generatedAt: undefined };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help") return { help: true };
    if (arg === "--json") options.json = true;
    else if (arg === "--public") options.public = true;
    else if (["--corpus", "--out", "--generated-at"].includes(arg)) { const value = args[++index]; if (!value) return null; options[arg.replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value; }
    else return null;
  }
  options.corpus ||= options.public ? "workspace/corpus-public/index.json" : "workspace/corpus-local/index.json";
  options.out ||= options.public ? "data/design-recipes.public.json" : "workspace/catalog-local/design-recipes.json";
  return options;
}

function deterministicTimestamp(explicit) {
  if (explicit !== undefined) {
    const date = new Date(explicit);
    if (!Number.isFinite(date.valueOf())) throw new Error("--generated-at must be an ISO date-time");
    return date.toISOString();
  }
  if (process.env.SOURCE_DATE_EPOCH) {
    const seconds = Number(process.env.SOURCE_DATE_EPOCH);
    if (!Number.isFinite(seconds)) throw new Error("SOURCE_DATE_EPOCH must be numeric seconds");
    return new Date(seconds * 1000).toISOString();
  }
  return null;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options || options.help) { console.log("usage: node tools/catalog-build.mjs [--corpus index.json] [--out recipes.json] [--public] [--generated-at ISO] [--json]"); process.exit(options ? 0 : 64); }
  const corpus = await readJson(resolve(options.corpus));
  const outPath = resolve(options.out);
  if (options.public) try { await resolveSafeOutput(REPO_ROOT, outPath); } catch (error) { log.error("public catalog output is unsafe", { error: error.message }); process.exit(9); }
  let recipes = recipesFromCorpus(corpus);
  if (options.public) recipes = recipes.filter((item) => item.redistribution === "public");
  const contentHash = createHash("sha256").update(JSON.stringify(recipes)).digest("hex");
  const catalog = { schemaVersion: 1, generatedAt: deterministicTimestamp(options.generatedAt), contentHash, recipes };
  const validation = await validateWithSchema(catalog, resolve("schemas/design-recipe.schema.json"));
  if (!validation.ok) { validation.errors.forEach((item) => log.error(item.message, { path: item.instancePath })); process.exit(9); }
  await writeJson(outPath, catalog);
  const summary = { ok: true, output: options.out, recipes: catalog.recipes.length };
  if (options.json) console.log(JSON.stringify(summary, null, 2)); else log.ok("design catalog built", summary);
}

main().catch((error) => { log.error("catalog build crashed", { error: error.message }); process.exit(1); });
