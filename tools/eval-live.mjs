import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const HELP = `Usage: node tools/eval-live.mjs [options]

This tool does not emulate Bedrock. It records whether real PC/touch screenshots
and a Bedrock content log were supplied for each task.

Options:
  --task <id>          Evaluate one task
  --evidence <path>    Evidence JSON (default: evals/live/evidence.json)
  --report <path>      Report path (default: workspace/live-eval-report.json)
  --json               Print the report as JSON
  --help               Show this help`;
const args = process.argv.slice(2);
if (args.includes("--help")) { console.log(HELP); process.exit(0); }
function option(name, fallback = null) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; }
async function exists(path) { try { await stat(path); return true; } catch { return false; } }
const root = resolve(fileURLToPath(new URL("..", import.meta.url))), taskManifest = JSON.parse(await readFile(resolve(root, "evals/offline/tasks.json"), "utf8"));
const taskId = option("--task"), selected = taskId ? taskManifest.tasks.filter((task) => task.id === taskId) : taskManifest.tasks;
if (taskId && selected.length !== 1) { console.error(`[ERR] unknown task: ${taskId}`); process.exit(64); }
const evidencePath = resolve(root, option("--evidence", "evals/live/evidence.json")), reportPath = resolve(option("--report", resolve(root, "workspace/live-eval-report.json")));
const evidenceRoot = dirname(evidencePath);
function contained(path) { const candidate = resolve(evidenceRoot, path); return candidate === evidenceRoot || candidate.startsWith(`${evidenceRoot}\\`) || candidate.startsWith(`${evidenceRoot}/`) ? candidate : null; }
let evidence = { tasks: {} };
if (await exists(evidencePath)) evidence = JSON.parse(await readFile(evidencePath, "utf8"));
const tasks = [];
for (const task of selected) {
  const item = evidence.tasks?.[task.id] || {}, issues = [];
  if (!item.codex?.beforePrompt || !item.codex?.afterResult) issues.push("missing Codex beforePrompt/afterResult manifest");
  if (!item.bedrockVersion) issues.push("missing Bedrock version");
  for (const [profile, expected] of [["pc", [1920, 1080]], ["touch", [1280, 720]]]) {
    const screenshot = item.screenshots?.[profile];
    if (!screenshot) issues.push(`missing real ${profile} screenshot`);
    else {
      const path = contained(screenshot);
      if (!path) issues.push(`${profile} screenshot escapes evidence root`);
      else if (!(await exists(path)) || extname(path).toLowerCase() !== ".png") issues.push(`invalid ${profile} screenshot evidence`);
      else try { const png = PNG.sync.read(await readFile(path)); if (png.width !== expected[0] || png.height !== expected[1]) issues.push(`${profile} screenshot dimensions ${png.width}x${png.height}, expected ${expected.join("x")}`); } catch { issues.push(`${profile} screenshot is not a decodable PNG`); }
    }
  }
  if (!item.contentLog) issues.push("missing Bedrock content log");
  else {
    const logPath = contained(item.contentLog);
    if (!logPath) issues.push("content log escapes evidence root");
    else if (!(await exists(logPath))) issues.push("content log file does not exist");
    else { const text = await readFile(logPath, "utf8"); if (!/^\[[^\]]+\]/m.test(text)) issues.push("content log lacks structured timestamp/category lines"); if (/\[UI\]\[error\]|unknown propert|missing reference/i.test(text)) issues.push("content log contains JSON UI errors"); }
  }
  tasks.push({ id: task.id, status: issues.length ? "runtime-unverified" : "runtime-evidence-present", ok: issues.length === 0, issues });
}
const report = {
  schema: "mcbe-jsonui-ai-kit/live-eval@1", ok: tasks.every((task) => task.ok), emulation: false,
  note: "Only real Bedrock PC/touch screenshots and content logs can satisfy this gate.", evidence: evidencePath, tasks,
  evidenceTemplate: { tasks: Object.fromEntries(selected.map((task) => [task.id, { bedrockVersion: "<version>", codex: { beforePrompt: "<exact validation prompt>", afterResult: "<Codex result manifest or task id>" }, screenshots: { pc: "screenshots/<task>-pc.png", touch: "screenshots/<task>-touch.png" }, contentLog: "logs/<task>-content.log", notes: "Describe device, Bedrock version, and interaction tested." }])) },
  prompt: "Open each example in Minecraft Bedrock. Capture the same screen on PC and touch, exercise default/hover/pressed where applicable, then attach the screenshots and content log. Do not mark runtime complete if any UI error is present.",
};
await mkdir(dirname(reportPath), { recursive: true }); await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (args.includes("--json")) console.log(JSON.stringify(report)); else console.log(`[${report.ok ? "OK" : "PENDING"}] live eval: ${tasks.filter((task) => task.ok).length}/${tasks.length} have runtime evidence; report=${reportPath}`);
if (!report.ok) process.exitCode = 9;
