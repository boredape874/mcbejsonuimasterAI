import { mkdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { captureRepositoryState, compareRepositoryState, createTestRunContext, DEFAULT_REPOSITORY_GUARDS, runChild } from "./_lib/test-run-context.mjs";
import { parseTestRunnerArgs, runPool, validateTestManifest } from "./_lib/test-manifest.mjs";
import { selectImpact } from "../tools/test-impact.mjs";

const repo = resolve(fileURLToPath(new URL("..", import.meta.url)));
let options;
try { options = parseTestRunnerArgs(process.argv.slice(2)); }
catch (error) { process.stderr.write(`${error.message}\nUsage: node tests/run-manifest.mjs [--jobs N]\n`); process.exit(64); }
if (options.help) { process.stdout.write("Usage: node tests/run-manifest.mjs [--jobs N]\n"); process.exit(0); }
const manifest = JSON.parse(await readFile(resolve(repo, "data", "test-manifest.json"), "utf8"));
const manifestIssues = await validateTestManifest(manifest, repo);
if (manifestIssues.length) {
  process.stdout.write(`${JSON.stringify({ schema: "mcbe-jsonui-ai-kit/test-run@1", ok: false, status: "manifest-invalid", issues: manifestIssues })}\n`);
  process.exit(2);
}
const context = await createTestRunContext(repo);
const resourceManifest = JSON.parse(await readFile(context.resourceManifest, "utf8"));
const before = await captureRepositoryState(repo, DEFAULT_REPOSITORY_GUARDS);
const impact = await selectImpact();
let results = [];
const cleanupErrors = [];

try {
  results = await runPool(manifest.tests, options.jobs, async (test) => {
    const started = performance.now();
    try {
      const caseRoot = join(context.workspace, test.id);
      const caseRepositoryRoot = join(context.repositoryWorkspace, test.id);
      await Promise.all([mkdir(caseRoot, { recursive: true }), mkdir(caseRepositoryRoot, { recursive: true })]);
      const result = await runChild(process.execPath, test.argv, {
        cwd: repo,
        env: {
          ...process.env,
          MCBEKIT_TEST_RUN_ID: context.runId,
          MCBEKIT_TEST_CASE_ID: test.id,
          MCBEKIT_TEST_ROOT: caseRoot,
          MCBEKIT_REPO_TEST_ROOT: caseRepositoryRoot,
          MCBEKIT_TEST_RESOURCE_MANIFEST: context.resourceManifest,
        },
        timeoutMs: test.timeoutMs || 120000,
      });
      return {
        id: test.id,
        argv: test.argv,
        durationMs: Math.round((performance.now() - started) * 1000) / 1000,
        exitCode: result.code,
        signal: result.signal || null,
        timedOut: result.timedOut || false,
        spawnError: result.spawnError || null,
        stdoutBytes: Buffer.byteLength(result.stdout || "", "utf8"),
        stderrBytes: Buffer.byteLength(result.stderr || "", "utf8"),
        stdout: result.code === 0 ? undefined : result.stdout,
        stderr: result.code === 0 ? undefined : result.stderr,
        ok: result.code === 0 && !result.signal && !result.timedOut && !result.spawnError,
      };
    } catch (error) {
      return {
        id: test.id,
        argv: test.argv,
        durationMs: Math.round((performance.now() - started) * 1000) / 1000,
        exitCode: null,
        signal: null,
        timedOut: false,
        spawnError: null,
        infrastructureError: String(error?.stack || error),
        stdoutBytes: 0,
        stderrBytes: 0,
        ok: false,
      };
    }
  });
} finally {
  try { await context.cleanup(); } catch (error) { cleanupErrors.push(String(error?.stack || error)); }
}

const after = await captureRepositoryState(repo, DEFAULT_REPOSITORY_GUARDS);
const repositoryParity = compareRepositoryState(before, after);
const failures = results.filter((result) => !result.ok);
const selected = new Set(impact.selected);
const missedFailures = failures.filter((result) => !selected.has(result.id)).map((result) => result.id);
const report = {
  schema: "mcbe-jsonui-ai-kit/test-run@1",
  runId: context.runId,
  executionPolicy: "full-suite",
  jobs: options.jobs,
  resourceManifest,
  impact: { ...impact, falseNegative: missedFailures.length > 0, missedFailures },
  results,
  repositoryParity,
  cleanupErrors,
  ok: failures.length === 0 && cleanupErrors.length === 0 && repositoryParity.ok,
};
process.stdout.write(`${JSON.stringify(report)}\n`);
if (!report.ok) process.exitCode = 1;
