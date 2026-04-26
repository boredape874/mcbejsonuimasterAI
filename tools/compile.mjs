// tools/compile.mjs
// Usage: node tools/compile.mjs <solved.json> <ui.json>

import { log } from "./_lib/log.mjs";
import { readJson, writeJson } from "./_lib/fsx.mjs";
import { compile } from "./_lib/compiler.mjs";

async function main() {
  const [, , inFile, outFile] = process.argv;
  if (!inFile || !outFile) {
    log.error("usage: node tools/compile.mjs <solved.json> <ui.json>");
    process.exit(64);
  }
  const solved = await readJson(inFile);
  if (solved.schema !== "mcbe-jsonui-ai-kit/solved@1") {
    log.error("input is not a solved IR (wrong schema field)");
    process.exit(8);
  }
  const ui = compile(solved);
  await writeJson(outFile, ui);
  log.ok("compiled", { namespace: solved.namespace, controls: Object.keys(ui).length - 2 });
}

main().catch((e) => {
  log.error("compile crashed", { error: String(e && e.message || e) });
  process.exit(1);
});
