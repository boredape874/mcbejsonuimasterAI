import { mkdtemp, readFile, rm, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { writeJsonAtomic } from "../tools/_lib/fsx.mjs";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const NODE = process.execPath;
const failures = [];
let passed = 0;

function check(name, condition, detail = "") {
  if (condition) { passed++; process.stdout.write(`PASS ${name}\n`); }
  else { failures.push({ name, detail }); process.stdout.write(`FAIL ${name}${detail ? ` ${detail}` : ""}\n`); }
}

function run(args, env = {}) {
  return new Promise((done) => {
    const child = spawn(NODE, args, { cwd: REPO, env: { ...process.env, ...env } });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => done({ code, stdout, stderr }));
  });
}

function parseSingleJson(text) {
  try {
    const value = JSON.parse(text);
    return text.trim() === JSON.stringify(value) ? value : null;
  } catch { return null; }
}

async function main() {
  const root = await mkdtemp(join(tmpdir(), "mcbe-contracts-"));
  try {
    const required = await run(["tools/doctor.mjs", "--quick", "--json"], { NODE_ENV: "test", MCBEKIT_DOCTOR_TEST_FAIL: "workspace" });
    const requiredJson = parseSingleJson(required.stdout);
    check("doctor required failure is nonzero", required.code === 4 && requiredJson?.status === "failed" && requiredJson?.blocking.length === 1, required.stdout);

    const requiredAdvisory = await run(["tools/doctor.mjs", "--quick", "--advisory", "--json"], { NODE_ENV: "test", MCBEKIT_DOCTOR_TEST_FAIL: "workspace" });
    check("advisory cannot waive required failure", requiredAdvisory.code === 4 && parseSingleJson(requiredAdvisory.stdout)?.status === "failed");

    const advisory = await run(["tools/doctor.mjs", "--advisory", "--json"], { NODE_ENV: "test", MCBEKIT_DOCTOR_TEST_FAIL: "vanilla-index" });
    const advisoryJson = parseSingleJson(advisory.stdout);
    check("advisory-only failure is degraded exit zero", advisory.code === 0 && advisoryJson?.status === "degraded" && advisoryJson?.optIn?.advisory === true);
    check("dependency readiness is separate", typeof advisoryJson?.summary?.dependenciesReady === "boolean" && advisoryJson.summary.checks.find((item) => item.name === "node_modules")?.dependenciesReady === true);

    const ui = join(root, "ui.json"), solved = join(root, "solved.json"), previewOut = join(root, "preview");
    await writeFile(ui, JSON.stringify({ namespace: "fixture", root_panel: { type: "panel" } }));
    await writeFile(solved, JSON.stringify({ base_resolution: [100, 100], rects: {}, elements: [] }));
    const preview = await run(["tools/preview.mjs", ui, solved, "--no-image", "--out-dir", previewOut, "--json"]);
    const previewJson = parseSingleJson(preview.stdout);
    check("preview fails closed", preview.code === 9 && previewJson?.ok === false && previewJson?.status === "failed");
    check("preview detailed report is opt-in", !(await readdir(previewOut)).includes("preview-report.json"));
    const previewDiagnostic = await run(["tools/preview.mjs", ui, solved, "--no-image", "--out-dir", join(root, "preview-diagnostic"), "--diagnostic-ok", "--json"]);
    const previewDiagnosticJson = parseSingleJson(previewDiagnostic.stdout);
    check("preview diagnostic opt-in provenance", previewDiagnostic.code === 0 && previewDiagnosticJson?.status === "incomplete" && previewDiagnosticJson?.optIn?.source === "--diagnostic-ok");

    const finalOut = join(root, "final");
    const finalRp = await run(["tools/final-rp-render.mjs", "tests/fixtures/final-rp-v2", "@fixture.screen", "--output-dir", finalOut]);
    const finalJson = parseSingleJson(finalRp.stdout);
    check("final-rp fails closed", finalRp.code === 9 && finalJson?.ok === false && finalJson?.status === "failed");
    const finalDiagnostic = await run(["tools/final-rp-render.mjs", "tests/fixtures/final-rp-v2", "@fixture.screen", "--output-dir", join(root, "final-diagnostic"), "--diagnostic-ok"]);
    check("final-rp diagnostic opt-in provenance", finalDiagnostic.code === 0 && parseSingleJson(finalDiagnostic.stdout)?.optIn?.diagnosticOk === true);

    const blocker = join(root, "not-a-directory");
    await writeFile(blocker, "keep");
    const reportFailure = await run(["tools/doctor.mjs", "--quick", "--json", "--report", join(blocker, "report.json")]);
    const reportFailureJson = parseSingleJson(reportFailure.stdout);
    check("report write failure is nonzero", reportFailure.code === 4 && reportFailureJson?.exitCodeReason === "REPORT_WRITE_FAILED");

    const target = join(root, "atomic.json");
    await writeFile(target, "old\n");
    await writeJsonAtomic(target, { ok: true });
    check("atomic write replaces complete target", JSON.parse(await readFile(target, "utf8")).ok === true);
    check("atomic write leaves no temp files", !(await readdir(root)).some((name) => name.startsWith(".atomic.json.")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
  process.stdout.write(`\nTotal: ${passed} passed, ${failures.length} failed\n`);
  if (failures.length) process.exit(1);
}

main().catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exit(1); });
