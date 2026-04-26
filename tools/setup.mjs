// tools/setup.mjs
// Idempotent self-bootstrap entry point.
// Safe to re-run. Never installs Node, never elevates, never modifies system.

import { spawnSync } from "node:child_process";
import { PATHS } from "./_lib/paths.mjs";
import { log } from "./_lib/log.mjs";
import { exists, ensureDir, writeJson, readJson } from "./_lib/fsx.mjs";

const STATE_VERSION = 1;

async function checkNode() {
  const v = process.versions.node;
  const [maj, min] = v.split(".").map((n) => parseInt(n, 10));
  if (maj < 18 || (maj === 18 && min < 17)) {
    log.error(`Node ${v} too old. Need >= 18.17. Stop.`, { node: v });
    process.exit(2);
  }
  log.ok(`Node ${v} OK`);
  return v;
}

async function ensureDeps() {
  const nm = await exists(PATHS.nodeModules);
  if (nm) {
    log.ok("node_modules present");
    return "ok";
  }
  log.info("Installing dependencies (npm install)...");
  const res = spawnSync("npm", ["install", "--no-fund", "--no-audit"], {
    cwd: PATHS.root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (res.status !== 0) {
    log.warn("npm install failed; retrying with --omit=optional");
    const res2 = spawnSync(
      "npm",
      ["install", "--no-fund", "--no-audit", "--omit=optional"],
      { cwd: PATHS.root, stdio: "inherit", shell: process.platform === "win32" },
    );
    if (res2.status !== 0) {
      log.error("npm install failed. See .agent/doctor.md", { code: res2.status });
      process.exit(3);
    }
    return "ok-no-optional";
  }
  return "ok";
}

async function ensureWorkspace() {
  await ensureDir(PATHS.workspace);
  await ensureDir(PATHS.agentState);
  await ensureDir(PATHS.vanillaIndexCache);
  log.ok("workspace + state dirs ready");
}

async function maybeBuildVanillaIndex() {
  const screensExists = await exists(PATHS.vanillaIndexScreens);
  if (screensExists) {
    log.ok("vanilla-index already built");
    return "ok";
  }
  const ztech = await exists(PATHS.ztechMirror);
  const samples = await exists(PATHS.bedrockSamplesUi);
  if (!ztech && !samples) {
    log.warn(
      "No upstream vanilla source found. Skipping vanilla-index. " +
        "Run scripts/sync-ztech-vanilla.ps1 then re-run setup.",
    );
    return "missing-source";
  }
  log.info("Building vanilla-index (this may take a moment)...");
  const res = spawnSync(
    process.execPath,
    ["tools/build-vanilla-index.mjs"],
    { cwd: PATHS.root, stdio: "inherit" },
  );
  if (res.status !== 0) {
    log.warn("vanilla-index build failed; tools layer still works without it");
    return "failed";
  }
  return "ok";
}

async function writeState(node, deps, vanillaIndex) {
  const state = {
    version: STATE_VERSION,
    checkedAt: new Date().toISOString(),
    node,
    deps,
    vanillaIndex,
    warnings: [],
  };
  if (deps === "ok-no-optional") {
    state.warnings.push("optional native deps missing; render/diff tools unavailable");
  }
  if (vanillaIndex !== "ok") {
    state.warnings.push("vanilla-index unavailable; lookups will be limited");
  }
  await writeJson(PATHS.setupState, state);
  log.ok(".agent/state/setup-state.json written");
  return state;
}

async function main() {
  log.info("mcbe-jsonui-ai-kit: setup start");
  const node = await checkNode();
  const deps = await ensureDeps();
  await ensureWorkspace();
  const vanillaIndex = await maybeBuildVanillaIndex();
  const state = await writeState(node, deps, vanillaIndex);
  log.ok("setup complete", { warnings: state.warnings.length });
}

main().catch((err) => {
  log.error("setup failed", { error: String(err && err.message || err) });
  process.exit(1);
});
