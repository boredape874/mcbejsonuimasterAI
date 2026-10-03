// tools/vanilla-name-check.mjs
// Answer "does this name exist in current vanilla JSON UI?" offline, from the
// pinned official sample files (references/official/bedrock-samples-ui, 12
// screens) and, when a local sparse mirror of Mojang/bedrock-samples exists,
// from every resource_pack/ui file of that mirror.
//
// Usage:
//   node tools/vanilla-name-check.mjs <name> [<name> ...] [--mirror <path>] [--no-mirror] [--json] [--report <path>]
//
//   <name>   namespace.control (common.button), bare control (button → any namespace),
//            #binding, $variable, button.id, textures/ui/path, renderer, or ui/screen.json
//   --mirror <path>   sparse mirror root (default references/upstreams/bedrock-samples); used only if present
//   --no-mirror       check the committed 12 files only, even when a mirror exists
//
// Exit codes: 0 every name found, 3 at least one name not found, 64 usage.
// A hit proves the name occurs in that revision's files; it does not prove the
// property or binding works in the caller's screen context (see docs/19, docs/34).

import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { PATHS } from "./_lib/paths.mjs";
import { exists, readJson, writeJsonAtomic } from "./_lib/fsx.mjs";
import { log } from "./_lib/log.mjs";
import { createResultEnvelope, printResultJson } from "./_lib/result-envelope.mjs";
import { buildNameIndex, lookupName } from "./_lib/vanilla-names.mjs";

const DEFAULT_MIRROR = resolve(PATHS.root, "references", "upstreams", "bedrock-samples");
const LOCK_PATH = resolve(PATHS.root, "references", "official", "bedrock-samples-ui.lock.json");
const MOLANG_PATH = resolve(PATHS.root, "data", "molang-queries-1.26.50.json");

function usage() {
  process.stdout.write([
    "Usage: node tools/vanilla-name-check.mjs <name> [<name> ...] [--mirror <path>] [--no-mirror] [--json] [--report <path>]",
    "",
    "Checks control, #binding, $variable, button id, texture, renderer, factory, collection and ui/screen.json names",
    "against the pinned official bedrock-samples UI files (and the full local mirror when present).",
    "With the mirror it also resolves pack identifiers (minecraft:… client entities and attachables, geometry.*,",
    "animation.*, controller.animation.*, controller.render.*, material short names), and query.* / q.* names are",
    "checked against the documented Molang list for the pinned version (data/molang-queries-1.26.50.json).",
    "Exit 0 when every name is found, 3 when at least one is missing.",
    "",
  ].join("\n"));
}

function parseArgs(argv) {
  const options = { names: [], mirror: DEFAULT_MIRROR, useMirror: true, json: false, report: null, help: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const value = () => { const next = argv[++index]; if (next === undefined || next.startsWith("--")) throw new Error(`${arg} requires a value`); return next; };
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--no-mirror") options.useMirror = false;
    else if (arg === "--mirror") options.mirror = resolve(PATHS.root, value());
    else if (arg.startsWith("--mirror=")) options.mirror = resolve(PATHS.root, arg.slice("--mirror=".length));
    else if (arg === "--report") options.report = resolve(PATHS.root, value());
    else if (arg.startsWith("--report=")) options.report = resolve(PATHS.root, arg.slice("--report=".length));
    else if (arg.startsWith("--")) throw new Error(`unknown argument: ${arg}`);
    else options.names.push(arg);
  }
  return options;
}

export async function checkVanillaNames(names, { mirror = DEFAULT_MIRROR, useMirror = true } = {}) {
  const sources = [{ label: "pinned", root: PATHS.bedrockSamplesUi }];
  const mirrorUi = resolve(mirror, "resource_pack", "ui");
  const mirrorUsed = useMirror && await exists(mirrorUi);
  if (mirrorUsed) sources.push({ label: "mirror", root: mirrorUi });
  // Pack identifiers (client entities, attachables, geometry, animation, controller ids, material
  // short names) come from the mirror's resource_pack folders when the mirror is present.
  const mirrorPack = resolve(mirror, "resource_pack");
  if (useMirror && await exists(resolve(mirrorPack, "attachables"))) sources.push({ label: "mirror-pack", root: mirrorPack, kind: "pack" });
  // Documented Molang query names at the pinned version (data/molang-queries-1.26.50.json).
  const molang = await readJson(MOLANG_PATH).catch(() => null);
  const index = await buildNameIndex(sources, { molang });
  const lock = await readJson(LOCK_PATH).catch(() => null);
  const results = names.map((name) => lookupName(index, name));
  return {
    revision: lock?.upstream ? { tag: lock.upstream.tag ?? null, commit: lock.upstream.commit ?? null } : null,
    sources: sources.map((source) => ({ label: source.label, path: relative(PATHS.root, source.root).split(sep).join("/") })),
    mirrorUsed,
    filesIndexed: index.files.length,
    results,
    missing: results.filter((result) => !result.found).map((result) => result.query),
  };
}

async function main() {
  let options;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) { log.error(String(error.message || error)); usage(); process.exit(64); }
  if (options.help) { usage(); return; }
  if (!options.names.length) { usage(); process.exit(64); }

  const report = await checkVanillaNames(options.names, { mirror: options.mirror, useMirror: options.useMirror });
  const ok = report.missing.length === 0;
  const result = createResultEnvelope({
    ok,
    status: ok ? "passed" : "failed",
    evidenceLevel: "static",
    blocking: report.missing.map((name) => ({ code: "VANILLA_NAME_NOT_FOUND", path: name, message: `not found in ${report.mirrorUsed ? "the pinned samples or the local mirror" : "the pinned sample files"}` })),
    exitCodeReason: ok ? "SUCCESS" : "VANILLA_NAME_NOT_FOUND",
    summary: { revision: report.revision, sources: report.sources, mirrorUsed: report.mirrorUsed, filesIndexed: report.filesIndexed, results: report.results },
  });
  if (options.report) await writeJsonAtomic(options.report, result);
  if (options.json) printResultJson(result);
  else {
    const pin = report.revision?.tag || report.revision?.commit?.slice(0, 12) || "unpinned";
    log.info(`vanilla ${pin}: ${report.filesIndexed} files indexed (${report.mirrorUsed ? "pinned + mirror" : "pinned 12 files only"})`);
    for (const entry of report.results) {
      if (!entry.found) { log.warn(`${entry.query}: NOT FOUND`); continue; }
      for (const match of entry.matches) log.ok(`${entry.query}: ${match.kind} in ${match.files.slice(0, 4).join(", ")}${match.fileCount > 4 ? ` (+${match.fileCount - 4} more)` : ""}`);
    }
    if (!ok) log.error(`${report.missing.length} name(s) not found`, { missing: report.missing, hint: "Not found in vanilla; treat as a pack/community name or check docs/83 for renames." });
  }
  process.exit(ok ? 0 : 3);
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    log.error("vanilla-name-check crashed", { error: String(error && error.message || error) });
    process.exit(1);
  });
}
