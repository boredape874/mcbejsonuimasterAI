import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluateOffline } from "./_lib/offline-eval.mjs";

const HELP = `Usage: node tools/eval-offline.mjs [options]

Options:
  --task <id>          Evaluate one fixed task
  --report <path>      Report path (default: workspace/offline-eval-report.json)
  --update-goldens     Explicitly replace evals/goldens/<task> images
  --json               Print the report as JSON
  --help               Show this help`;
const args = process.argv.slice(2);
if (args.includes("--help")) { console.log(HELP); process.exit(0); }
function option(name, fallback = null) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; }
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
try {
  const report = await evaluateOffline({ root, taskManifest: "evals/offline/tasks.json", taskId: option("--task"), reportPath: resolve(option("--report", "workspace/offline-eval-report.json")), updateGoldens: args.includes("--update-goldens") });
  if (args.includes("--json")) console.log(JSON.stringify(report)); else console.log(`[${report.ok ? "OK" : "ERR"}] offline eval: ${report.tasks.filter((task) => task.ok).length}/${report.tasks.length} passed`);
  if (!report.ok) process.exitCode = 9;
} catch (error) { console.error(`[ERR] ${error.message}`); process.exitCode = 1; }
