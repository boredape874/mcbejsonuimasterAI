import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repo = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const node = process.execPath;
let passed = 0;
const failures = [];
function check(name, condition, detail = "") { if (condition) { passed++; console.log(`PASS ${name}`); } else { failures.push({ name, detail }); console.log(`FAIL ${name} ${detail}`); } }
function run(command, args) { return new Promise((done) => { const child = spawn(command, args, { cwd: repo }); let stdout = "", stderr = ""; child.stdout.on("data", c => stdout += c); child.stderr.on("data", c => stderr += c); child.on("close", code => done({ code, stdout, stderr })); }); }
function parse(result) { try { return JSON.parse(result.stdout); } catch { return null; } }

const topology = JSON.parse(await readFile(resolve(repo, "data/skill-topology.json"), "utf8"));
const routing = JSON.parse(await readFile(resolve(repo, "data/skill-routing.json"), "utf8"));
const profiles = JSON.parse(await readFile(resolve(repo, "data/skill-tool-profiles.json"), "utf8"));
const source = (await readdir(resolve(repo, "skills"), { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name).sort();
check("topology source 23", source.length === 23 && JSON.stringify(source) === JSON.stringify([...topology.sourceSkills].sort()));
check("routing set equality", JSON.stringify(source) === JSON.stringify(routing.routes.map(r => r.skill).sort()));
check("profile set equality", JSON.stringify(source) === JSON.stringify(profiles.profiles.map(p => p.skill).sort()));
check("implicit invocation preserved", !JSON.stringify(topology).includes("allow_implicit_invocation"));

const exactCases = [
  ["runtime-error", "mcbe-json-ui-debugging"], ["vanilla-texture", "mcbe-json-ui-vanilla-assets"],
  ["server-form", "mcbe-json-ui-server-forms"], ["pixel-geometry", "mcbe-json-ui-ir-authoring"],
  ["screenshot-comparison", "mcbe-json-ui-final-rp-inspection"]
];
for (const [kind, expected] of exactCases) {
  const result = await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify({ surface: "json-ui", taskKinds: [kind], knownFiles: [], evidenceNeeded: ["T1"] }), "--compact"]);
  const value = parse(result);
  check(`exact ${kind}`, result.code === 0 && value?.primarySkill === expected && value.primarySkill !== "mcbe-json-ui-master" && value.followOnSkill === null);
}
const broad = parse(await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify({ surface: "json-ui", taskKinds: ["mixed"], knownFiles: [], evidenceNeeded: ["T1"] })]));
check("broad master exactly one", broad?.primarySkill === "mcbe-json-ui-master" && broad.followOnSkill === null);
for (const intent of [{ taskKinds: [] }, { taskKinds: ["unknown-kind"] }, { taskKinds: ["hud", "server-form"] }, { taskKinds: ["hud"], unexpected: true }]) {
  const result = await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify(intent)]);
  check(`fail closed ${JSON.stringify(intent)}`, result.code === 9 && parse(result)?.ok === false);
}
const advisory = await run(node, ["tools/route-task.mjs", "--prompt", "fix this server form"]);
check("raw prompt advisory only", advisory.code === 9 && parse(advisory)?.executable === false);
const anti = await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify({ taskKinds: ["beginner-explanation", "implementation"] })]);
check("anti-trigger blocks conflicting route", anti.code === 9 && parse(anti)?.code === "ROUTE_ANTI_TRIGGERED");
const addon = parse(await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify({ taskKinds: ["addon-integration"] })]));
check("skill-relative route reference exists", addon?.references?.[0] === "references/addon-map.md");

let state = { surface: "json-ui", taskKinds: ["runtime-error"], knownFiles: [], evidenceNeeded: ["T1"], mode: "quick", escalation: { count: 0, reason: "BLOCKING_UNRESOLVED", commandHashes: [], nextCommandHash: "a" } };
let escalated = parse(await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify(state)]));
check("quick to standard", escalated?.mode === "standard" && escalated.escalation.count === 1);
state = { ...state, mode: "standard", escalation: { count: 1, reason: "CONTRACT_DIVERGENCE", commandHashes: ["a"], nextCommandHash: "b" } };
escalated = parse(await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify(state)]));
check("standard to deep", escalated?.mode === "deep" && escalated.escalation.count === 2);
const duplicate = await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify({ ...state, escalation: { count: 1, reason: "CONTRACT_DIVERGENCE", commandHashes: ["b"], nextCommandHash: "b" } })]);
check("duplicate command blocked", duplicate.code === 9 && parse(duplicate)?.code === "DUPLICATE_COMMAND");

const lint = await run(node, ["tools/skill-lint.mjs", "--json"]);
check("portable lint", lint.code === 0 && parse(lint)?.skills === 23, lint.stdout.slice(0, 300));
const lintValue = parse(lint);
check("routed references are discoverable", !lintValue?.warnings?.some((item) => /debugging-map\.md|master-routing\.md/.test(item.file || "")));
const sync = parse(await run(node, ["tools/skill-sync-check.mjs"]));
check("installed drift classified", sync?.readOnly === true && sync.counts?.source === 23 && Array.isArray(sync.installedOnly) && Array.isArray(sync.drift));

const full = await run(node, ["tools/skill-context.mjs", "mcbe-json-ui-master", "--full", "--json"]);
const legacy = await run(node, ["tools/skill-context.mjs", "mcbe-json-ui-master", "--json"]);
const compact = await run(node, ["tools/skill-context.mjs", "mcbe-json-ui-master", "--compact", "--json"]);
const fullValue = parse(full), legacyValue = parse(legacy), compactValue = parse(compact);
check("legacy full alias", full.code === 0 && legacy.stdout === full.stdout);
check("compact semantic parity", compact.code === 0 && JSON.stringify(compactValue?.workflow) === JSON.stringify(fullValue?.workflow) && compactValue.tools.every((t, i) => t.id === fullValue.tools[i].selection.id && t.required === fullValue.tools[i].selection.required && t.availability.available === fullValue.tools[i].availability.available && t.blocking === (t.required && !t.availability.available)));
check("compact smaller", Buffer.byteLength(compact.stdout) < Buffer.byteLength(full.stdout));
check("safety parity", ["successCriteria", "boundaries"].every(key => JSON.stringify(compactValue?.[key]) === JSON.stringify(fullValue?.[key])));

const temp = await mkdtemp(resolve(tmpdir(), "mcbe-skills-install-"));
try {
  const dry = await run("powershell", ["-NoProfile", "-File", "scripts/install-skills.ps1", "-TargetBase", temp]);
  check("installer dry-run default", dry.code === 0 && /DRY-RUN/.test(dry.stdout) && (await readdir(temp)).length === 0, dry.stderr);
  const apply = await run("powershell", ["-NoProfile", "-File", "scripts/install-skills.ps1", "-TargetBase", temp, "-Apply"]);
  check("installer staged apply", apply.code === 0 && (await readdir(temp, { withFileTypes: true })).filter(e => e.isDirectory()).length === 23, apply.stderr);
  const installedMaster = resolve(temp, "mcbe-json-ui-master", "SKILL.md");
  const before = await readFile(installedMaster, "utf8");
  await import("node:fs/promises").then(({ writeFile }) => writeFile(installedMaster, `${before}\nlocal drift\n`));
  const blocked = await run("powershell", ["-NoProfile", "-File", "scripts/install-skills.ps1", "-TargetBase", temp, "-Apply"]);
  check("installer unreviewed overwrite zero", blocked.code !== 0 && (await readFile(installedMaster, "utf8")).endsWith("local drift\n"));
  const reviewed = await run("powershell", ["-NoProfile", "-File", "scripts/install-skills.ps1", "-TargetBase", temp, "-Apply", "-ReviewedSkill", "mcbe-json-ui-master"]);
  check("installer explicit reviewed update", reviewed.code === 0 && (await readFile(installedMaster, "utf8")) === before, reviewed.stderr);
} finally { await rm(temp, { recursive: true, force: true }); }

console.log(`Total: ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
