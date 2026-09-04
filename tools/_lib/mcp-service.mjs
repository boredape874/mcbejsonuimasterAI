import { access, readFile, readdir, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";

export const MCP_SCHEMA_VERSION = 2;
export const MCP_ENGINE_VERSION = "0.2.0";

const objectSchema = (properties, required = []) => ({
  type: "object",
  additionalProperties: false,
  properties,
  ...(required.length ? { required } : {}),
});

const projectProperties = {
  projectId: { type: "string", description: "ID returned by mcbe_ui_open_project." },
  rpRoot: { type: "string", description: "Absolute resource-pack root. Used when no projectId is supplied." },
  vanillaRoot: { type: "string", description: "Optional absolute installed-vanilla resource-pack root. Auto-discovered when omitted." },
};

export const MCP_UI_TOOLS = Object.freeze([
  {
    name: "mcbe_ui_open_project",
    description: "Open and index a local Bedrock resource pack without modifying it.",
    inputSchema: objectSchema({
      rpRoot: { type: "string", description: "Absolute path to the resource-pack root." },
      bpRoot: { type: "string", description: "Optional absolute behavior-pack root." },
      vanillaRoot: { type: "string", description: "Optional absolute installed-vanilla resource-pack root." },
    }, ["rpRoot"]),
  },
  {
    name: "mcbe_ui_resolve_screen",
    description: "Resolve a final-RP control tree, including inheritance, variables, collections and a server-form fixture.",
    inputSchema: objectSchema({
      ...projectProperties,
      control: { type: "string" },
      routeToken: { type: "string" },
      viewport: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
      guiScale: { type: "number", exclusiveMinimum: 0 },
      fixture: { type: "object" },
      state: { type: "object" },
    }),
  },
  {
    name: "mcbe_ui_render_screen",
    description: "Render one deterministic state from a resolved final-RP screen and return artifact paths and hashes.",
    inputSchema: objectSchema({
      ...projectProperties,
      control: { type: "string" }, routeToken: { type: "string" }, fixture: { type: "object" },
      viewport: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
      guiScale: { type: "number", exclusiveMinimum: 0 },
      interactionState: { enum: ["default", "hover", "pressed", "selected", "locked", "focus"] },
      outputDir: { type: "string" },
      constraints: { type: "array", items: { type: "object" } },
    }),
  },
  {
    name: "mcbe_ui_render_states",
    description: "Render default and interaction states plus a contact sheet from the final RP.",
    inputSchema: objectSchema({
      ...projectProperties,
      control: { type: "string" }, routeToken: { type: "string" }, fixture: { type: "object" },
      states: { type: "array", items: { enum: ["default", "hover", "pressed", "selected", "locked", "focus"] }, minItems: 1 },
      outputDir: { type: "string" },
      viewport: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
      constraints: { type: "array", items: { type: "object" } },
    }),
  },
  {
    name: "mcbe_ui_inspect_control",
    description: "Inspect a resolved control's source chain, declared rect, visual alpha bounds, hitbox, baseline and unresolved expressions.",
    inputSchema: objectSchema({ ...projectProperties, control: { type: "string" }, controlId: { type: "string" }, fixture: { type: "object" } }, ["controlId"]),
  },
  {
    name: "mcbe_ui_validate_layout",
    description: "Check positions, size, spacing, clipping, visual overlap, text baselines and texture distortion.",
    inputSchema: objectSchema({ ...projectProperties, control: { type: "string" }, fixture: { type: "object" }, viewport: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 }, constraints: { type: "array", items: { type: "object" } }, toleranceUi: { type: "number", minimum: 0 } }),
  },
  {
    name: "mcbe_ui_validate_state_textures",
    description: "Check button-state canvas sizes, alpha bounds, silhouettes, ratios and duplicate shell rendering.",
    inputSchema: objectSchema({ ...projectProperties, control: { type: "string" }, fixture: { type: "object" }, viewport: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 }, states: { type: "array", items: { enum: ["default", "hover", "pressed", "selected", "locked", "focus"] } }, constraints: { type: "array", items: { type: "object" } }, toleranceSourcePx: { type: "number", minimum: 0 } }),
  },
  {
    name: "mcbe_ui_measure_reference",
    description: "Measure local reference-image geometry and alpha bounds. The image is never uploaded.",
    inputSchema: objectSchema({ imagePath: { type: "string" }, regions: { type: "array", items: { type: "object" } }, rootRect: { type: "array", items: { type: "number" }, minItems: 4, maxItems: 4 } }, ["imagePath"]),
  },
  {
    name: "mcbe_ui_compare_screenshot",
    description: "Compare a local Bedrock screenshot with a local render and report element-level geometry deltas.",
    inputSchema: objectSchema({ renderPath: { type: "string" }, screenshotPath: { type: "string" }, rootRect: { type: "array", items: { type: "number" }, minItems: 4, maxItems: 4 }, maskPath: { type: "string" }, outputDir: { type: "string" } }, ["renderPath", "screenshotPath"]),
  },
  {
    name: "mcbe_ui_search_examples",
    description: "Search the local measured recipe/example corpus; no network access is used.",
    inputSchema: objectSchema({ query: { type: "string" }, family: { type: "string" }, role: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 100 } }),
  },
  {
    name: "mcbe_ui_propose_corrections",
    description: "Return read-only JSON-pointer patch proposals with old/new values, evidence and expected error; never edits the RP.",
    inputSchema: objectSchema({ ...projectProperties, control: { type: "string" }, fixture: { type: "object" }, validation: { type: "object", description: "Deprecated v1 field; never trusted for patch generation." }, evidenceIds: { type: "array", items: { type: "string" }, minItems: 1 }, sourceRevision: { type: "string" }, patchTarget: { enum: ["ir", "final-json"] }, allowPointers: { type: "array", items: { type: "string" } }, maxDeltaUi: { type: "number", minimum: 0, maximum: 2 } }),
  },
  {
    name: "mcbe_ui_calibrate_renderer",
    description: "Calibrate local renderer coordinates against a local screenshot and issue a project-bound calibration ID.",
    inputSchema: objectSchema({ ...projectProperties, screenshotPath: { type: "string" }, renderPath: { type: "string" }, rootRect: { type: "array", items: { type: "number" }, minItems: 4, maxItems: 4 }, correspondences: { type: "array", items: { type: "object" }, minItems: 1 }, logicalSize: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 }, guiScale: { type: "number", exclusiveMinimum: 0 }, safeArea: { type: "array", items: { type: "number" }, minItems: 4, maxItems: 4 } }, ["screenshotPath"]),
  },
  {
    name: "mcbe_ui_measure_text",
    description: "Measure glyph bounds, advance and baseline using an explicit Minecraft font profile; system fallback is forbidden.",
    inputSchema: objectSchema({ ...projectProperties, fontProfileId: { type: "string" }, text: { type: "string" }, fontType: { type: "string" }, fontSize: { type: ["string", "number"] }, fontScaleFactor: { type: "number", exclusiveMinimum: 0 }, maxWidth: { type: "number", exclusiveMinimum: 0 }, maxHeight: { type: "number", exclusiveMinimum: 0 }, rect: { type: "object" }, alignment: { enum: ["left", "center", "right"] }, shadow: { type: "boolean" } }, ["text"]),
  },
  {
    name: "mcbe_ui_validate_upstream_compatibility",
    description: "Run pinned, offline upstream anchor, nine-slice, import and serialization compatibility fixtures.",
    inputSchema: objectSchema({ sourceIds: { type: "array", items: { type: "string" } }, fixtureIds: { type: "array", items: { type: "string" } }, capturesPath: { type: "string" }, offline: { type: "boolean", const: true } }),
  },
]);

const BACKEND_METHODS = Object.freeze({
  mcbe_ui_resolve_screen: "resolveScreen", mcbe_ui_render_screen: "renderScreen", mcbe_ui_render_states: "renderStates",
  mcbe_ui_inspect_control: "inspectControl", mcbe_ui_validate_layout: "validateLayout", mcbe_ui_validate_state_textures: "validateStateTextures",
  mcbe_ui_measure_reference: "measureReference", mcbe_ui_compare_screenshot: "compareScreenshot", mcbe_ui_propose_corrections: "proposeCorrections",
  mcbe_ui_calibrate_renderer: "calibrateRenderer", mcbe_ui_measure_text: "measureText", mcbe_ui_validate_upstream_compatibility: "validateUpstreamCompatibility",
});

function toolError(code, message, details = {}) {
  return { ok: false, error: { code, message, details } };
}

function assertObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("arguments must be an object");
}

async function assertLocalFile(path, label) {
  if (!isAbsolute(path)) throw new Error(`${label} must be an absolute local path`);
  const info = await stat(path);
  if (!info.isFile()) throw new Error(`${label} is not a file: ${path}`);
  return resolve(path);
}

async function defaultSearchExamples(args) {
  const candidates = [
    resolve("data", "design-recipes.json"),
    resolve("workspace", "corpus-local", "design-recipes.local.json"),
    resolve("data", "design-catalog.json"),
  ];
  const records = [];
  for (const path of candidates) {
    try {
      await access(path);
      const parsed = JSON.parse(await readFile(path, "utf8"));
      records.push(...(Array.isArray(parsed) ? parsed : parsed.recipes ?? parsed.items ?? []));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  const words = String(args.query ?? "").toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const filtered = records.filter((record) => {
    if (args.family && record.family !== args.family) return false;
    if (args.role && record.role !== args.role) return false;
    const haystack = JSON.stringify(record).toLocaleLowerCase();
    return words.every((word) => haystack.includes(word));
  });
  return { ok: true, count: filtered.length, results: filtered.slice(0, args.limit ?? 20) };
}

export function createMcbeUiService(backend = {}) {
  const projects = new Map();
  const evidence = new Map();
  const calibrations = new Map();
  let sequence = 0;

  const id = (prefix) => `${prefix}-${process.pid}-${++sequence}`;
  const meta = (project = null) => ({ schemaVersion: MCP_SCHEMA_VERSION, engineVersion: MCP_ENGINE_VERSION, projectRevision: project?.projectRevision ?? null, evidenceStatus: "local-static", sourceAttribution: [] });
  const decorate = (result, project = null) => ({ ...meta(project), ...result });

  async function revisionFor(rpRoot) {
    const root = resolve(rpRoot), uiRoot = join(root, "ui"), hash = createHash("sha256"), files = [];
    async function walk(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) { const path = join(dir, entry.name); if (entry.isDirectory()) await walk(path); else if (/\.jsonc?$/i.test(entry.name)) files.push(path); } }
    try { await walk(uiRoot); } catch {}
    if (!files.length) hash.update(root);
    for (const file of files.sort()) { hash.update(relative(root, file).replaceAll("\\", "/")); hash.update(await readFile(file)); }
    return hash.digest("hex");
  }

  function withProject(args) {
    if (args.projectId) {
      const project = projects.get(args.projectId);
      if (!project) throw new Error(`Unknown projectId: ${args.projectId}`);
      return { ...project, ...args, rpRoot: project.rpRoot, bpRoot: project.bpRoot };
    }
    if (!args.rpRoot) throw new Error("projectId or rpRoot is required");
    return args;
  }

  async function dispatch(name, rawArgs = {}) {
    try {
      assertObject(rawArgs);
      if (name === "mcbe_ui_open_project") {
        if (!isAbsolute(rawArgs.rpRoot)) throw new Error("rpRoot must be an absolute local path");
        const rootInfo = await stat(rawArgs.rpRoot);
        if (!rootInfo.isDirectory()) throw new Error(`rpRoot is not a directory: ${rawArgs.rpRoot}`);
        if (rawArgs.bpRoot) {
          if (!isAbsolute(rawArgs.bpRoot) || !(await stat(rawArgs.bpRoot)).isDirectory()) throw new Error("bpRoot must be an existing absolute directory");
        }
        if (rawArgs.vanillaRoot) {
          if (!isAbsolute(rawArgs.vanillaRoot) || !(await stat(rawArgs.vanillaRoot)).isDirectory()) throw new Error("vanillaRoot must be an existing absolute directory");
        }
        const projectId = id("mcbe-ui");
        const project = { projectId, rpRoot: resolve(rawArgs.rpRoot), bpRoot: rawArgs.bpRoot ? resolve(rawArgs.bpRoot) : null, vanillaRoot: rawArgs.vanillaRoot ? resolve(rawArgs.vanillaRoot) : null, projectRevision: await revisionFor(rawArgs.rpRoot) };
        const indexed = backend.openProject ? await backend.openProject(project) : {};
        projects.set(projectId, project);
        return decorate({ ok: true, ...project, ...indexed, readOnly: true, capabilities: Object.fromEntries(MCP_UI_TOOLS.map((tool) => [tool.name, tool.name === "mcbe_ui_open_project" || tool.name === "mcbe_ui_search_examples" || typeof backend[BACKEND_METHODS[tool.name]] === "function"])) }, project);
      }
      if (name === "mcbe_ui_measure_reference") rawArgs.imagePath = await assertLocalFile(rawArgs.imagePath, "imagePath");
      if (name === "mcbe_ui_compare_screenshot") {
        rawArgs.renderPath = await assertLocalFile(rawArgs.renderPath, "renderPath");
        rawArgs.screenshotPath = await assertLocalFile(rawArgs.screenshotPath, "screenshotPath");
        if (rawArgs.maskPath) rawArgs.maskPath = await assertLocalFile(rawArgs.maskPath, "maskPath");
      }
      if (name === "mcbe_ui_calibrate_renderer") {
        rawArgs.screenshotPath = await assertLocalFile(rawArgs.screenshotPath, "screenshotPath");
        if (rawArgs.renderPath) rawArgs.renderPath = await assertLocalFile(rawArgs.renderPath, "renderPath");
      }
      if (name === "mcbe_ui_search_examples") return decorate(backend.searchExamples ? await backend.searchExamples(rawArgs) : await defaultSearchExamples(rawArgs));

      const method = BACKEND_METHODS[name];
      if (!method) return decorate(toolError("UNKNOWN_TOOL", `Unknown MCP tool: ${name}`));
      if (typeof backend[method] !== "function") return decorate(toolError("CAPABILITY_UNAVAILABLE", `${name} is unavailable because its local engine adapter is not installed`, { method }));
      const projectScoped = !(name.includes("reference") || name === "mcbe_ui_compare_screenshot" || name === "mcbe_ui_validate_upstream_compatibility");
      const args = projectScoped ? withProject(rawArgs) : (rawArgs.projectId ? withProject(rawArgs) : rawArgs);
      const project = args.projectId ? projects.get(args.projectId) : null;
      if (name === "mcbe_ui_propose_corrections") {
        if (!args.evidenceIds?.length) return decorate(toolError("EVIDENCE_REQUIRED", "Only server-issued evidenceIds can produce patch proposals; the v1 validation field is deprecated."), project);
        if (args.sourceRevision !== project?.projectRevision) return decorate(toolError("STALE_SOURCE", "sourceRevision does not match the open project"), project);
        const records = args.evidenceIds.map((key) => evidence.get(key));
        if (records.some((record) => !record || record.projectRevision !== project.projectRevision)) return decorate(toolError("INVALID_EVIDENCE", "Evidence is missing, stale, or belongs to another project"), project);
        args.evidence = records;
      }
      const rawResult = await backend[method](args);
      const result = rawResult?.ok === undefined ? { ok: true, result: rawResult } : rawResult;
      if (["mcbe_ui_validate_layout", "mcbe_ui_validate_state_textures", "mcbe_ui_compare_screenshot"].includes(name)) {
        const evidenceId = id("evidence");
        evidence.set(evidenceId, { name, projectRevision: project?.projectRevision ?? null, result });
        result.evidenceId = evidenceId;
      }
      if (name === "mcbe_ui_calibrate_renderer" && result.ok !== false) {
        const calibrationId = id("calibration");
        calibrations.set(calibrationId, { projectRevision: project?.projectRevision ?? null, result });
        result.calibrationId = calibrationId;
      }
      return decorate(result, project);
    } catch (error) {
      return decorate(toolError("INVALID_REQUEST", error.message, { name }));
    }
  }

  return { tools: MCP_UI_TOOLS, dispatch, projects, evidence, calibrations };
}
