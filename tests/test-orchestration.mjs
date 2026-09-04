import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTestRunnerArgs, runPool, validateTestManifest } from "./_lib/test-manifest.mjs";
import { selectImpact, validateImpactConfiguration } from "../tools/test-impact.mjs";

const repo = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifest = JSON.parse(await readFile(resolve(repo, "data/test-manifest.json"), "utf8"));
const impactMap = JSON.parse(await readFile(resolve(repo, "data/test-impact-map.json"), "utf8"));

assert.deepEqual(await validateTestManifest(manifest, repo), []);
assert.deepEqual(validateImpactConfiguration(impactMap, manifest), []);
assert.equal(parseTestRunnerArgs(["--jobs", "3"], {}).jobs, 3);
assert.throws(() => parseTestRunnerArgs(["--jobs", "0"], {}), /positive integer/);
assert.throws(() => parseTestRunnerArgs(["--unknown"], {}), /unknown option/);

const invalidManifest = {
  schema: manifest.schema,
  tests: [
    { id: "duplicate", argv: ["tests/missing.mjs"] },
    { id: "duplicate", argv: ["../escape.mjs"], timeoutMs: 0 },
    { id: "directory", argv: ["tests"] },
  ],
};
const invalidIssues = await validateTestManifest(invalidManifest, repo);
for (const code of ["TEST_ENTRY_MISSING", "TEST_ENTRY_NOT_FILE", "TEST_ID_DUPLICATE", "TEST_PATH_ESCAPE", "TEST_TIMEOUT_INVALID"]) {
  assert.ok(invalidIssues.some((issue) => issue.code === code), code);
}

const order = await runPool([40, 5, 20], 3, async (delay, index) => {
  await new Promise((done) => setTimeout(done, delay));
  return index;
});
assert.deepEqual(order, [0, 1, 2]);

const skillImpact = await selectImpact(["skills/mcbe-json-ui-master/SKILL.md", "data/skill-routing.json"]);
assert.equal(skillImpact.fullRequired, false);
assert.equal(skillImpact.unknown.length, 0);
assert.ok(skillImpact.recommendedSubset.includes("skill-routing-sync"));
assert.ok(skillImpact.recommendedSubset.includes("ai-tool-contracts"));

const serverFormImpact = await selectImpact(["tools/server-form-contract.mjs", "references/patterns/server-form-search/manifest.json"]);
assert.equal(serverFormImpact.fullRequired, false);
assert.equal(serverFormImpact.unknown.length, 0);
assert.ok(serverFormImpact.recommendedSubset.includes("server-form-contract"));

const researchImpact = await selectImpact(["config/research-lock.json", "tools/_lib/upstream-policy.mjs", "docs/70-final-rp-renderer-mcp.md", "NOTICE.md"]);
assert.equal(researchImpact.fullRequired, false);
assert.equal(researchImpact.unknown.length, 0);
for (const id of ["upstream-policy", "final-rp-v1", "public-audit"]) assert.ok(researchImpact.recommendedSubset.includes(id), id);

console.log("PASS test manifest validation, bounded pool ordering, and impact-map ownership");
