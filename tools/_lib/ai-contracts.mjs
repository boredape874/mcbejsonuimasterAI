import { readFile } from "node:fs/promises";
import { extname, isAbsolute, relative, resolve } from "node:path";
import YAML from "yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { PATHS } from "./paths.mjs";
import { exists, readJson, writeJson } from "./fsx.mjs";

export const CONTRACT_PATHS = Object.freeze({
  registry: resolve(PATHS.data, "ai-tool-registry.json"),
  profiles: resolve(PATHS.data, "skill-tool-profiles.json"),
  toolSchema: resolve(PATHS.schemas, "ai-tool.schema.json"),
  envelopeSchema: resolve(PATHS.schemas, "task-envelope.schema.json"),
  skills: resolve(PATHS.root, "skills"),
});

let registryValidator;
let envelopeValidator;

function makeValidator(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

function formatAjvErrors(errors = []) {
  return errors.map((error) => ({
    path: error.instancePath || "<root>",
    keyword: error.keyword,
    message: error.message || "schema validation failed",
    params: error.params,
  }));
}

export async function validateRegistry(registry) {
  if (!registryValidator) registryValidator = makeValidator(await readJson(CONTRACT_PATHS.toolSchema));
  const schemaOk = registryValidator(registry);
  const errors = schemaOk ? [] : formatAjvErrors(registryValidator.errors);
  const seen = new Set();
  for (const [index, tool] of (registry.tools || []).entries()) {
    if (seen.has(tool.id)) errors.push({ path: `/tools/${index}/id`, message: `duplicate tool id ${tool.id}` });
    seen.add(tool.id);
    if (tool.command && !tool.command.display.includes(tool.command.script)) {
      errors.push({ path: `/tools/${index}/command/display`, message: "display must include the registered script path" });
    }
    const failureCodes = new Set();
    for (const failure of tool.failures || []) {
      if (failureCodes.has(failure.exitCode)) {
        errors.push({ path: `/tools/${index}/failures`, message: `duplicate failure exit code ${failure.exitCode}` });
      }
      failureCodes.add(failure.exitCode);
      if ((tool.successExitCodes || []).includes(failure.exitCode)) {
        errors.push({ path: `/tools/${index}/failures`, message: `exit code ${failure.exitCode} is both success and failure` });
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

export async function loadRegistry() {
  const registry = await readJson(CONTRACT_PATHS.registry);
  const validation = await validateRegistry(registry);
  return { registry, validation };
}

export async function loadProfiles() {
  const profiles = await readJson(CONTRACT_PATHS.profiles);
  return profiles;
}

export function registryMap(registry) {
  return new Map(registry.tools.map((tool) => [tool.id, tool]));
}

export function profileMap(profiles) {
  return new Map(profiles.profiles.map((profile) => [profile.skill, profile]));
}

export async function validateProfiles(profiles, registry) {
  const errors = [];
  const warnings = [];
  if (!profiles || profiles.schemaVersion !== "1.0.0" || !Array.isArray(profiles.profiles)) {
    return { ok: false, errors: [{ path: "<root>", message: "profile registry must use schemaVersion 1.0.0 and contain profiles[]" }], warnings };
  }
  const tools = registryMap(registry);
  const skills = new Set();
  for (const [index, profile] of profiles.profiles.entries()) {
    const path = `/profiles/${index}`;
    if (!profile || typeof profile !== "object") {
      errors.push({ path, message: "profile must be an object" });
      continue;
    }
    if (typeof profile.skill !== "string" || !/^mcbe-json-ui-[a-z0-9-]+$/.test(profile.skill)) {
      errors.push({ path: `${path}/skill`, message: "skill must be a canonical mcbe-json-ui-* id" });
    } else if (skills.has(profile.skill)) {
      errors.push({ path: `${path}/skill`, message: `duplicate skill profile ${profile.skill}` });
    }
    skills.add(profile.skill);
    if (!["implemented", "planned"].includes(profile.skillStatus)) {
      errors.push({ path: `${path}/skillStatus`, message: "skillStatus must be implemented or planned" });
    }
    for (const field of ["purpose"]) {
      if (typeof profile[field] !== "string" || !profile[field].trim()) errors.push({ path: `${path}/${field}`, message: `${field} is required` });
    }
    for (const field of ["toolSelections", "workflow", "successCriteria", "boundaries"]) {
      if (!Array.isArray(profile[field])) errors.push({ path: `${path}/${field}`, message: `${field} must be an array` });
    }
    const selected = new Set();
    for (const [toolIndex, selection] of (profile.toolSelections || []).entries()) {
      const selectionPath = `${path}/toolSelections/${toolIndex}`;
      if (!selection || typeof selection.id !== "string" || !tools.has(selection.id)) {
        errors.push({ path: `${selectionPath}/id`, message: `unknown tool id ${selection?.id || "<missing>"}` });
        continue;
      }
      if (selected.has(selection.id)) errors.push({ path: `${selectionPath}/id`, message: `duplicate tool selection ${selection.id}` });
      selected.add(selection.id);
      if (typeof selection.reason !== "string" || !selection.reason.trim()) errors.push({ path: `${selectionPath}/reason`, message: "reason is required" });
      if (typeof selection.phase !== "string" || !selection.phase.trim()) errors.push({ path: `${selectionPath}/phase`, message: "phase is required" });
      if (typeof selection.required !== "boolean") errors.push({ path: `${selectionPath}/required`, message: "required must be boolean" });
      const tool = tools.get(selection.id);
      if (profile.skillStatus === "implemented" && selection.required === true && tool.status === "planned") {
        errors.push({ path: `${selectionPath}/id`, message: `implemented skill cannot require planned tool ${selection.id}` });
      }
    }
    const workflowSeen = new Set();
    for (const [workflowIndex, id] of (profile.workflow || []).entries()) {
      if (!selected.has(id)) errors.push({ path: `${path}/workflow/${workflowIndex}`, message: `workflow tool ${id} is not selected` });
      if (workflowSeen.has(id)) errors.push({ path: `${path}/workflow/${workflowIndex}`, message: `workflow repeats ${id}` });
      workflowSeen.add(id);
    }
    for (const id of selected) {
      if (!workflowSeen.has(id)) warnings.push({ path: `${path}/workflow`, message: `selected tool ${id} is not in workflow` });
    }
  }
  return { ok: errors.length === 0, errors, warnings };
}

export async function toolAvailability(tool) {
  const scriptExists = await exists(resolve(PATHS.root, tool.command.script));
  return {
    available: tool.status === "implemented" && scriptExists,
    scriptExists,
    status: tool.status,
    reason: tool.status === "planned"
      ? "planned tool; not executable until registry status is promoted after implementation"
      : scriptExists
        ? "implemented script exists"
        : "registry says implemented but script is missing",
  };
}

export async function validateEnvelope(envelope, registry) {
  if (!envelopeValidator) envelopeValidator = makeValidator(await readJson(CONTRACT_PATHS.envelopeSchema));
  const schemaOk = envelopeValidator(envelope);
  const errors = schemaOk ? [] : formatAjvErrors(envelopeValidator.errors);
  const warnings = [];
  if (!schemaOk) return { ok: false, errors, warnings, toolStatuses: [] };

  const tools = registryMap(registry);
  const toolStatuses = [];
  for (const [index, selected] of envelope.tools.entries()) {
    const tool = tools.get(selected.id);
    if (!tool) {
      errors.push({ path: `/tools/${index}/id`, message: `unknown registered tool ${selected.id}` });
      continue;
    }
    const availability = await toolAvailability(tool);
    toolStatuses.push({ id: selected.id, required: selected.required, ...availability });
    if (selected.required && !availability.available) {
      errors.push({ path: `/tools/${index}/id`, message: `required tool ${selected.id} is not available: ${availability.reason}` });
    } else if (!availability.available) {
      warnings.push({ path: `/tools/${index}/id`, message: `optional tool ${selected.id} is not available: ${availability.reason}` });
    }
  }
  for (const [index, check] of envelope.validation.entries()) {
    if (!check.toolId) continue;
    const tool = tools.get(check.toolId);
    if (!tool) {
      errors.push({ path: `/validation/${index}/toolId`, message: `unknown registered tool ${check.toolId}` });
      continue;
    }
    const availability = await toolAvailability(tool);
    if (check.required && !availability.available) {
      errors.push({ path: `/validation/${index}/toolId`, message: `required validation tool ${check.toolId} is not available: ${availability.reason}` });
    }
  }
  return { ok: errors.length === 0, errors, warnings, toolStatuses };
}

export async function loadStructured(path) {
  const file = resolveInsideRepo(path);
  const raw = await readFile(file, "utf8");
  const extension = extname(file).toLowerCase();
  if (extension === ".json") return { value: JSON.parse(raw), raw, path: file, kind: "json" };
  if (extension === ".yaml" || extension === ".yml") return { value: YAML.parse(raw), raw, path: file, kind: "yaml" };
  throw new Error(`unsupported structured input extension ${extension || "<none>"}`);
}

export function resolveInsideRepo(path) {
  const candidate = isAbsolute(path) ? resolve(path) : resolve(PATHS.root, path);
  const rel = relative(PATHS.root, candidate);
  if (rel === "" || (!rel.startsWith("..") && !isAbsolute(rel))) return candidate;
  throw new Error("path must stay inside the repository");
}

export async function writeReport(path, value) {
  if (!path) return;
  await writeJson(resolveInsideRepo(path), value);
}

export function parseCli(argv, spec = {}) {
  const options = { json: false, report: null, help: false, ...spec.defaults };
  const positionals = [];
  const valueOptions = new Set(["--report", ...(spec.valueOptions || [])]);
  const flags = new Set(["--json", "--help", ...(spec.flags || [])]);
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (valueOptions.has(arg)) {
      const value = argv[++index];
      if (!value || value.startsWith("--")) return { ok: false, error: `missing value for ${arg}` };
      options[arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    } else if ([...valueOptions].some((name) => arg.startsWith(`${name}=`))) {
      const name = [...valueOptions].find((candidate) => arg.startsWith(`${candidate}=`));
      const value = arg.slice(name.length + 1);
      if (!value) return { ok: false, error: `missing value for ${name}` };
      options[name.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
    } else if (flags.has(arg)) {
      options[arg.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = true;
    } else if (arg.startsWith("--")) return { ok: false, error: `unknown option ${arg}` };
    else positionals.push(arg);
  }
  return { ok: true, options, positionals };
}

export function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function printIssues(issues, prefix = "") {
  for (const issue of issues) process.stdout.write(`${prefix}${issue.path}: ${issue.message}\n`);
}

export function canonicalPromptSections() {
  return [
    "Goal",
    "Screen profiles",
    "Provided materials",
    "Measured evidence",
    "Constraints",
    "Recipes and tools",
    "Files to create or update",
    "Validation",
    "Unverified items",
  ];
}

function bullet(text) {
  return `- ${String(text).replace(/\r?\n/g, " ")}`;
}

export function buildPrompt(envelope, toolStatuses = []) {
  const statusById = new Map(toolStatuses.map((entry) => [entry.id, entry]));
  const lines = [
    `# MCBE JSON UI task: ${envelope.id}`,
    "",
    "## Goal",
    "",
    envelope.goal,
    "",
    "## Screen profiles",
    "",
    ...envelope.screenProfiles.map((profile) => bullet(`${profile.id}: ${profile.device}, ${profile.resolution[0]}x${profile.resolution[1]}, GUI scale ${profile.guiScale}, ${profile.required ? "required" : "optional"}${profile.notes ? `; ${profile.notes}` : ""}`)),
    "",
    "## Provided materials",
    "",
    ...(envelope.providedMaterials.length
      ? envelope.providedMaterials.map((material) => bullet(`${material.id} (${material.kind}): ${material.path} — ${material.usage}${material.redistribution ? ` [${material.redistribution}]` : ""}`))
      : ["- None provided."]),
    "",
    "## Measured evidence",
    "",
    ...(envelope.measuredEvidence.length
      ? envelope.measuredEvidence.map((evidence) => bullet(`[${evidence.status}] ${evidence.claim} — ${evidence.source}${evidence.path ? ` (${evidence.path})` : ""}${evidence.recipeId ? `; recipe ${evidence.recipeId}` : ""}`))
      : ["- No measured evidence yet. Measure before making visual claims."]),
    "",
    "## Constraints",
    "",
    ...envelope.constraints.map((constraint) => bullet(`[${constraint.priority}] ${constraint.id}/${constraint.category}: ${constraint.requirement} (${constraint.verifiable ? "verifiable" : "runtime or judgment check"})`)),
    "",
    "## Recipes and tools",
    "",
    ...(envelope.recipes.length ? envelope.recipes.map((recipe) => bullet(`Recipe: ${recipe}`)) : ["- No recipe selected yet."]),
    ...envelope.tools.map((selection) => {
      const status = statusById.get(selection.id);
      const availability = status ? (status.available ? "available" : status.status) : "registered";
      return bullet(`Tool ${selection.id} (${selection.required ? "required" : "optional"}, ${availability}): ${selection.reason}`);
    }),
    "",
    "## Files to create or update",
    "",
    ...envelope.outputFiles.map((file) => bullet(`${file.path}: ${file.role} (${file.required ? "required" : "optional"}${file.generated ? ", generated" : ""})`)),
    "",
    "## Validation",
    "",
    ...envelope.validation.map((check) => bullet(`${check.id}${check.toolId ? ` via ${check.toolId}` : ""}: ${check.criterion} (${check.required ? "required" : "optional"})${check.evidencePath ? `; evidence ${check.evidencePath}` : ""}`)),
    "",
    "## Unverified items",
    "",
    ...(envelope.unverified.length ? envelope.unverified.map(bullet) : ["- None declared."]),
  ];
  if (envelope.notes?.length) lines.push("", "## Notes", "", ...envelope.notes.map(bullet));
  lines.push("", "Do not report Bedrock runtime completion unless runtime evidence is explicitly supplied.", "");
  return lines.join("\n");
}

export function lintMarkdownPrompt(text, registry) {
  const errors = [];
  const warnings = [];
  for (const section of canonicalPromptSections()) {
    const expression = new RegExp(`^## ${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m");
    if (!expression.test(text)) errors.push({ path: "<prompt>", message: `missing canonical section: ${section}` });
  }
  if (!/^# MCBE JSON UI task: [a-z][a-z0-9_-]*\s*$/m.test(text)) {
    errors.push({ path: "<prompt>", message: "missing canonical task title" });
  }
  if (!/Do not report Bedrock runtime completion unless runtime evidence is explicitly supplied\./.test(text)) {
    errors.push({ path: "<prompt>", message: "missing runtime-verification boundary" });
  }
  const registered = registryMap(registry);
  const seen = new Set();
  for (const match of text.matchAll(/^- Tool ([a-z][a-z0-9]*(?:[.-][a-z0-9]+)*) \(/gm)) {
    const id = match[1];
    seen.add(id);
    if (!registered.has(id)) errors.push({ path: "<prompt>", message: `unknown tool id ${id}` });
  }
  if (!seen.size) warnings.push({ path: "<prompt>", message: "no canonical tool selection line was found" });
  return { ok: errors.length === 0, errors, warnings, kind: "markdown" };
}
