// tools/doctor.mjs
// Diagnostic tool. Modes:
//   (default) full check
//   --quick   3-second sanity check (used at task start)
//   --fix     attempt automatic remediation
//   --verbose verbose output for last-resort triage

import { spawnSync } from "node:child_process";
import { PATHS } from "./_lib/paths.mjs";
import { log } from "./_lib/log.mjs";
import { exists } from "./_lib/fsx.mjs";
import { createResultEnvelope, printResultJson, resultExitCode } from "./_lib/result-envelope.mjs";
import { writeReportArtifact } from "./_lib/report-envelope.mjs";
import { readJson } from "./_lib/fsx.mjs";
import { resolve } from "node:path";
import { packageLockSha256 } from "./_lib/dependency-revision.mjs";

const args = new Set(process.argv.slice(2));
const QUICK = args.has("--quick");
const FIX = args.has("--fix");
const VERBOSE = args.has("--verbose");
const JSON_OUTPUT = args.has("--json");
const ADVISORY = args.has("--advisory");
const reportIndex = process.argv.indexOf("--report");
const REPORT_PATH = reportIndex >= 0 ? process.argv[reportIndex + 1] : null;

const checks = [];
function check(name, required, fn) { checks.push({ name, required, fn }); }

check("node-version", true, async () => {
  const v = process.versions.node;
  const [maj, min] = v.split(".").map(Number);
  if (maj < 18 || (maj === 18 && min < 17)) {
    return { ok: false, msg: `Node ${v} too old`, fix: null };
  }
  return { ok: true, msg: `Node ${v}` };
});

check("node_modules", true, async () => {
  const ok = await exists(PATHS.nodeModules);
  if (!ok) return { ok: false, dependenciesReady: false, msg: "missing", fix: "npm install" };
  const manifest = await readJson(PATHS.packageJson);
  const missing = [];
  for (const name of Object.keys(manifest.dependencies || {})) {
    if (!await exists(resolve(PATHS.nodeModules, ...name.split("/")))) missing.push(name);
  }
  return missing.length
    ? { ok: false, dependenciesReady: false, msg: `required packages missing: ${missing.join(", ")}`, fix: "npm install" }
    : { ok: true, dependenciesReady: true, msg: "required packages present" };
});

check("setup-state", true, async () => {
  const ok = await exists(PATHS.setupState);
  if (!ok) return { ok: false, msg: "missing", fix: "node tools/setup.mjs" };
  const state = await readJson(PATHS.setupState);
  const lockHash = await packageLockSha256(PATHS.root);
  return state.packageLockHash && state.packageLockHash === lockHash
    ? { ok: true, msg: "present and dependency revision matches" }
    : { ok: false, msg: "stale dependency revision", fix: "node tools/setup.mjs" };
});

check("workspace", true, async () => {
  const ok = await exists(PATHS.workspace);
  return ok ? { ok: true, msg: "present" } : { ok: false, msg: "missing", fix: "node tools/setup.mjs" };
});

if (!QUICK) {
  check("vanilla-index", false, async () => {
    const ok = await exists(PATHS.vanillaIndexScreens);
    return ok
      ? { ok: true, msg: "screens.json present" }
      : { ok: false, msg: "missing", fix: "node tools/build-vanilla-index.mjs (after syncing upstream mirror)" };
  });

  check("ir-schema", true, async () => {
    const ok = await exists(PATHS.irSchema);
    return ok
      ? { ok: true, msg: "schemas/ir.schema.json present" }
      : { ok: false, msg: "missing", fix: "ensure schemas/ir.schema.json exists (do not regenerate by hand)" };
  });
}

async function tryFix(fixCmd) {
  if (!fixCmd) return false;
  log.info(`fix: ${fixCmd}`);
  // Only allow whitelisted fix commands.
  if (fixCmd === "npm install") {
    const res = spawnSync("npm", ["install", "--no-fund", "--no-audit"], {
      cwd: PATHS.root, stdio: "inherit", shell: process.platform === "win32",
    });
    return res.status === 0;
  }
  if (fixCmd.startsWith("node tools/")) {
    const parts = fixCmd.split(" ");
    const res = spawnSync(process.execPath, [parts[1]], {
      cwd: PATHS.root, stdio: "inherit",
    });
    return res.status === 0;
  }
  log.warn("fix not auto-runnable; perform manually");
  return false;
}

async function main() {
  const results = [];
  const forcedFailures = process.env.NODE_ENV === "test"
    ? new Set(String(process.env.MCBEKIT_DOCTOR_TEST_FAIL || "").split(",").filter(Boolean))
    : new Set();
  for (const c of checks) {
    try {
      const r = forcedFailures.has(c.name)
        ? { ok: false, msg: "forced test failure" }
        : await c.fn();
      results.push({ name: c.name, required: c.required, ...r });
      if (!JSON_OUTPUT) {
        if (r.ok) log.ok(`${c.name}: ${r.msg}`);
        else log.warn(`${c.name}: ${r.msg}${r.fix ? " (fix: " + r.fix + ")" : ""}`);
      }
    } catch (e) {
      results.push({ name: c.name, required: c.required, ok: false, msg: String(e && e.message || e) });
      if (!JSON_OUTPUT) log.error(`${c.name}: ${e.message || e}`);
    }
  }
  if (FIX) {
    for (const r of results) {
      if (!r.ok && r.fix) {
        const ok = await tryFix(r.fix);
        if (ok) log.ok(`fixed ${r.name}`);
        else log.warn(`could not fix ${r.name}`);
      }
    }
  }
  const fails = results.filter((r) => !r.ok);
  const requiredFails = fails.filter((r) => r.required);
  const advisoryFails = fails.filter((r) => !r.required);
  if (VERBOSE && !JSON_OUTPUT) {
    log.info("results", { results });
  }
  const dependencyCheck = results.find((entry) => entry.name === "node_modules");
  const ok = requiredFails.length === 0 && advisoryFails.length === 0;
  const degraded = requiredFails.length === 0 && advisoryFails.length > 0;
  const result = createResultEnvelope({
    ok,
    status: ok ? "passed" : degraded ? "degraded" : "failed",
    evidenceLevel: "dependency-readiness",
    blocking: requiredFails.map((entry) => ({ code: "REQUIRED_CHECK_FAILED", check: entry.name, message: entry.msg })),
    exitCodeReason: ok ? "SUCCESS" : degraded ? "ADVISORY_FAILURE" : "REQUIRED_CHECK_FAILED",
    optIn: ADVISORY ? { advisory: true } : null,
    summary: {
      mode: QUICK ? "quick" : "full",
      dependenciesReady: dependencyCheck?.dependenciesReady === true,
      checks: results,
      advisoryFailures: advisoryFails.map((entry) => entry.name),
    },
  });
  try {
    const artifact = await writeReportArtifact(REPORT_PATH, { results }, { kind: "doctor-details" });
    if (artifact) result.artifacts.push(artifact);
  } catch (error) {
    result.ok = false;
    result.status = "failed";
    result.exitCodeReason = "REPORT_WRITE_FAILED";
    result.blocking.push({ code: "REPORT_WRITE_FAILED", message: String(error?.message || error) });
  }
  if (JSON_OUTPUT) printResultJson(result);
  else if (result.ok) log.ok("all checks passed");
  else log[result.status === "degraded" ? "warn" : "error"](`${fails.length} check(s) failed`, { fails: fails.map((f) => f.name), status: result.status });
  process.exit(resultExitCode(result, { failureCode: 4 }));
}

main().catch((err) => {
  log.error("doctor failed", { error: String(err && err.message || err) });
  process.exit(1);
});
