// tools/doctor.mjs
// Diagnostic tool. Modes:
//   (default) full check
//   --quick   3-second sanity check (used at task start)
//   --fix     attempt automatic remediation
//   --verbose verbose output for last-resort triage

import { spawnSync } from "node:child_process";
import { PATHS } from "./_lib/paths.mjs";
import { log } from "./_lib/log.mjs";
import { exists, readJson } from "./_lib/fsx.mjs";

const args = new Set(process.argv.slice(2));
const QUICK = args.has("--quick");
const FIX = args.has("--fix");
const VERBOSE = args.has("--verbose");

const checks = [];
function check(name, fn) { checks.push({ name, fn }); }

check("node-version", async () => {
  const v = process.versions.node;
  const [maj, min] = v.split(".").map(Number);
  if (maj < 18 || (maj === 18 && min < 17)) {
    return { ok: false, msg: `Node ${v} too old`, fix: null };
  }
  return { ok: true, msg: `Node ${v}` };
});

check("node_modules", async () => {
  const ok = await exists(PATHS.nodeModules);
  return ok
    ? { ok: true, msg: "present" }
    : { ok: false, msg: "missing", fix: "npm install" };
});

check("setup-state", async () => {
  const ok = await exists(PATHS.setupState);
  return ok
    ? { ok: true, msg: "present" }
    : { ok: false, msg: "missing", fix: "node tools/setup.mjs" };
});

check("workspace", async () => {
  const ok = await exists(PATHS.workspace);
  return ok ? { ok: true, msg: "present" } : { ok: false, msg: "missing", fix: "node tools/setup.mjs" };
});

if (!QUICK) {
  check("vanilla-index", async () => {
    const ok = await exists(PATHS.vanillaIndexScreens);
    return ok
      ? { ok: true, msg: "screens.json present" }
      : { ok: false, msg: "missing", fix: "node tools/build-vanilla-index.mjs (after syncing upstream mirror)" };
  });

  check("ir-schema", async () => {
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
  for (const c of checks) {
    try {
      const r = await c.fn();
      results.push({ name: c.name, ...r });
      if (r.ok) log.ok(`${c.name}: ${r.msg}`);
      else log.warn(`${c.name}: ${r.msg}${r.fix ? " (fix: " + r.fix + ")" : ""}`);
    } catch (e) {
      results.push({ name: c.name, ok: false, msg: String(e && e.message || e) });
      log.error(`${c.name}: ${e.message || e}`);
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
  if (VERBOSE) {
    log.info("results", { results });
  }
  if (fails.length === 0) {
    log.ok("all checks passed");
    process.exit(0);
  } else {
    log.warn(`${fails.length} check(s) failed`, { fails: fails.map((f) => f.name) });
    process.exit(QUICK ? 0 : 4);
  }
}

main().catch((err) => {
  log.error("doctor failed", { error: String(err && err.message || err) });
  process.exit(1);
});
