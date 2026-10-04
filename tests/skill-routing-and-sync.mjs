import { mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repo = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const node = process.execPath;
const powershell = process.platform === "win32" ? "powershell" : "pwsh";
let passed = 0;
const failures = [];
function check(name, condition, detail = "") { if (condition) { passed++; console.log(`PASS ${name}`); } else { failures.push({ name, detail }); console.log(`FAIL ${name} ${detail}`); } }
function run(command, args) { return new Promise((done) => { const child = spawn(command, command === powershell && process.platform === "win32" ? ["-ExecutionPolicy", "Bypass", ...args] : args, { cwd: repo }); let stdout = "", stderr = ""; child.stdout.on("data", c => stdout += c); child.stderr.on("data", c => stderr += c); child.on("error", error => done({ code: -1, stdout, stderr: error.message })); child.on("close", code => done({ code, stdout, stderr })); }); }
function parse(result) { try { return JSON.parse(result.stdout); } catch { return null; } }

const topology = JSON.parse(await readFile(resolve(repo, "data/skill-topology.json"), "utf8"));
const routing = JSON.parse(await readFile(resolve(repo, "data/skill-routing.json"), "utf8"));
const profiles = JSON.parse(await readFile(resolve(repo, "data/skill-tool-profiles.json"), "utf8"));
const source = (await readdir(resolve(repo, "skills"), { withFileTypes: true })).filter(e => e.isDirectory()).map(e => e.name).sort();
check("topology source count and identity", source.length === topology.sourceCount && JSON.stringify(source) === JSON.stringify([...topology.sourceSkills].sort()));
check("routing set equality", JSON.stringify(source) === JSON.stringify(routing.routes.map(r => r.skill).sort()));
check("profile set equality", JSON.stringify(source) === JSON.stringify(profiles.profiles.map(p => p.skill).sort()));
check("implicit invocation preserved", !JSON.stringify(topology).includes("allow_implicit_invocation"));

const exactCases = [
  ["native-container", "mcbe-json-ui-chest-gui"], ["chest-form", "mcbe-json-ui-chest-gui"], ["chest-editor-project", "mcbe-json-ui-chest-gui"],
  ["runtime-error", "mcbe-json-ui-debugging"], ["vanilla-texture", "mcbe-json-ui-vanilla-assets"],
  ["server-form", "mcbe-json-ui-server-forms"], ["pixel-geometry", "mcbe-json-ui-ir-authoring"],
  ["screenshot-comparison", "mcbe-json-ui-final-rp-inspection"]
];
for (const [kind, expected] of exactCases) {
  const result = await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify({ surface: "json-ui", taskKinds: [kind], knownFiles: [], evidenceNeeded: ["T1"] }), "--compact"]);
  const value = parse(result);
  check(`exact ${kind}`, result.code === 0 && value?.primarySkill === expected && value.primarySkill !== "mcbe-json-ui-master" && value.followOnSkill === null);
  check(`initial reference ${kind}`, value?.references?.length === 1 && value.nextRoutes?.length === 0);
}
const broad = parse(await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify({ surface: "json-ui", taskKinds: ["mixed"], knownFiles: [], evidenceNeeded: ["T1"] })]));
check("broad master exactly one", broad?.primarySkill === "mcbe-json-ui-master" && broad.followOnSkill === null);
for (const [surface,kind,owner,reference] of [
  ["addon","mixed","mcbe-resource-pack-master","references/addon-ownership.md"],
  ["resource-pack","outline","mcbe-resource-pack-rendering","references/outlines.md"],
  ["resource-pack","texture-set","mcbe-resource-pack-rendering","references/texture-sets.md"],
  ["attachables-ui","first-person-model","mcbe-attachables-ui","references/perspective-and-state.md"],
  ["geo-ui","geoui-studio","mcbe-geo-ui","references/geoui-contract.md"],
  ["geo-ui","geoui-project","mcbe-geo-ui","references/project-inspection.md"],
  ["geo-ui","npc-portrait-ui","mcbe-geo-ui","references/npc-portrait-ui.md"],
  ["json-ui","chest-form","mcbe-json-ui-chest-gui","references/action-form.md"],
  ["json-ui","dropdown-pagination","mcbe-json-ui-server-forms","references/dropdown-pagination.md"],
  ["resource-pack","local-asset-learning","mcbe-json-ui-samples","references/local-asset-learning.md"],
]) {
  const value = parse(await run(node,["tools/route-task.mjs","--intent",JSON.stringify({surface,taskKinds:[kind]})]));
  check(`surface and reference ${surface}/${kind}`,value?.ok && value.primarySkill===owner && JSON.stringify(value.references)===JSON.stringify([reference]));
}
const geoSupporting = parse(await run(node,["tools/route-task.mjs","--intent",JSON.stringify({surface:"geo-ui",taskKinds:["geoui-studio"],supportingKinds:["outline","texture-set"]})]));
check("supporting reference follows first requested need",geoSupporting?.nextRoutes?.length===1 && geoSupporting.nextRoutes[0].skill==="mcbe-resource-pack-rendering" && geoSupporting.nextRoutes[0].references[0]==="references/outlines.md");
for (const intent of [{ taskKinds: [] }, { taskKinds: ["unknown-kind"] }, { taskKinds: ["hud", "server-form"] }, { taskKinds: ["hud"], unexpected: true }]) {
  const result = await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify(intent)]);
  check(`fail closed ${JSON.stringify(intent)}`, result.code === 9 && parse(result)?.ok === false);
}
for (const intent of [
  { surface: "java-edition", taskKinds: ["server-form"] },
  { surface: {}, taskKinds: ["server-form"] },
  { surface: "", taskKinds: ["server-form"] },
  { taskKinds: ["server-form", "unknown-kind"] },
  { taskKinds: ["mixed", "unknown-kind"] },
  { taskKinds: ["server-form"], supportingKinds: ["binding", "unknown-kind"] },
  { taskKinds: ["server-form"], supportingKinds: ["mixed"] },
  { taskKinds: ["runtime-error"], mode: "" }
]) {
  const result = await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify(intent)]);
  check(`reject partial or invalid intent ${JSON.stringify(intent)}`, result.code === 9 && parse(result)?.ok === false);
}
const ordered = parse(await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify({ taskKinds: ["server-form"], supportingKinds: ["runtime-error", "content-log", "addon-integration", "server-form"] })]));
check("ordered supports deduplicated", JSON.stringify(ordered?.nextRoutes?.map((entry) => entry.skill)) === JSON.stringify(["mcbe-json-ui-debugging", "mcbe-json-ui-addon-integration"]));
check("follow-on compatibility preserved", ordered?.followOnSkill === ordered?.nextRoutes?.[0]?.skill && ordered.nextRoutes.every((entry) => entry.references.length === 1));
const blockedSupport = await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify({ taskKinds: ["server-form", "layout-only"], supportingKinds: ["binding"] })]);
check("support anti-trigger respected", blockedSupport.code === 9 && parse(blockedSupport)?.code === "ROUTE_ANTI_TRIGGERED");
for (const entry of routing.routes) {
  const result = parse(await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify({ taskKinds: [entry.primaryFor[0]] })]));
  check(`all routes have one existing entry reference ${entry.skill}`, result?.ok && result.references?.length === 1);
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
const runtimeBlocked = parse(await run(node, ["tools/route-task.mjs", "--intent", JSON.stringify({ taskKinds: ["runtime-error"], mode: "deep", escalation: { count: 2, reason: "RUNTIME_EVIDENCE_REQUIRED" } })]));
check("runtime blocker survives escalation ceiling", runtimeBlocked?.escalation?.status === "blocked-needs-user" && runtimeBlocked.escalation.count === 2);

const lint = await run(node, ["tools/skill-lint.mjs", "--json"]);
check("portable lint", lint.code === 0 && parse(lint)?.skills === source.length, lint.stdout.slice(0, 300));
const lintValue = parse(lint);
check("routed references are discoverable", !lintValue?.warnings?.some((item) => /debugging-map\.md|master-routing\.md/.test(item.file || "")));
const sync = parse(await run(node, ["tools/skill-sync-check.mjs"]));
check("installed drift classified", sync?.readOnly === true && sync.counts?.source === source.length && Array.isArray(sync.installedOnly) && Array.isArray(sync.drift));

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
  const dry = await run(powershell, ["-NoProfile", "-File", "scripts/install-skills.ps1", "-TargetBase", temp]);
  check("installer dry-run default", dry.code === 0 && /DRY-RUN/.test(dry.stdout) && (await readdir(temp)).length === 0, dry.stderr);
  const apply = await run(powershell, ["-NoProfile", "-File", "scripts/install-skills.ps1", "-TargetBase", temp, "-Apply"]);
  check("installer staged apply", apply.code === 0 && (await readdir(temp, { withFileTypes: true })).filter(e => e.isDirectory()).length === source.length, apply.stderr);
  await mkdir(resolve(temp, "mcbe-json-ui-local-only"));
  const managedSync = await run(node, ["tools/skill-sync-check.mjs", "--installed", temp]);
  const strictSync = await run(node, ["tools/skill-sync-check.mjs", "--installed", temp, "--strict"]);
  check("managed sync preserves installed-only Skills", managedSync.code === 0 && parse(managedSync)?.managedParity === true && parse(managedSync)?.exactParity === false);
  check("strict sync reports installed-only mismatch", strictSync.code === 9 && parse(strictSync)?.installedOnly?.includes("mcbe-json-ui-local-only"));
  const installedMaster = resolve(temp, "mcbe-json-ui-master", "SKILL.md");
  const before = await readFile(installedMaster, "utf8");
  await import("node:fs/promises").then(({ writeFile }) => writeFile(installedMaster, `${before}\nlocal drift\n`));
  const blocked = await run(powershell, ["-NoProfile", "-File", "scripts/install-skills.ps1", "-TargetBase", temp, "-Apply"]);
  check("installer unreviewed overwrite zero", blocked.code !== 0 && (await readFile(installedMaster, "utf8")).endsWith("local drift\n"));
  const reviewed = await run(powershell, ["-NoProfile", "-File", "scripts/install-skills.ps1", "-TargetBase", temp, "-Apply", "-ReviewedSkill", "mcbe-json-ui-master"]);
  check("installer explicit reviewed update", reviewed.code === 0 && (await readFile(installedMaster, "utf8")) === before, reviewed.stderr);
} finally { await rm(temp, { recursive: true, force: true }); }

console.log(`Total: ${passed} passed, ${failures.length} failed`);
if (failures.length) process.exit(1);
