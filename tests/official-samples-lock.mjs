// Verifies that the committed official sample mirror matches its pinned lock,
// that the lock describes a real upstream revision, and that the vanilla
// screen profile derived from it stays in step. Runs fully offline.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { LOCK_SCHEMA, SELECTED_FILES, readLock, checkCommittedFiles, sha256, computeProfileUpdate } from "../tools/sync-bedrock-samples-ui.mjs";
import { JSON_DIALECTS, DEFAULT_RUNTIME_DIALECT, DEFAULT_VANILLA_PROFILE } from "../tools/_lib/json-dialect.mjs";
import { mkdtemp, mkdir, rm, writeFile, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { randomUUID } from "node:crypto";

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
{
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validateLock = ajv.compile(JSON.parse(await readFile(resolve(ROOT, "schemas", "bedrock-samples-ui-lock.schema.json"), "utf8")));
  assert.equal(validateLock(lock), true, JSON.stringify(validateLock.errors));
}
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
assert.ok(Array.isArray(profile.removedScreens) && profile.removedScreens.length > 0, "profile must list screens removed since the previous pin");
for (const removed of profile.removedScreens) {
  assert.ok(!profile.overrideFiles.includes(removed.path), `${removed.path} cannot be both removed and current`);
  assert.match(removed.lastSeen, /^v\d+\.\d+\.\d+\.\d+$/);
}
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
// An unpacked source folder inside this repository must not borrow its parent's HEAD.
const unpacked = resolve(process.env.MCBEKIT_REPO_TEST_ROOT || resolve(ROOT,"workspace"), `unpacked-sample-${randomUUID()}`);
await mkdir(resolve(unpacked,"resource_pack/ui"),{recursive:true});
const unpackedCheck = await run(["tools/sync-bedrock-samples-ui.mjs","--diff","--mirror",unpacked,"--json"]);
assert.equal(unpackedCheck.code,2,unpackedCheck.stderr||unpackedCheck.stdout);
assert.equal(JSON.parse(unpackedCheck.stdout.trim()).blocking[0].code,"MIRROR_UNAVAILABLE");
// Profile regeneration is pure and must reproduce the committed profile from the lock + _ui_defs.
{
  const reproduced = computeProfileUpdate(profiles, { lock, oldDefs: [...defs, ...profile.removedScreens.map((entry) => entry.path)], newDefs: defs });
  assert.equal(reproduced.ok, true, reproduced.reason);
  assert.equal(reproduced.profileId, DEFAULT_VANILLA_PROFILE);
  assert.deepEqual(reproduced.warnings, []);
  assert.deepEqual(reproduced.profile.overrideFiles, profile.overrideFiles);
  assert.deepEqual(reproduced.profile.removedScreens.map((entry) => entry.path), profile.removedScreens.map((entry) => entry.path));
  assert.equal(reproduced.profile.dialect, profile.dialect);
  const future = computeProfileUpdate(profiles, { lock: { ...lock, upstream: { ...lock.upstream, version: { version: "1.27.0.3" }, tag: "v1.27.0.3" }, previous: { commit: lock.upstream.commit, tag: lock.upstream.tag } }, oldDefs: defs, newDefs: defs.filter((entry) => entry !== "ui/hud_screen.json") });
  assert.equal(future.profileId, "bedrock-1.27.0");
  assert.equal(future.profile.dialect, DEFAULT_RUNTIME_DIALECT, "an unverified dialect falls back to the default and warns");
  assert.equal(future.warnings.length, 2);
  assert.deepEqual(future.profile.removedScreens.map((entry) => [entry.path, entry.lastSeen]), [["ui/hud_screen.json", "v1.26.50.4"]]);
  assert.equal(computeProfileUpdate(profiles, { lock: { upstream: { version: null } }, oldDefs: [], newDefs: [] }).ok, false);
}

// --diff must report planted upstream changes against a fake mirror (needs git).
if (spawnSync("git", ["--version"], { encoding: "utf8" }).status === 0) {
  const fake = await mkdtemp(resolve(tmpdir(), "mcbe-samples-fake-mirror-"));
  try {
    const ui = resolve(fake, "resource_pack", "ui");
    await mkdir(ui, { recursive: true });
    for (const name of SELECTED_FILES) await cp(resolve(SAMPLES, name), resolve(ui, name));
    const defs = JSON.parse((await readFile(resolve(ui, "_ui_defs.json"), "utf8")).replace(/\/\/[^\n]*/g, ""));
    defs.ui_defs = [...defs.ui_defs.filter((entry) => entry !== "ui/hud_screen.json"), "ui/planted_screen.json"];
    await writeFile(resolve(ui, "_ui_defs.json"), JSON.stringify(defs, null, 2));
    const chestSource = await readFile(resolve(ui, "chest_screen.json"), "utf8");
    const brace = chestSource.indexOf("{"); // vanilla files open with a /* banner */ comment before the root object
    await writeFile(resolve(ui, "chest_screen.json"), `${chestSource.slice(0, brace + 1)}\n  "planted_control": { "type": "panel", "bindings": [{ "binding_name": "#planted_binding" }] },${chestSource.slice(brace + 1)}`);
    await writeFile(resolve(fake, "version.json"), JSON.stringify({ latest: { version: "9.9.9.9", date: "01-01-2099" } }));
    const g = (...a) => spawnSync("git", ["-C", fake, ...a], { encoding: "utf8" });
    g("init", "-q", "."); g("-c", "user.name=t", "-c", "user.email=t@t", "add", "-A"); g("-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "planted");
    const diff = await run(["tools/sync-bedrock-samples-ui.mjs", "--diff", "--mirror", fake, "--json"]);
    assert.equal(diff.code, 0, diff.stderr || diff.stdout);
    const diffResult = JSON.parse(diff.stdout.trim());
    assert.equal(diffResult.summary.mode, "diff");
    assert.equal(diffResult.summary.changedFiles, 2);
    const defsEntry = diffResult.summary.diff.find((file) => file.path === "_ui_defs.json");
    assert.deepEqual(defsEntry.screens, { added: ["ui/planted_screen.json"], removed: ["ui/hud_screen.json"] });
    const chestEntry = diffResult.summary.diff.find((file) => file.path === "chest_screen.json");
    assert.deepEqual(chestEntry.topLevelControls.added, ["planted_control"]);
    assert.deepEqual(chestEntry.bindings.added, ["#planted_binding"]);
    assert.ok(diffResult.summary.diff.find((file) => file.path === "hud_screen.json").identical === true);
    // sync mode must refuse a mirror that is not at the requested ref instead of overwriting the samples
    const wrongRef = await run(["tools/sync-bedrock-samples-ui.mjs", "--mirror", fake, "--ref", "main", "--json"]);
    assert.equal(wrongRef.code, 2);
    assert.equal(JSON.parse(wrongRef.stdout.trim()).blocking[0].code, "MIRROR_REF_MISMATCH");
    assert.deepEqual(await checkCommittedFiles(lock), [], "a refused sync must leave the committed files untouched");
  } finally { await rm(fake, { recursive: true, force: true }); }
}

// The pinned files must pass the pack validator's structural rules (namespace
// handling for _global_variables.json, spec-driven property checks).
const packReport = resolve(process.env.MCBEKIT_TEST_ROOT || "workspace", "official-samples-pack-report.json");
const pack = await run(["tools/validate-pack.mjs", "references/official/bedrock-samples-ui", "--allow-partial-ui-defs", "--allow-missing-textures", "--report", packReport]);
assert.equal(pack.code, 0, pack.stderr || pack.stdout);
const packResult = JSON.parse(await readFile(packReport, "utf8"));
assert.equal(packResult.ok, true);
assert.deepEqual(packResult.errors, []);
console.log(`official samples lock OK (${lock.upstream.tag} ${lock.upstream.commit.slice(0, 12)}, ${lock.files.length} files)`);
