// tools/validate.mjs
// Validate the compiled JSON UI: structural sanity + spec-driven rule checks.
// Usage: node tools/validate.mjs <ui.json> [<solved.json>]

import { log } from "./_lib/log.mjs";
import { readJson, writeJson } from "./_lib/fsx.mjs";
import { validateUiFile, partition } from "./_lib/ui-validator.mjs";

function structural(ui) {
  const errors = [];
  if (!ui || typeof ui !== "object") {
    errors.push({ severity: "error", path: "<root>", message: "ui is not an object" });
    return errors;
  }
  if (!ui.namespace || typeof ui.namespace !== "string") {
    errors.push({ severity: "error", path: "<root>", message: "missing namespace" });
  }
  if (!ui.root_panel || typeof ui.root_panel !== "object") {
    errors.push({ severity: "error", path: "<root>", message: "missing root_panel" });
  }
  return errors;
}

async function main() {
  const [, , uiFile, solvedFile] = process.argv;
  if (!uiFile) {
    log.error("usage: node tools/validate.mjs <ui.json> [<solved.json>]");
    process.exit(64);
  }
  const ui = await readJson(uiFile);
  const issues = [...structural(ui), ...(await validateUiFile(ui, uiFile))];
  const { errors, warnings, infos } = partition(issues);
  const report = {
    schema: "mcbe-jsonui-ai-kit/report@1",
    ok: errors.length === 0,
    errors,
    warnings,
    infos,
    ui: uiFile,
    solved: solvedFile || null,
    checkedAt: new Date().toISOString(),
  };
  const reportPath = uiFile.replace(/ui\.json$/, "report.json");
  await writeJson(reportPath, report);
  if (!report.ok) {
    log.error("validate FAIL", { errors: errors.length, warnings: warnings.length });
    process.exit(9);
  }
  log.ok("validate OK", { warnings: warnings.length, infos: infos.length, report: reportPath });
}

main().catch((e) => {
  log.error("validate crashed", { error: String(e && e.message || e) });
  process.exit(1);
});
