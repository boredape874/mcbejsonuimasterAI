import assert from "node:assert/strict";
import { mkdir, readFile, rm } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  auditPublicSourceConfig,
  auditText,
  isExcludedPublicPath,
  listPublicCandidates,
  resolveReportPath,
  runPublicAudit,
} from "../tools/public-audit.mjs";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const NODE = process.execPath;
const OUT = resolve(REPO, "workspace", "_test_public_audit");

function run(args) {
  return new Promise((done) => {
    const child = spawn(NODE, args, { cwd: REPO, windowsHide: true });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => done({ code, stdout, stderr }));
  });
}

const privateRp = ["P", "D", "-", "R", "P"].join("");
const privateBp = ["P", "D", "-", "B", "P"].join("");
const privateFamily = ["R", "X", "O"].join("");
const serverFamily = ["P", "M", "M", "P"].join("");
const windowsPath = ["C:", "\\", "Users", "\\", "fixture", "\\", "project"].join("");
const secretLine = ["discord_user_", "token", "=", "abcDEF0123456789.secret-value"].join("");
const fixtureText = [windowsPath, privateRp, privateBp, privateFamily, serverFamily, secretLine].join("\n");
const fixtureFindings = auditText("docs/fixture.md", fixtureText);
for (const rule of ["windows-local-absolute-path", "private-source-name", "core-pmmp-reference", "credential-secret-assignment"]) {
  assert.ok(fixtureFindings.some((item) => item.rule === rule), `fixture detects ${rule}`);
}
assert.ok(fixtureFindings.filter((item) => item.rule === "private-source-name").length >= 3, "all configured private source names are detected");
assert.ok(fixtureFindings.find((item) => item.rule === "credential-secret-assignment")?.match.startsWith("[redacted"), "secret evidence is redacted");
assert.equal(auditText("docs/placeholders.md", "token=<TOKEN>\napi_key=${PUBLIC_AUDIT_KEY}").some((item) => item.rule.startsWith("credential-")), false, "secret placeholders are allowed");

const publicConfig = JSON.stringify({ schemaVersion: 1, sources: [
  { id: "safe", redistribution: "public" },
  { id: "blocked-local", redistribution: "local-only" },
  { id: "blocked-prohibited", redistribution: "prohibited" },
] }, null, 2);
const redistributionFindings = auditPublicSourceConfig("config/sources.public.json", publicConfig);
assert.equal(redistributionFindings.length, 2, "public config rejects local-only and prohibited redistribution");
assert.equal(auditPublicSourceConfig("config/sources.local.json", publicConfig).length, 0, "local config is outside the public redistribution rule");

for (const path of [
  ".gitignore", "nested/.gitignore", "node_modules/pkg/a.js", "workspace/out.json", ".agent/state/setup.json", ".agent/cache/x.json",
  "references/private/a.md", "references/restricted/a.md", "references/upstreams/a.md", "references/external/a.md", "config/sources.local.json",
]) assert.equal(isExcludedPublicPath(path), true, `excluded path: ${path}`);
assert.equal(isExcludedPublicPath("docs/public.md"), false, "ordinary public documentation remains in scope");

const candidates = await listPublicCandidates(REPO);
assert.ok(candidates.includes("tools/public-audit.mjs"), "tracked and untracked public candidates include the new auditor");
assert.ok(candidates.every((path) => !isExcludedPublicPath(path)), "candidate enumeration applies every exclusion");
await assert.rejects(resolveReportPath(resolve(REPO, "..", "outside-public-audit.json"), REPO), /inside the repository/, "report path cannot escape the repository");

const current = await runPublicAudit(REPO);
assert.equal(current.schema, "mcbe-jsonui-ai-kit/public-audit@1");
assert.equal(current.ok, current.violations.length === 0);
assert.ok(current.violations.every((item) => !isAbsolute(item.path) && !item.path.split(/[\\/]+/).includes("..")), "reported paths remain repository-relative");

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
const help = await run(["tools/public-audit.mjs", "--help"]);
assert.equal(help.code, 0); assert.match(help.stdout, /--report/); assert.match(help.stdout, /--json/);
const reportPath = resolve(OUT, "report.json");
const cli = await run(["tools/public-audit.mjs", "--report", reportPath, "--json"]);
assert.ok([0, 9].includes(cli.code), cli.stderr || cli.stdout);
const written = JSON.parse(await readFile(reportPath, "utf8"));
assert.equal(written.schema, current.schema); assert.equal(written.ok, current.ok);
await rm(dirname(reportPath), { recursive: true, force: true });

if (!current.ok) {
  const byRule = Object.fromEntries([...new Set(current.violations.map((item) => item.rule))].sort().map((rule) => [rule, current.violations.filter((item) => item.rule === rule).length]));
  console.log(`INFO current public tree is not release-clean: ${current.violations.length} finding(s) ${JSON.stringify(byRule)}`);
}
console.log("PASS public audit rules, exclusions, report containment, CLI, and current-tree reporting");
