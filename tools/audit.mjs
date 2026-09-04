import { resolve } from "node:path";
import { log } from "./_lib/log.mjs";
import { writeJson } from "./_lib/fsx.mjs";
import { auditRepository } from "./_lib/repo-audit.mjs";

function reportPath(argv) {
  const inline = argv.find((arg) => arg.startsWith("--report="));
  if (inline) return inline.slice("--report=".length);
  const index = argv.indexOf("--report");
  return index >= 0 ? argv[index + 1] : null;
}

async function main() {
  const argv = process.argv.slice(2);
  const report = await auditRepository();
  const output = reportPath(argv);
  if (output) await writeJson(resolve(output), report);
  for (const issue of report.errors.slice(0, 50)) log.error(issue.message, { path: issue.path });
  for (const issue of report.warnings.slice(0, 50)) log.warn(issue.message, { path: issue.path });
  if (!report.ok) {
    log.error("repository audit FAIL", { errors: report.errors.length, warnings: report.warnings.length, files: report.checkedFiles });
    process.exit(11);
  }
  log.ok("repository audit OK", { warnings: report.warnings.length, files: report.checkedFiles });
}

main().catch((error) => {
  log.error("repository audit crashed", { error: String(error && error.message || error) });
  process.exit(1);
});
