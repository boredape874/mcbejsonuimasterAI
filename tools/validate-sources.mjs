import { resolve } from "node:path";
import { readJsonc } from "./_lib/jsonc.mjs";
import { log } from "./_lib/log.mjs";
import { validateWithSchema } from "./_lib/source-corpus.mjs";
import { validateSourcePaths } from "./_lib/source-paths.mjs";

function parseArgs(args) {
  let config = "config/sources.public.json";
  let json = false;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--help") return { help: true };
    if (args[index] === "--json") json = true;
    else if (args[index].startsWith("--")) return null;
    else if (config !== "config/sources.public.json") return null;
    else config = args[index];
  }
  return { config, json };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options || options.help) {
    console.log("usage: node tools/validate-sources.mjs [config.json] [--json]");
    process.exit(options ? 0 : 64);
  }
  const configPath = resolve(options.config);
  let config;
  try { config = await readJsonc(configPath); }
  catch (error) { log.error("source config cannot be read", { error: error.message }); process.exit(9); }
  const result = await validateWithSchema(config, resolve("schemas/source.schema.json"));
  const ids = (config.sources || []).map((item) => item.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const errors = [
    ...result.errors.map((item) => ({ path: item.instancePath || "/", message: item.message })),
    ...[...new Set(duplicateIds)].map((id) => ({ path: "/sources", message: `duplicate source id: ${id}` })),
    ...await validateSourcePaths(config, configPath),
  ];
  const report = { ok: result.ok && errors.length === 0, config: options.config, sources: ids.length, errors };
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else if (report.ok) log.ok("source config valid", { sources: report.sources });
  else errors.forEach((error) => log.error(error.message, { path: error.path }));
  if (!report.ok) process.exit(9);
}

main().catch((error) => { log.error("source validation crashed", { error: error.message }); process.exit(1); });
