import { resolve } from "node:path";
import { analyzeServerFormContract } from "./_lib/server-form-contract.mjs";

function usage() { console.log("Usage: node tools/server-form-contract.mjs --rp <server_form.json> [--bp <script.js>] [--json]"); }
function parseArgs(args) {
  const result = { json: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help") return { help: true };
    if (arg === "--json") result.json = true;
    else if (arg === "--rp" || arg === "--bp") { if (!args[index + 1]) return null; result[arg.slice(2) + "Path"] = resolve(args[++index]); }
    else return null;
  }
  return result.rpPath ? result : null;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options || options.help) { usage(); process.exit(options ? 0 : 64); }
  const result = await analyzeServerFormContract(options);
  if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  else {
    process.stdout.write(`${result.ok ? "PASS" : "FAIL"} server-form contract (${result.evidenceLevel}; runtime not verified)\n`);
    for (const item of [...result.diagnostics, ...result.unresolved]) process.stdout.write(`${item.code} ${item.path}: ${item.message}\n`);
  }
  if (!result.ok) process.exit(9);
}

main().catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exit(1); });
