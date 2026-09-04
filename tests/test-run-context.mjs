import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createTestRunContext, runChild } from "./_lib/test-run-context.mjs";

const repo = resolve(fileURLToPath(new URL("..", import.meta.url)));
const context = await createTestRunContext(repo);
assert.match(context.runId, /^[0-9a-f-]{36}$/);
await access(context.resourceManifest);

const success = await runChild(process.execPath, ["-e", "process.stdout.write('ok')"], { cwd: repo, timeoutMs: 1000 });
assert.equal(success.code, 0);
assert.equal(success.stdout, "ok");
assert.equal(success.spawnError, null);
assert.equal(success.timedOut, false);

const usage = await runChild(process.execPath, ["-e", "process.stderr.write('usage');process.exit(64)"], { cwd: repo, timeoutMs: 1000 });
assert.equal(usage.code, 64);
assert.equal(usage.stderr, "usage");

const missing = await runChild(`definitely-missing-${context.runId}`, [], { cwd: repo, timeoutMs: 1000 });
assert.equal(missing.code, null);
assert.ok(missing.spawnError);

const timeout = await runChild(process.execPath, ["-e", "setTimeout(()=>{},10000)"], { cwd: repo, timeoutMs: 50 });
assert.equal(timeout.timedOut, true);
assert.ok(timeout.signal || timeout.code !== 0);

await context.cleanup();
await assert.rejects(access(context.root));
await assert.rejects(access(context.repositoryWorkspace));
console.log("PASS test run context child parity and cleanup");
