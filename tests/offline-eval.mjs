import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
function run(args) { return new Promise((done) => { const child = spawn(process.execPath, args, { cwd: root }); let stdout = "", stderr = ""; child.stdout.on("data", (d) => { stdout += d; }); child.stderr.on("data", (d) => { stderr += d; }); child.on("close", (code) => done({ code, stdout, stderr })); }); }
const help = await run(["tools/eval-offline.mjs", "--help"]);
assert.equal(help.code, 0); assert.match(help.stdout, /--update-goldens/); assert.match(help.stdout, /--task/);
const evaluated = await run(["tools/eval-offline.mjs", "--json", "--report", "workspace/_test_offline_eval/report.json"]);
assert.equal(evaluated.code, 0, evaluated.stderr || evaluated.stdout);
const report = JSON.parse(evaluated.stdout.trim());
assert.equal(report.tasks.length, 7); assert.equal(report.ok, true);
for (const task of report.tasks) { assert.equal(task.ok, true, task.id); assert.ok(task.checks.find((item) => item.id === "pixelmatch_goldens")?.ok, task.id); }
const live = await run(["tools/eval-live.mjs", "--task", "typography_state_gallery", "--json", "--report", "workspace/_test_offline_eval/live.json"]);
assert.equal(live.code, 9); const liveReport = JSON.parse(live.stdout.trim()); assert.equal(liveReport.emulation, false); assert.equal(liveReport.tasks[0].status, "runtime-unverified");
console.log("PASS offline evaluation suite and live evidence safety gate");
