// tools/validate.mjs
// Validate the compiled JSON UI: structural sanity + spec-driven rule checks.
// Usage: node tools/validate.mjs <ui.json> [<solved.json>] [--strict-root] [--report <path>]
//
//   --strict-root      require ui.namespace + ui.root_panel (compiler output mode).
//                      Default mode is permissive: handcrafted Bedrock UI files
//                      often use 'main_screen_content' / 'hud_content' / a
//                      modification entry instead of root_panel. In permissive
//                      mode the namespace+root_panel checks are downgraded to
//                      warnings, never errors.
//
//   --report <path>    write the JSON report to <path>. If omitted, only a
//                      one-line stdout summary is printed (no file litter).
//                      tools/run.mjs uses --report explicitly.

import { log } from "./_lib/log.mjs";
import { readJson, writeJson } from "./_lib/fsx.mjs";
import { validateUiFile, partition } from "./_lib/ui-validator.mjs";

function structural(ui, strict) {
  const issues = [];
  if (!ui || typeof ui !== "object") {
    issues.push({ severity: "error", path: "<root>", message: "ui is not an object" });
    return issues;
  }
  const sev = strict ? "error" : "warning";
  if (!ui.namespace || typeof ui.namespace !== "string") {
    issues.push({ severity: sev, path: "<root>", message: "missing namespace" });
  }
  // A handcrafted screen file does not need root_panel — Bedrock vanilla
  // hud_screen.json, server_form.json, chat_screen.json all use other names.
  // Only flag when strict mode is on (i.e. validating compiler output).
  if (strict && (!ui.root_panel || typeof ui.root_panel !== "object")) {
    issues.push({ severity: "error", path: "<root>", message: "missing root_panel" });
  }
  return issues;
}

function reportPathFromArgs(argv) {
  const i = argv.indexOf("--report");
  if (i === -1) return null;
  const v = argv[i + 1];
  if (!v || v.startsWith("--")) return null;
  return v;
}

async function main() {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict-root");
  const reportPath = reportPathFromArgs(argv);
  const positional = argv.filter((a, i) => {
    if (a.startsWith("--")) return false;
    // skip the value of --report
    if (i > 0 && argv[i - 1] === "--report") return false;
    return true;
  });
  const [uiFile, solvedFile] = positional;
  if (!uiFile) {
    log.error("usage: node tools/validate.mjs <ui.json> [<solved.json>] [--strict-root] [--report <path>]");
    process.exit(64);
  }
  const ui = await readJson(uiFile);
  const issues = [...structural(ui, strict), ...(await validateUiFile(ui, uiFile))];
  const { errors, warnings, infos } = partition(issues);
  const report = {
    schema: "mcbe-jsonui-ai-kit/report@1",
    ok: errors.length === 0,
    strict,
    errors,
    warnings,
    infos,
    ui: uiFile,
    solved: solvedFile || null,
    checkedAt: new Date().toISOString(),
  };
  if (reportPath) await writeJson(reportPath, report);
  if (!report.ok) {
    log.error("validate FAIL", { errors: errors.length, warnings: warnings.length, ...(reportPath ? { report: reportPath } : {}) });
    process.exit(9);
  }
  log.ok("validate OK", { warnings: warnings.length, infos: infos.length, ...(reportPath ? { report: reportPath } : {}) });
}

main().catch((e) => {
  log.error("validate crashed", { error: String(e && e.message || e) });
  process.exit(1);
});
