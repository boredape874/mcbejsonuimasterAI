import { dirname, resolve } from "node:path";
import { readJsonc } from "./_lib/jsonc.mjs";
import { writeJson } from "./_lib/fsx.mjs";
import { log } from "./_lib/log.mjs";
import { scanSource, validateWithSchema } from "./_lib/source-corpus.mjs";
import { resolveSourceRoots, validateSourcePaths } from "./_lib/source-paths.mjs";

function parseArgs(args) {
  const options = { config: "config/sources.public.json", out: "workspace/corpus-local", source: null, json: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help") return { help: true };
    if (arg === "--json") options.json = true;
    else if (["--config", "--out", "--source"].includes(arg)) { const value = args[++index]; if (!value) return null; options[arg.slice(2)] = value; }
    else return null;
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options || options.help) {
    console.log("usage: node tools/source-scan.mjs [--config path] [--source id] [--out dir] [--json]");
    process.exit(options ? 0 : 64);
  }
  const configPath = resolve(options.config);
  const config = await readJsonc(configPath);
  const validation = await validateWithSchema(config, resolve("schemas/source.schema.json"));
  if (!validation.ok) { validation.errors.forEach((item) => log.error(item.message, { path: item.instancePath })); process.exit(9); }
  const pathErrors = await validateSourcePaths(config, configPath);
  if (pathErrors.length) { pathErrors.forEach((item) => log.error(item.message, { path: item.path })); process.exit(9); }
  const selected = options.source ? config.sources.filter((item) => item.id === options.source) : config.sources;
  if (options.source && !selected.length) { log.error("source id not found", { source: options.source }); process.exit(9); }
  const scans = [];
  for (const source of selected) {
    await resolveSourceRoots(source, configPath, config.scope);
    const scan = await scanSource(source, dirname(configPath));
    scans.push(scan);
    await writeJson(resolve(options.out, `${source.id}.json`), scan);
  }
  const corpus = { schemaVersion: 1, generatedAt: new Date().toISOString(), sources: scans };
  await writeJson(resolve(options.out, "index.json"), corpus);
  const summary = { ok: true, output: options.out, sources: scans.length, screens: scans.reduce((n, item) => n + item.stats.screens, 0), assets: scans.reduce((n, item) => n + item.stats.assets, 0), unresolved: scans.reduce((n, item) => n + item.stats.unresolved, 0), blockingUnresolved: scans.reduce((n, item) => n + item.stats.blockingUnresolved, 0) };
  if (options.json) console.log(JSON.stringify(summary, null, 2));
  else log.ok("source scan complete", summary);
}

main().catch((error) => { log.error("source scan crashed", { error: error.message }); process.exit(1); });
