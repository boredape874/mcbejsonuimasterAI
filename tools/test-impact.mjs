import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const mapPath = resolve(root, "data", "test-impact-map.json");
const manifestPath = resolve(root, "data", "test-manifest.json");

export function glob(pattern, path) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*");
  return new RegExp(`^${escaped}$`).test(path);
}

export function validateImpactConfiguration(map, manifest) {
  const issues = [];
  if (map?.schema !== "mcbe-jsonui-ai-kit/test-impact-map@1") issues.push({ code: "IMPACT_SCHEMA_INVALID" });
  if (map?.policy !== "shadow-only") issues.push({ code: "IMPACT_POLICY_INVALID" });
  if (!Array.isArray(map?.forceFull) || !Array.isArray(map?.rules)) issues.push({ code: "IMPACT_RULES_INVALID" });
  if (map?.fallback !== "full") issues.push({ code: "IMPACT_FALLBACK_UNSAFE" });
  const testIds = new Set((manifest?.tests || []).map((test) => test.id));
  const seenPatterns = new Set();
  for (const [index, rule] of (map?.rules || []).entries()) {
    if (!Array.isArray(rule.paths) || !rule.paths.length || rule.paths.some((path) => typeof path !== "string" || !path)) issues.push({ code: "IMPACT_PATHS_INVALID", rule: index });
    if (!Array.isArray(rule.tests) || !rule.tests.length) issues.push({ code: "IMPACT_TESTS_INVALID", rule: index });
    for (const id of rule.tests || []) if (!testIds.has(id)) issues.push({ code: "IMPACT_TEST_UNKNOWN", rule: index, id });
    for (const pattern of rule.paths || []) {
      if (seenPatterns.has(pattern)) issues.push({ code: "IMPACT_PATTERN_DUPLICATE", rule: index, pattern });
      seenPatterns.add(pattern);
    }
  }
  return issues;
}

function gitPaths(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `git ${args.join(" ")} failed`);
  return result.stdout.split(/\r?\n/).filter(Boolean).map((path) => path.replace(/\\/g, "/"));
}

export async function selectImpact(explicitPaths = null) {
  const mapBytes = await readFile(mapPath);
  const map = JSON.parse(mapBytes);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const configurationIssues = validateImpactConfiguration(map, manifest);
  if (configurationIssues.length) throw new Error(`invalid test impact configuration: ${JSON.stringify(configurationIssues)}`);
  const all = manifest.tests.map((test) => test.id);
  const changedPaths = explicitPaths?.length ? explicitPaths.map((path) => path.replace(/\\/g, "/")) : [
    ...gitPaths(["diff", "--name-only", "--diff-filter=ACMR", "HEAD"]),
    ...gitPaths(["ls-files", "--others", "--exclude-standard"]),
  ];
  const unique = [...new Set(changedPaths)].sort();
  const forceReasons = unique.filter((path) => map.forceFull.some((pattern) => glob(pattern, path)));
  const selected = new Set();
  const matched = new Set();
  const matchedRules = [];
  for (const [ruleIndex, rule] of map.rules.entries()) for (const path of unique) {
    if (rule.paths.some((pattern) => glob(pattern, path))) {
      matched.add(path);
      matchedRules.push({ rule: ruleIndex, path, tests: rule.tests });
      for (const id of rule.tests) selected.add(id);
    }
  }
  const unknown = unique.filter((path) => !matched.has(path) && !forceReasons.includes(path));
  const fullRequired = unique.length === 0 || forceReasons.length > 0 || unknown.length > 0;
  return {
    schema: "mcbe-jsonui-ai-kit/test-impact-shadow@1",
    policy: "shadow-only",
    executionPolicy: "full-suite",
    gateEnabled: false,
    mapHash: createHash("sha256").update(mapBytes).digest("hex"),
    changedPaths: unique,
    selected: fullRequired ? all : [...selected].sort(),
    recommendedSubset: [...selected].sort(),
    fullRequired,
    forceReasons,
    unknown,
    matchedRules,
    allTests: all,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const marker = process.argv.indexOf("--changed");
  const explicit = marker >= 0 ? process.argv.slice(marker + 1) : null;
  selectImpact(explicit).then((result) => process.stdout.write(`${JSON.stringify(result)}\n`)).catch((error) => {
    process.stderr.write(`${String(error?.stack || error)}\n`);
    process.exitCode = 1;
  });
}
