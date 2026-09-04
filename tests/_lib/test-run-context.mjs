import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawn } from "node:child_process";

export const DEFAULT_REPOSITORY_GUARDS = Object.freeze([
  "package.json",
  "package-lock.json",
  "vanilla-index/screens.json",
  "vanilla-index/textures.json",
  ".agent/state/setup-state.json",
]);

function child(command, args, options = {}) {
  return new Promise((done) => {
    const process = spawn(command, args, { cwd: options.cwd, env: options.env, windowsHide: true });
    let stdout = "", stderr = "";
    let settled = false;
    let timedOut = false;
    const finish = (result) => { if (!settled) { settled = true; if (timer) clearTimeout(timer); done(result); } };
    const timer = options.timeoutMs ? setTimeout(() => { timedOut = true; process.kill(); }, options.timeoutMs) : null;
    process.stdout.on("data", (chunk) => { stdout += chunk; });
    process.stderr.on("data", (chunk) => { stderr += chunk; });
    process.on("error", (error) => finish({ code: null, signal: null, timedOut, stdout, stderr, spawnError: String(error.message || error) }));
    process.on("close", (code, signal) => finish({ code, signal, timedOut, stdout, stderr, spawnError: null }));
  });
}

async function sha256(path) {
  try { return createHash("sha256").update(await readFile(path)).digest("hex"); }
  catch (error) { return error?.code === "ENOENT" ? null : Promise.reject(error); }
}

export async function captureRepositoryState(repo, importantFiles) {
  const status = await child("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: repo });
  if (status.code !== 0) throw new Error(`git status failed: ${status.stderr || status.stdout}`);
  const hashes = {};
  for (const path of importantFiles) hashes[path] = await sha256(resolve(repo, path));
  return { status: status.stdout, hashes };
}

export function compareRepositoryState(before, after) {
  const changedHashes = Object.keys(before.hashes).filter((path) => before.hashes[path] !== after.hashes[path]);
  return {
    ok: before.status === after.status && changedHashes.length === 0,
    statusChanged: before.status !== after.status,
    changedHashes,
  };
}

export async function createTestRunContext(repo) {
  const runId = randomUUID();
  const root = await mkdtemp(join(tmpdir(), `mcbe-jsonui-${runId}-`));
  const workspace = join(root, "workspace");
  const resources = join(root, "resources");
  const vanillaIndex = join(resources, "vanilla-index");
  const repositoryWorkspace = resolve(repo, "workspace", `_test_run_${runId}`);
  await mkdir(workspace, { recursive: true });
  await mkdir(vanillaIndex, { recursive: true });
  await mkdir(repositoryWorkspace, { recursive: true });
  const resourceManifest = join(root, "resource-manifest.json");
  await writeFile(resourceManifest, `${JSON.stringify({
    schema: "mcbe-jsonui-ai-kit/test-resources@1",
    runId,
    root,
    workspace,
    resources: { vanillaIndex, repositoryWorkspace },
    sourceRepository: repo,
  }, null, 2)}\n`, "utf8");
  return {
    runId,
    root,
    workspace,
    resources,
    vanillaIndex,
    repositoryWorkspace,
    resourceManifest,
    path(name) { return join(workspace, basename(name)); },
    async cleanup() {
      const errors = [];
      for (const path of [root, repositoryWorkspace]) {
        try { await rm(path, { recursive: true, force: false, maxRetries: 2, retryDelay: 50 }); }
        catch (error) { errors.push(`${path}: ${String(error?.message || error)}`); }
      }
      if (errors.length) throw new Error(`test cleanup failed:\n${errors.join("\n")}`);
    },
  };
}

export async function runChild(command, args, options = {}) {
  const result = await child(command, args, options);
  return { ...result, ok: result.code === 0 };
}
