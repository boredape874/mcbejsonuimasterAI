import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { access } from "node:fs/promises";
import { PATHS } from "./_lib/paths.mjs";

const routing = JSON.parse(await readFile(resolve(PATHS.data, "skill-routing.json"), "utf8"));
const modeOrder = ["quick", "standard", "deep"];

function fail(code, message, details = {}) {
  process.stdout.write(`${JSON.stringify({ schema: routing.schema, ok: false, code, message, ...details })}\n`);
  process.exit(9);
}

function parseArgs(argv) {
  const result = { input: null, intent: null, prompt: null, compact: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (["--input", "--intent", "--prompt"].includes(arg)) result[arg.slice(2)] = argv[++i];
    else if (arg === "--compact") result.compact = true;
    else if (arg === "--help" || arg === "-h") result.help = true;
    else fail("USAGE_ERROR", `unknown option ${arg}`);
  }
  return result;
}

function validateIntent(intent) {
  const allowed = new Set(["surface", "taskKinds", "knownFiles", "evidenceNeeded", "supportingKinds", "mode", "escalation"]);
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) fail("INVALID_INTENT", "intent must be an object");
  const extras = Object.keys(intent).filter((key) => !allowed.has(key));
  if (extras.length) fail("INVALID_INTENT", "unknown intent fields", { fields: extras });
  for (const field of ["taskKinds", "knownFiles", "evidenceNeeded", "supportingKinds"]) {
    if (intent[field] !== undefined && (!Array.isArray(intent[field]) || intent[field].some((value) => typeof value !== "string"))) {
      fail("INVALID_INTENT", `${field} must be an array of strings`);
    }
  }
  if (!Array.isArray(intent.taskKinds) || intent.taskKinds.length === 0) fail("UNKNOWN_ROUTE", "taskKinds is required");
  if (intent.mode && !modeOrder.includes(intent.mode)) fail("INVALID_INTENT", "unknown mode");
}

function route(intent) {
  validateIntent(intent);
  const kinds = new Set(intent.taskKinds);
  const broad = intent.taskKinds.some((kind) => routing.broadTaskKinds.includes(kind));
  let owners = routing.routes.filter((entry) => entry.skill !== "mcbe-json-ui-master" && entry.primaryFor.some((kind) => kinds.has(kind)));
  if (broad) owners = [routing.routes.find((entry) => entry.skill === "mcbe-json-ui-master")];
  if (owners.length === 0) fail("UNKNOWN_ROUTE", "no primary owner matches the structured intent");
  if (owners.length > 1) fail("ROUTE_AMBIGUOUS", "multiple primary owners match the structured intent", { candidates: owners.map((entry) => entry.skill).sort() });
  const primary = owners[0];
  const blockedKinds = primary.antiTriggers.filter((kind) => kinds.has(kind));
  if (blockedKinds.length) fail("ROUTE_ANTI_TRIGGERED", "primary owner is excluded by the structured intent", { skill: primary.skill, antiTriggers: blockedKinds });
  const supportingKinds = new Set(intent.supportingKinds || []);
  const supports = routing.routes.filter((entry) => entry.skill !== primary.skill && entry.skill !== "mcbe-json-ui-master" && entry.primaryFor.some((kind) => supportingKinds.has(kind)));
  if (supports.length > 1) fail("SUPPORT_AMBIGUOUS", "more than one supporting owner requested", { candidates: supports.map((entry) => entry.skill).sort() });
  const mode = intent.mode || primary.defaultMode;
  const escalation = validateEscalation(intent.escalation, mode);
  return {
    schema: routing.schema,
    ok: true,
    mode: escalation?.nextMode || mode,
    primarySkill: primary.skill,
    followOnSkill: supports[0]?.skill || null,
    routeConfidence: "high",
    routeEvidence: intent.taskKinds.filter((kind) => primary.primaryFor.includes(kind)).map((kind) => `taskKinds contains ${kind}`),
    references: Object.values(primary.referencesByNeed || {}).slice(0, 1),
    commands: [],
    evidenceTarget: (intent.evidenceNeeded || ["T1"])[0],
    answerProfile: primary.answerProfile,
    escalateWhen: primary.escalateWhen,
    escalation: escalation || { count: 0, max: routing.maxEscalations }
  };
}

async function validateReferences(result) {
  const skillRoot = resolve(PATHS.root, "skills", result.primarySkill);
  for (const reference of result.references) {
    const path = resolve(skillRoot, reference);
    if (!path.startsWith(`${skillRoot}\\`) && !path.startsWith(`${skillRoot}/`)) fail("REFERENCE_PATH_ESCAPE", "route reference escapes its Skill", { reference });
    try { await access(path); } catch { fail("REFERENCE_NOT_FOUND", "route reference does not exist", { reference, skill: result.primarySkill }); }
  }
  return result;
}

function validateEscalation(state, currentMode) {
  if (!state) return null;
  if (!Number.isInteger(state.count) || state.count < 0 || state.count >= routing.maxEscalations) fail("ESCALATION_LIMIT", "escalation limit reached");
  if (!routing.escalationReasons.includes(state.reason)) fail("INVALID_ESCALATION_REASON", "unknown escalation reason");
  const hashes = state.commandHashes || [];
  if (!Array.isArray(hashes) || hashes.some((hash) => typeof hash !== "string")) fail("INVALID_ESCALATION", "commandHashes must be strings");
  if (state.nextCommandHash && hashes.includes(state.nextCommandHash)) fail("DUPLICATE_COMMAND", "same command and input hash cannot be repeated");
  if (["RUNTIME_EVIDENCE_REQUIRED", "USER_AUTHORITY_REQUIRED"].includes(state.reason)) {
    return { count: state.count, max: routing.maxEscalations, status: "blocked-needs-user", reason: state.reason };
  }
  const index = modeOrder.indexOf(currentMode);
  if (index < 0 || index === modeOrder.length - 1) fail("ESCALATION_LIMIT", "deep mode cannot escalate further");
  return { count: state.count + 1, max: routing.maxEscalations, nextMode: modeOrder[index + 1], reason: state.reason };
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  process.stdout.write("Usage: node tools/route-task.mjs (--input <json-file> | --intent <json> | --prompt <text>) [--compact]\n");
  process.exit(0);
}
if (args.prompt) {
  process.stdout.write(`${JSON.stringify({ schema: routing.schema, ok: false, advisory: true, code: "STRUCTURED_INTENT_REQUIRED", routeConfidence: "low", candidates: [], executable: false })}\n`);
  process.exit(9);
}
let intent;
try {
  if (args.input) intent = JSON.parse(await readFile(resolve(args.input), "utf8"));
  else if (args.intent) intent = JSON.parse(args.intent);
  else fail("USAGE_ERROR", "provide --input, --intent, or --prompt");
} catch (error) {
  fail("INVALID_INTENT", error.message);
}
process.stdout.write(`${JSON.stringify(await validateReferences(route(intent)))}\n`);
