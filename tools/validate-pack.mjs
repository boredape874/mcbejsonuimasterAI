import { resolve } from "node:path";
import { log } from "./_lib/log.mjs";
import { writeJson } from "./_lib/fsx.mjs";
import { validatePack } from "./_lib/pack-validator.mjs";

function parseArgs(argv) {
  const options = {
    packPath: null,
    reportPath: null,
    allowMissingTextures: false,
    allowPartialUiDefs: false,
    strictWarnings: false,
    dialect: "bedrock-json@1.21.100",
    vanillaProfile: "bedrock-1.21.100",
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--allow-missing-textures") options.allowMissingTextures = true;
    else if (arg === "--allow-partial-ui-defs") options.allowPartialUiDefs = true;
    else if (arg === "--strict-warnings") options.strictWarnings = true;
    else if (arg.startsWith("--dialect=")) options.dialect = arg.slice("--dialect=".length);
    else if (arg === "--dialect") options.dialect = argv[++index];
    else if (arg.startsWith("--vanilla-profile=")) options.vanillaProfile = arg.slice("--vanilla-profile=".length);
    else if (arg.startsWith("--report=")) options.reportPath = arg.slice("--report=".length);
    else if (arg === "--report") {
      const value = argv[++index];
      if (!value || value.startsWith("--")) return null;
      options.reportPath = value;
    }
    else if (arg.startsWith("--") || options.packPath !== null) return null;
    else options.packPath = arg;
  }
  if (!options.packPath || options.reportPath === "" || options.reportPath?.startsWith("--")) return null;
  return options;
}

function showIssues(report) {
  for (const issue of report.errors.slice(0, 20)) log.error(issue.message, { path: issue.path, suggestion: issue.suggestion });
  for (const issue of report.warnings.slice(0, 20)) log.warn(issue.message, { path: issue.path, suggestion: issue.suggestion });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options) {
    log.error("usage: node tools/validate-pack.mjs <pack-path> [--dialect <id>] [--vanilla-profile=<id>] [--allow-missing-textures] [--allow-partial-ui-defs] [--strict-warnings] [--report <path>]");
    process.exit(64);
  }

  const report = await validatePack(options.packPath, {
    allowMissingTextures: options.allowMissingTextures,
    allowPartialUiDefs: options.allowPartialUiDefs,
    dialect: options.dialect,
    vanillaProfile: options.vanillaProfile,
  });
  if (options.reportPath) await writeJson(resolve(options.reportPath), report);
  showIssues(report);

  if (!report.ok) {
    log.error("pack validation FAIL", { errors: report.errors.length, warnings: report.warnings.length, files: report.files });
    process.exit(9);
  }
  if (options.strictWarnings && report.warnings.length) {
    log.error("pack validation has warnings", { warnings: report.warnings.length, files: report.files });
    process.exit(10);
  }
  log.ok("pack validation OK", { warnings: report.warnings.length, files: report.files, textures: report.textureReferences });
}

main().catch((error) => {
  log.error("pack validation crashed", { error: String(error && error.message || error) });
  process.exit(1);
});
