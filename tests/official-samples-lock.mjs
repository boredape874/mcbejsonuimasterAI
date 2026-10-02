// Verifies that the committed official sample mirror matches its pinned lock,
// that the lock describes a real upstream revision, and that the vanilla
// screen profile derived from it stays in step. Runs fully offline.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { LOCK_SCHEMA, SELECTED_FILES, readLock, checkCommittedFiles, sha256 } from "../tools/sync-bedrock-samples-ui.mjs";
import { JSON_DIALECTS, DEFAULT_RUNTIME_DIALECT, DEFAULT_VANILLA_PROFILE } from "../tools/_lib/json-dialect.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SAMPLES = resolve(ROOT, "references", "official", "bedrock-samples-ui");
function run(args) {
  return new Promise((done) => {
    const child = spawn(process.execPath, args, { cwd: ROOT });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => done({ code, stdout, stderr }));
  });
}

const lock = await readLock();
assert.ok(lock, "references/official/bedrock-samples-ui.lock.json must exist");
assert.equal(lock.schema, LOCK_SCHEMA);
assert.equal(lock.upstream.url, "https://github.com/Mojang/bedrock-samples");
assert.match(lock.upstream.commit, /^[0-9a-f]{40}$/, "lock must pin a full upstream commit");
assert.match(lock.upstream.tag ?? "", /^v\d+\.\d+\.\d+\.\d+$/, "lock must pin a stable upstream tag, not a preview");
assert.match(lock.upstream.version?.version ?? "", /^\d+\.\d+\.\d+\.\d+$/);
assert.ok(Array.isArray(lock.upstream.minEngineVersion) && lock.upstream.minEngineVersion.length === 3);
assert.deepEqual(lock.files.map((entry) => entry.path), [...SELECTED_FILES], "lock file list must equal the selected file list");
for (const entry of lock.files) {
  assert.equal(entry.upstreamPath, `resource_pack/ui/${entry.path}`);
  const bytes = await readFile(resolve(SAMPLES, entry.path));
  assert.equal(sha256(bytes), entry.sha256, `${entry.path} differs from the lock; rerun node tools/sync-bedrock-samples-ui.mjs`);
  assert.equal(bytes.length, entry.bytes, `${entry.path} size differs from the lock`);
}
assert.deepEqual(await checkCommittedFiles(lock), []);

// The pinned _ui_defs.json is the evidence for the default vanilla screen profile.
const profiles = JSON.parse(await readFile(resolve(ROOT, "data", "vanilla-screen-profiles.json"), "utf8"));
const profile = profiles.profiles[DEFAULT_VANILLA_PROFILE];
assert.ok(profile, `default vanilla profile ${DEFAULT_VANILLA_PROFILE} must exist`);
assert.equal(profile.dialect, DEFAULT_RUNTIME_DIALECT);
assert.equal(JSON_DIALECTS[profile.dialect]?.verified, true);
assert.equal(profile.evidence.commit, lock.upstream.commit, "profile evidence commit must match the lock");
assert.equal(profile.evidence.tag, lock.upstream.tag);
const defsSource = (await readFile(resolve(SAMPLES, "_ui_defs.json"), "utf8")).replace(/\/\/[^\n]*/g, "");
const defs = JSON.parse(defsSource).ui_defs;
assert.deepEqual(profile.overrideFiles, defs, "profile overrideFiles must equal the pinned vanilla ui_defs entries");
for (const name of ["ui/hud_screen.json", "ui/server_form.json", "ui/npc_interact_screen.json", "ui/inventory_screen_pocket.json"]) {
  assert.ok(profile.overrideFiles.includes(name), `${name} must be a known vanilla override`);
}

// Offline check mode must agree with the assertions above and must not write.
const before = await readFile(resolve(ROOT, "references", "official", "bedrock-samples-ui.lock.json"), "utf8");
const check = await run(["tools/sync-bedrock-samples-ui.mjs", "--check", "--json"]);
assert.equal(check.code, 0, check.stderr || check.stdout);
const envelope = JSON.parse(check.stdout.trim());
assert.equal(envelope.ok, true);
assert.equal(envelope.summary.mode, "check");
assert.equal(envelope.summary.lockCommit, lock.upstream.commit);
assert.equal(await readFile(resolve(ROOT, "references", "official", "bedrock-samples-ui.lock.json"), "utf8"), before, "--check must not rewrite the lock");
const help = await run(["tools/sync-bedrock-samples-ui.mjs", "--help"]);
assert.equal(help.code, 0);
assert.match(help.stdout, /Usage:/);
const usage = await run(["tools/sync-bedrock-samples-ui.mjs", "--bogus"]);
assert.equal(usage.code, 64);
const missing = await run(["tools/sync-bedrock-samples-ui.mjs", "--mirror", "workspace/does-not-exist-mirror", "--json"]);
assert.equal(missing.code, 2, "sync without a mirror must fail closed instead of downloading");
assert.equal(JSON.parse(missing.stdout.trim()).blocking[0].code, "MIRROR_UNAVAILABLE");
// The pinned files must pass the pack validator's structural rules (namespace
// handling for _global_variables.json, spec-driven property checks).
const packReport = resolve(process.env.MCBEKIT_TEST_ROOT || "workspace", "official-samples-pack-report.json");
const pack = await run(["tools/validate-pack.mjs", "references/official/bedrock-samples-ui", "--allow-partial-ui-defs", "--allow-missing-textures", "--report", packReport]);
assert.equal(pack.code, 0, pack.stderr || pack.stdout);
const packResult = JSON.parse(await readFile(packReport, "utf8"));
assert.equal(packResult.ok, true);
assert.deepEqual(packResult.errors, []);
console.log(`official samples lock OK (${lock.upstream.tag} ${lock.upstream.commit.slice(0, 12)}, ${lock.files.length} files)`);
