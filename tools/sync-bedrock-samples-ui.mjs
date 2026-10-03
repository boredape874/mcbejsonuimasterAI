// tools/sync-bedrock-samples-ui.mjs
// Copy the selected official Mojang `bedrock-samples` UI files from a local
// sparse mirror into references/official/bedrock-samples-ui and record the
// pinned upstream revision in references/official/bedrock-samples-ui.lock.json.
//
// Usage:
//   node tools/sync-bedrock-samples-ui.mjs [--mirror <path>] [--ref <name>] [--report <path>] [--json]
//   node tools/sync-bedrock-samples-ui.mjs --check [--mirror <path>] [--json]
//   node tools/sync-bedrock-samples-ui.mjs --diff [--mirror <path>] [--report <path>] [--json]
//
//   --mirror <path>  Local clone of https://github.com/Mojang/bedrock-samples
//                    (default: references/upstreams/bedrock-samples). The tool never
//                    clones or fetches; scripts/sync-bedrock-samples-ui.ps1 does that.
//   --ref <name>     Upstream ref the mirror is expected to have checked out
//                    (default: main). Recorded in the lock; mismatches fail.
//   --check          Compare the committed files against the lock (offline) and,
//                    when the mirror exists, against the mirror. Writes nothing.
//   --diff           Summarize what the mirror changes relative to the committed
//                    files: per-file line delta, top-level controls, bindings,
//                    button ids, $variables, and _ui_defs screens added/removed.
//                    Writes nothing except an optional --report. Use it to draft
//                    the next docs/83-style change log before syncing.
//   --no-profile     Sync mode only: do not update data/vanilla-screen-profiles.json.
//                    By default the profile named after the synced version gets its
//                    overrideFiles from the new _ui_defs.json and its removedScreens
//                    from the entries the previously committed _ui_defs.json had.
//   --report <path>  Write the JSON result to <path>.
//   --json           Print the result envelope as JSON on stdout.
//
// Exit codes: 0 ok, 2 mirror missing or not usable, 9 drift or hash mismatch, 64 usage.

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFile, copyFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { PATHS } from "./_lib/paths.mjs";
import { collectNames, parseVanillaFile } from "./_lib/vanilla-names.mjs";
import { JSON_DIALECTS, DEFAULT_RUNTIME_DIALECT, DEFAULT_VANILLA_PROFILE } from "./_lib/json-dialect.mjs";

export const PROFILES_PATH = resolve(PATHS.root, "data", "vanilla-screen-profiles.json");
import { exists, ensureDir, readJson, writeJsonAtomic } from "./_lib/fsx.mjs";
import { log } from "./_lib/log.mjs";
import { createResultEnvelope, printResultJson } from "./_lib/result-envelope.mjs";

export const LOCK_SCHEMA = "mcbe-jsonui-ai-kit/bedrock-samples-ui-lock@1";
export const UPSTREAM_URL = "https://github.com/Mojang/bedrock-samples";
export const DEFAULT_MIRROR = resolve(PATHS.root, "references", "upstreams", "bedrock-samples");
export const LOCK_PATH = resolve(PATHS.root, "references", "official", "bedrock-samples-ui.lock.json");
// Keep this list identical to the documented "high-risk files to diff" in
// docs/21-update-policy.md plus the container screens used as recipes.
export const SELECTED_FILES = Object.freeze([
  "_ui_defs.json",
  "_global_variables.json",
  "hud_screen.json",
  "chat_screen.json",
  "server_form.json",
  "inventory_screen.json",
  "inventory_screen_pocket.json",
  "ui_common.json",
  "chest_screen.json",
  "furnace_screen.json",
  "trade_2_screen.json",
  "command_block_screen.json",
  // Templates behind the preset catalog (common_dialogs.*, common_buttons.*)
  // and the NPC dialogue screen cited by the NPC/GeoUI skills.
  "ui_template_dialogs.json",
  "ui_template_buttons.json",
  "npc_interact_screen.json",
]);

function usage() {
  process.stdout.write([
    "Usage: node tools/sync-bedrock-samples-ui.mjs [--mirror <path>] [--ref <name>] [--report <path>] [--json]",
    "       node tools/sync-bedrock-samples-ui.mjs --check [--mirror <path>] [--json]",
    "       node tools/sync-bedrock-samples-ui.mjs --diff [--mirror <path>] [--report <path>] [--json]",
    "       node tools/sync-bedrock-samples-ui.mjs --no-profile   (sync without touching data/vanilla-screen-profiles.json)",
    "",
    "Copies the selected official bedrock-samples UI files from a local sparse mirror",
    "into references/official/bedrock-samples-ui and pins the upstream revision in",
    "references/official/bedrock-samples-ui.lock.json. --check verifies without writing.",
    "The tool never clones or fetches; run scripts/sync-bedrock-samples-ui.ps1 or",
    "git clone --depth 1 --filter=blob:none --sparse to create the mirror first.",
    "",
  ].join("\n"));
}

function parseArgs(argv) {
  const options = { mirror: DEFAULT_MIRROR, ref: "main", check: false, diff: false, profile: true, json: false, report: null, help: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    const value = () => { const next = argv[++index]; if (next === undefined || next.startsWith("--")) throw new Error(`${arg} requires a value`); return next; };
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--diff") options.diff = true;
    else if (arg === "--no-profile") options.profile = false;
    else if (arg === "--json") options.json = true;
    else if (arg === "--mirror") options.mirror = resolve(PATHS.root, value());
    else if (arg.startsWith("--mirror=")) options.mirror = resolve(PATHS.root, arg.slice("--mirror=".length));
    else if (arg === "--ref") options.ref = value();
    else if (arg.startsWith("--ref=")) options.ref = arg.slice("--ref=".length);
    else if (arg === "--report") options.report = resolve(PATHS.root, value());
    else if (arg.startsWith("--report=")) options.report = resolve(PATHS.root, arg.slice("--report=".length));
    else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function git(mirror, args) {
  const result = spawnSync("git", ["-C", mirror, ...args], { encoding: "utf8", windowsHide: true });
  return result.status === 0 ? result.stdout.trim() : null;
}

function portable(path) {
  return path.split(sep).join("/");
}

async function hashFile(path) {
  const bytes = await readFile(path);
  return { sha256: sha256(bytes), bytes: bytes.length };
}

async function describeMirror(mirror, ref) {
  const uiRoot = join(mirror, "resource_pack", "ui");
  if (!(await exists(uiRoot))) return { ok: false, reason: `mirror has no resource_pack/ui: ${portable(relative(PATHS.root, mirror))}` };
  const commit = git(mirror, ["rev-parse", "HEAD"]);
  if (!commit) return { ok: false, reason: "mirror is not a git checkout; the lock needs a verifiable commit" };
  const remote = git(mirror, ["config", "--get", "remote.origin.url"]) || null;
  const branch = git(mirror, ["rev-parse", "--abbrev-ref", "HEAD"]);
  const tag = git(mirror, ["describe", "--tags", "--exact-match", "HEAD"]);
  const commitDate = git(mirror, ["log", "-1", "--format=%cI", "HEAD"]);
  let version = null;
  try { version = (await readJson(join(mirror, "version.json")))?.latest ?? null; } catch {}
  let minEngineVersion = null;
  try { minEngineVersion = (await readJson(join(mirror, "resource_pack", "manifest.json")))?.header?.min_engine_version ?? null; } catch {}
  // Accept the ref when HEAD is that branch/tag, or when the ref resolves to the
  // same commit locally (origin/<ref>, refs/tags/<ref>, or an abbreviated sha).
  const resolved = [ref, `origin/${ref}`, `refs/tags/${ref}`]
    .map((candidate) => git(mirror, ["rev-parse", "--verify", "--quiet", `${candidate}^{commit}`]))
    .find(Boolean);
  const refMatches = branch === ref || tag === ref || commit === ref || (/^[0-9a-f]{7,40}$/i.test(ref) && commit.startsWith(ref.toLowerCase())) || resolved === commit;
  return { ok: true, uiRoot, upstream: { url: remote && /Mojang\/bedrock-samples/i.test(remote) ? UPSTREAM_URL : remote, ref, branch: branch === "HEAD" ? null : branch, tag, commit, commitDate, version, minEngineVersion }, refMatches };
}

export async function readLock(lockPath = LOCK_PATH) {
  if (!(await exists(lockPath))) return null;
  const lock = await readJson(lockPath);
  if (lock?.schema !== LOCK_SCHEMA) throw new Error(`unexpected lock schema: ${lock?.schema}`);
  return lock;
}

export async function checkCommittedFiles(lock, outputDir = PATHS.bedrockSamplesUi) {
  const findings = [];
  const lockFiles = new Map((lock?.files || []).map((entry) => [entry.path, entry]));
  for (const name of SELECTED_FILES) {
    const target = join(outputDir, name);
    const entry = lockFiles.get(name);
    if (!entry) { findings.push({ code: "LOCK_FILE_MISSING", path: name, message: "selected file is not recorded in the lock" }); continue; }
    if (!(await exists(target))) { findings.push({ code: "COMMITTED_FILE_MISSING", path: name, message: "committed sample file is missing" }); continue; }
    const actual = await hashFile(target);
    if (actual.sha256 !== entry.sha256) findings.push({ code: "COMMITTED_HASH_MISMATCH", path: name, message: `sha256 ${actual.sha256} differs from lock ${entry.sha256}` });
  }
  for (const path of lockFiles.keys()) {
    if (!SELECTED_FILES.includes(path)) findings.push({ code: "LOCK_FILE_UNEXPECTED", path, message: "lock records a file outside the selected list" });
  }
  return findings;
}

async function compareWithMirror(lock, mirrorInfo) {
  const findings = [];
  for (const name of SELECTED_FILES) {
    const source = join(mirrorInfo.uiRoot, name);
    if (!(await exists(source))) { findings.push({ code: "MIRROR_FILE_MISSING", path: name, message: "mirror does not contain the selected file" }); continue; }
    const actual = await hashFile(source);
    const entry = (lock?.files || []).find((item) => item.path === name);
    if (entry && entry.sha256 !== actual.sha256) findings.push({ code: "MIRROR_DRIFT", path: name, message: `mirror ${mirrorInfo.upstream.commit.slice(0, 12)} differs from lock ${lock.upstream?.commit?.slice(0, 12) ?? "?"}` });
  }
  return findings;
}

// ---- diff mode -------------------------------------------------------------

function setDelta(before, after) {
  return { added: [...after].filter((item) => !before.has(item)).sort(), removed: [...before].filter((item) => !after.has(item)).sort() };
}

export async function diffAgainstMirror(mirrorInfo, outputDir = PATHS.bedrockSamplesUi) {
  const files = [];
  for (const name of SELECTED_FILES) {
    const committedPath = join(outputDir, name);
    const mirrorPath = join(mirrorInfo.uiRoot, name);
    const entry = { path: name, committed: await exists(committedPath), mirror: await exists(mirrorPath) };
    if (!entry.committed || !entry.mirror) { files.push(entry); continue; }
    const [before, after] = await Promise.all([parseVanillaFile(committedPath), parseVanillaFile(mirrorPath)]);
    before.names = collectNames(before.text, before.document, name);
    after.names = collectNames(after.text, after.document, name);
    entry.identical = before.text === after.text;
    entry.lines = { committed: before.lines, mirror: after.lines };
    if (!entry.identical) {
      entry.topLevelControls = setDelta(before.names.topLevel, after.names.topLevel);
      entry.bindings = setDelta(before.names.bindings, after.names.bindings);
      entry.buttonIds = setDelta(before.names.buttonIds, after.names.buttonIds);
      entry.variables = setDelta(before.names.variables, after.names.variables);
      if (name === "_ui_defs.json") entry.screens = setDelta(before.names.screens, after.names.screens);
    }
    files.push(entry);
  }
  return { changed: files.filter((file) => file.identical === false).length, files };
}

// Pure: derive the vanilla screen profile entry for a synced revision.
// - overrideFiles: every ui_defs entry of the new revision (any of them may be
//   overridden by a pack without custom registration).
// - removedScreens: entries the previously committed revision registered that
//   the new one does not, plus earlier removals that are still absent.
export function computeProfileUpdate(profiles, { lock, oldDefs, newDefs }) {
  const version = lock?.upstream?.version?.version || "";
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!match) return { ok: false, reason: `lock has no parseable upstream version (${version || "none"})` };
  const shortVersion = `${match[1]}.${match[2]}.${match[3]}`;
  const profileId = `bedrock-${shortVersion}`;
  const preferredDialect = `bedrock-json@${shortVersion}`;
  const dialect = JSON_DIALECTS[preferredDialect]?.verified ? preferredDialect : DEFAULT_RUNTIME_DIALECT;
  const warnings = [];
  if (dialect !== preferredDialect) warnings.push(`dialect ${preferredDialect} is not registered in tools/_lib/json-dialect.mjs; profile ${profileId} uses ${dialect} until the new dialect is verified in code`);
  if (profileId !== DEFAULT_VANILLA_PROFILE) warnings.push(`profile ${profileId} is not the default (${DEFAULT_VANILLA_PROFILE}); bump DEFAULT_VANILLA_PROFILE/DEFAULT_RUNTIME_DIALECT in tools/_lib/json-dialect.mjs to make validate-pack use it`);
  const existing = profiles?.profiles?.[profileId] || null;
  const newSet = new Set(newDefs);
  const previousTag = lock?.previous?.tag || (lock?.previous?.commit ? lock.previous.commit.slice(0, 12) : null) || "earlier pin";
  const removed = new Map();
  for (const entry of existing?.removedScreens || []) if (!newSet.has(entry.path)) removed.set(entry.path, entry);
  for (const path of oldDefs || []) if (!newSet.has(path) && !removed.has(path)) removed.set(path, { path, lastSeen: previousTag, note: "registered by the previous pinned revision but absent from the current _ui_defs.json; a pack file with this name is never loaded unless the pack registers it" });
  const profile = {
    dialect,
    evidence: {
      source: "references/official/bedrock-samples-ui/_ui_defs.json",
      lock: "references/official/bedrock-samples-ui.lock.json",
      upstream: lock.upstream.url,
      tag: lock.upstream.tag ?? null,
      commit: lock.upstream.commit,
      note: "overrideFiles are exactly the vanilla ui_defs entries of the pinned sample; any of them can be overridden by a pack without custom _ui_defs registration. Runtime behavior is not verified by this list.",
    },
    overrideFiles: [...newDefs],
    removedScreens: [...removed.values()].sort((a, b) => a.path.localeCompare(b.path)),
  };
  return { ok: true, profileId, profile, warnings, removedCount: profile.removedScreens.length };
}

async function readDefs(path) {
  if (!(await exists(path))) return null;
  const { document } = await parseVanillaFile(path);
  return Array.isArray(document?.ui_defs) ? document.ui_defs.filter((entry) => typeof entry === "string") : null;
}

async function syncFromMirror(mirrorInfo, options = {}) {
  await ensureDir(PATHS.bedrockSamplesUi);
  const oldDefs = await readDefs(join(PATHS.bedrockSamplesUi, "_ui_defs.json")).catch(() => null);
  const files = [];
  for (const name of SELECTED_FILES) {
    const source = join(mirrorInfo.uiRoot, name);
    if (!(await exists(source))) throw new Error(`mirror is missing resource_pack/ui/${name}`);
    await copyFile(source, join(PATHS.bedrockSamplesUi, name));
    const info = await hashFile(join(PATHS.bedrockSamplesUi, name));
    files.push({ path: name, upstreamPath: `resource_pack/ui/${name}`, ...info });
  }
  // Re-syncing the same revision keeps the earlier "previous" entry so the
  // lock always names the last different upstream revision.
  const existing = await readLock().catch(() => null);
  const sameRevision = existing?.upstream?.commit === mirrorInfo.upstream.commit;
  const previous = sameRevision ? existing?.previous ?? null
    : existing?.upstream ? { commit: existing.upstream.commit, tag: existing.upstream.tag ?? null, version: existing.upstream.version ?? null, syncedAt: existing.syncedAt ?? null } : null;
  const lock = {
    schema: LOCK_SCHEMA,
    purpose: "Pinned upstream revision of the selected official bedrock-samples UI files committed under references/official/bedrock-samples-ui. Regenerate with node tools/sync-bedrock-samples-ui.mjs; verify with --check.",
    syncedAt: new Date().toISOString(),
    upstream: mirrorInfo.upstream,
    previous,
    outputDir: portable(relative(PATHS.root, PATHS.bedrockSamplesUi)),
    files,
  };
  await writeJsonAtomic(LOCK_PATH, lock);
  if (options.profile !== false) {
    const newDefs = await readDefs(join(PATHS.bedrockSamplesUi, "_ui_defs.json")).catch(() => null);
    if (newDefs && await exists(PROFILES_PATH)) {
      const profiles = await readJson(PROFILES_PATH);
      const update = computeProfileUpdate(profiles, { lock, oldDefs: oldDefs || [], newDefs });
      if (update.ok) {
        profiles.profiles[update.profileId] = update.profile;
        await writeJsonAtomic(PROFILES_PATH, profiles);
        lock.profileUpdate = { profileId: update.profileId, removedScreens: update.removedCount, warnings: update.warnings };
        for (const warning of update.warnings) log.warn(warning);
      } else {
        log.warn(`vanilla screen profile not updated: ${update.reason}`);
      }
    }
  }
  return lock;
}

async function main() {
  let options;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) { log.error(String(error.message || error)); usage(); process.exit(64); }
  if (options.help) { usage(); return; }

  const findings = [];
  const summary = { mode: options.check ? "check" : "sync", mirror: portable(relative(PATHS.root, options.mirror)), lock: portable(relative(PATHS.root, LOCK_PATH)), files: SELECTED_FILES.length };
  let exitCode = 0;
  let lock = null;
  try { lock = await readLock(); } catch (error) { findings.push({ code: "LOCK_INVALID", path: summary.lock, message: String(error.message || error) }); }
  const mirrorInfo = (await exists(options.mirror)) ? await describeMirror(options.mirror, options.ref) : { ok: false, reason: `mirror not found: ${summary.mirror}` };

  if (options.diff) {
    summary.mode = "diff";
    if (!mirrorInfo.ok) {
      findings.push({ code: "MIRROR_UNAVAILABLE", path: summary.mirror, message: mirrorInfo.reason });
      exitCode = 2;
    } else {
      const diff = await diffAgainstMirror(mirrorInfo);
      summary.mirrorCommit = mirrorInfo.upstream.commit;
      summary.mirrorTag = mirrorInfo.upstream.tag;
      summary.lockCommit = lock?.upstream?.commit ?? null;
      summary.lockTag = lock?.upstream?.tag ?? null;
      summary.changedFiles = diff.changed;
      summary.diff = diff.files;
    }
  } else if (options.check) {
    if (!lock) findings.push({ code: "LOCK_MISSING", path: summary.lock, message: "run the tool without --check to create the lock" });
    else findings.push(...await checkCommittedFiles(lock));
    summary.mirrorAvailable = mirrorInfo.ok;
    if (mirrorInfo.ok) {
      summary.mirrorCommit = mirrorInfo.upstream.commit;
      summary.mirrorTag = mirrorInfo.upstream.tag;
      if (lock) findings.push(...await compareWithMirror(lock, mirrorInfo));
    } else {
      summary.mirrorReason = mirrorInfo.reason;
    }
    if (lock) { summary.lockCommit = lock.upstream?.commit ?? null; summary.lockTag = lock.upstream?.tag ?? null; summary.lockVersion = lock.upstream?.version ?? null; }
    exitCode = findings.length ? 9 : 0;
  } else {
    if (!mirrorInfo.ok) {
      findings.push({ code: "MIRROR_UNAVAILABLE", path: summary.mirror, message: mirrorInfo.reason });
      exitCode = 2;
    } else if (!mirrorInfo.refMatches) {
      findings.push({ code: "MIRROR_REF_MISMATCH", path: summary.mirror, message: `mirror is at ${mirrorInfo.upstream.branch || mirrorInfo.upstream.tag || "detached HEAD"} (${mirrorInfo.upstream.commit.slice(0, 12)}), expected --ref ${options.ref}` });
      exitCode = 2;
    } else {
      lock = await syncFromMirror(mirrorInfo, options);
      if (lock.profileUpdate) { summary.profile = lock.profileUpdate; delete lock.profileUpdate; }
      if (!lock.upstream.tag) log.warn("no upstream tag points at the mirror HEAD; fetch the matching stable tag so the lock records a release version", { commit: lock.upstream.commit });
      summary.lockCommit = lock.upstream.commit;
      summary.lockTag = lock.upstream.tag;
      summary.lockVersion = lock.upstream.version;
      summary.previousCommit = lock.previous?.commit ?? null;
    }
  }

  const result = createResultEnvelope({
    ok: exitCode === 0,
    evidenceLevel: "static",
    blocking: findings,
    exitCodeReason: exitCode === 0 ? "SUCCESS" : exitCode === 2 ? "MIRROR_UNAVAILABLE" : "SAMPLES_DRIFT",
    artifacts: options.check || options.diff ? [] : [summary.lock],
    summary,
  });
  if (options.report) await writeJsonAtomic(options.report, result);
  if (options.json) printResultJson(result);
  else if (options.diff && exitCode === 0) {
    const { diff, ...rest } = summary;
    log.ok(`${rest.changedFiles} of ${SELECTED_FILES.length} selected files differ from the mirror`, rest);
    for (const file of diff) {
      if (file.identical !== false) { log.info(`${file.path}: ${file.identical ? "identical" : "missing on one side"}`); continue; }
      const parts = [];
      for (const key of ["topLevelControls", "bindings", "buttonIds", "variables", "screens"]) {
        if (file[key] && (file[key].added.length || file[key].removed.length)) parts.push(`${key} +${file[key].added.length}/-${file[key].removed.length}`);
      }
      log.warn(`${file.path}: lines ${file.lines.committed} -> ${file.lines.mirror}${parts.length ? " | " + parts.join(", ") : ""}`);
      for (const key of ["topLevelControls", "screens"]) {
        if (file[key]?.added.length) log.info(`  + ${key}: ${file[key].added.join(", ")}`);
        if (file[key]?.removed.length) log.info(`  - ${key}: ${file[key].removed.join(", ")}`);
      }
    }
  } else {
    for (const finding of findings) log.error(finding.message, { code: finding.code, path: finding.path });
    if (exitCode === 0) log.ok(options.check ? "official samples match the lock" : "official samples synced", summary);
    else log.error(options.check ? "official samples drift" : options.diff ? "official samples diff failed" : "official samples sync failed", { findings: findings.length });
  }
  process.exit(exitCode);
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    log.error("sync-bedrock-samples-ui crashed", { error: String(error && error.message || error) });
    process.exit(1);
  });
}
