import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateOffline } from "./_lib/offline-eval.mjs";
import { createResultEnvelope, printResultJson, resultExitCode } from "./_lib/result-envelope.mjs";

const HELP = `Usage: node tools/eval-offline.mjs [options]

Options:
  --task <id>          Evaluate one fixed task
  --report <path>      Explicit detailed report path
  --update-goldens     Explicitly replace evals/goldens/<task> images
  --json               Print the report as JSON
  --help               Show this help`;
const args = process.argv.slice(2);
if (args.includes("--help")) { console.log(HELP); process.exit(0); }
function option(name, fallback = null) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; }
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
try {
  const requestedReport = option("--report");
  const report = await evaluateOffline({ root, taskManifest: "evals/offline/tasks.json", taskId: option("--task"), reportPath: requestedReport ? resolve(requestedReport) : null, updateGoldens: args.includes("--update-goldens") });
  const failed = report.tasks.filter((task) => !task.ok);
  const result = createResultEnvelope({ ok: report.ok, evidenceLevel: "offline-evaluation", blocking: failed.map((task) => ({ code: "OFFLINE_EVAL_FAILED", task: task.id })), exitCodeReason: report.ok ? "SUCCESS" : "OFFLINE_EVAL_FAILED", artifacts: requestedReport ? [{ kind: "report", path: resolve(requestedReport) }] : [], summary: { passed: report.tasks.length - failed.length, total: report.tasks.length } });
  if (args.includes("--json")) printResultJson(result); else console.log(`[${report.ok ? "OK" : "ERR"}] offline eval: ${report.tasks.filter((task) => task.ok).length}/${report.tasks.length} passed`);
  process.exitCode = resultExitCode(result);
} catch (error) { console.error(`[ERR] ${error.message}`); process.exitCode = 1; }
