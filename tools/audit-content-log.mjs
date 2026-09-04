import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseContentLog } from "./_lib/content-log.mjs";

const args = process.argv.slice(2), file = args[0];
const targetIndex = args.indexOf("--target"), target = targetIndex >= 0 ? args[targetIndex + 1] : null;
if (!file || targetIndex >= 0 && !target) { console.error("usage: node tools/audit-content-log.mjs <log-path> [--target <namespace.control>] [--json]"); process.exit(64); }
try {
  const report = parseContentLog(await readFile(resolve(file), "utf8"), { targetControl: target });
  console.log(args.includes("--json") ? JSON.stringify(report) : `${report.ok ? "OK" : "FAIL"} target UI errors=${report.targetUiErrors.length}, external errors=${report.externalNoise.length}`);
  if (!report.ok) process.exitCode = 9;
} catch (error) { console.error(String(error?.message || error)); process.exitCode = 1; }
