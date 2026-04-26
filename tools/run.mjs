// tools/run.mjs
// One-shot pipeline: ir-validate → solve → compile → validate.
// Usage: node tools/run.mjs <ir.yaml> [--out <dir>]

import { dirname, basename, resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
import { log } from "./_lib/log.mjs";
import { ensureDir, exists } from "./_lib/fsx.mjs";
import { PATHS } from "./_lib/paths.mjs";

function runStep(name, args) {
  log.info(`step: ${name}`);
  const res = spawnSync(process.execPath, args, { cwd: PATHS.root, stdio: "inherit" });
  return res.status ?? 1;
}

async function main() {
  const argv = process.argv.slice(2);
  const irPath = argv[0];
  if (!irPath) {
    log.error("usage: node tools/run.mjs <ir.yaml> [--out <dir>]");
    process.exit(64);
  }
  const outIdx = argv.indexOf("--out");
  const outDir = outIdx >= 0 ? resolve(argv[outIdx + 1]) : dirname(resolve(irPath));
  await ensureDir(outDir);

  const solved = join(outDir, "solved.json");
  const ui = join(outDir, "ui.json");

  let code = runStep("ir-validate", ["tools/ir-validate.mjs", irPath]);
  if (code) process.exit(code);

  code = runStep("solve", ["tools/solve.mjs", irPath, solved]);
  if (code && code !== 7) process.exit(code);
  if (code === 7) log.warn("solver did not fully converge; continuing");

  code = runStep("compile", ["tools/compile.mjs", solved, ui]);
  if (code) process.exit(code);

  const reportPath = join(outDir, "report.json");
  code = runStep("validate", ["tools/validate.mjs", ui, solved, "--strict-root", "--report", reportPath]);
  if (code) process.exit(code);

  log.ok("pipeline complete", { ui, solved, report: reportPath });
}

main().catch((e) => {
  log.error("run crashed", { error: String(e && e.message || e) });
  process.exit(1);
});
