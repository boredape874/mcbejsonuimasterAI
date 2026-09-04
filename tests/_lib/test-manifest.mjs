import { stat } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { isAbsolute, relative, resolve } from "node:path";

export const TEST_MANIFEST_SCHEMA = "mcbe-jsonui-ai-kit/test-manifest@1";

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

export function parseTestRunnerArgs(argv, env = process.env) {
  const options = { jobs: null, help: false };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--jobs") {
      if (index + 1 >= argv.length) throw new Error("--jobs requires a value");
      options.jobs = argv[++index];
    }
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`unknown option: ${arg}`);
  }
  const requested = options.jobs ?? env.MCBEKIT_TEST_JOBS;
  const fallback = Math.max(1, Math.min(4, availableParallelism?.() || 1));
  const jobs = requested == null ? fallback : positiveInteger(requested);
  if (!jobs) throw new Error("--jobs must be a positive integer");
  return { ...options, jobs };
}

export async function validateTestManifest(manifest, repo) {
  const issues = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return [{ code: "MANIFEST_INVALID", message: "manifest must be an object" }];
  }
  if (manifest.schema !== TEST_MANIFEST_SCHEMA) issues.push({ code: "SCHEMA_INVALID", message: `expected ${TEST_MANIFEST_SCHEMA}` });
  if (!Array.isArray(manifest.tests) || manifest.tests.length === 0) issues.push({ code: "TESTS_INVALID", message: "tests must be a non-empty array" });
  const ids = new Set();
  for (const [index, test] of (manifest.tests || []).entries()) {
    const at = `tests[${index}]`;
    if (!test || typeof test !== "object" || Array.isArray(test)) { issues.push({ code: "TEST_INVALID", path: at }); continue; }
    const extras = Object.keys(test).filter((key) => !["id", "argv", "timeoutMs"].includes(key));
    if (extras.length) issues.push({ code: "TEST_FIELD_UNKNOWN", path: at, fields: extras });
    if (typeof test.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(test.id)) issues.push({ code: "TEST_ID_INVALID", path: `${at}.id` });
    else if (ids.has(test.id)) issues.push({ code: "TEST_ID_DUPLICATE", path: `${at}.id`, id: test.id });
    else ids.add(test.id);
    if (!Array.isArray(test.argv) || test.argv.length === 0 || test.argv.some((value) => typeof value !== "string" || value.length === 0)) {
      issues.push({ code: "TEST_ARGV_INVALID", path: `${at}.argv` });
      continue;
    }
    const entry = test.argv[0].replaceAll("\\", "/");
    const absolute = resolve(repo, entry);
    const rel = relative(repo, absolute);
    if (isAbsolute(entry) || rel.startsWith("..") || isAbsolute(rel)) issues.push({ code: "TEST_PATH_ESCAPE", path: `${at}.argv[0]`, entry });
    else {
      try {
        if (!(await stat(absolute)).isFile()) issues.push({ code: "TEST_ENTRY_NOT_FILE", path: `${at}.argv[0]`, entry });
      } catch { issues.push({ code: "TEST_ENTRY_MISSING", path: `${at}.argv[0]`, entry }); }
    }
    if (test.timeoutMs !== undefined && !positiveInteger(test.timeoutMs)) issues.push({ code: "TEST_TIMEOUT_INVALID", path: `${at}.timeoutMs` });
  }
  return issues;
}

export async function runPool(items, jobs, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function consume() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(jobs, items.length) }, consume));
  return results;
}
