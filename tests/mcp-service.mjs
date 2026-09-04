import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMcbeUiService, MCP_UI_TOOLS } from "../tools/_lib/mcp-service.mjs";
import { createLocalBackend } from "../tools/mcp-backend.mjs";

const expected = [
  "mcbe_ui_open_project", "mcbe_ui_resolve_screen", "mcbe_ui_render_screen", "mcbe_ui_render_states",
  "mcbe_ui_inspect_control", "mcbe_ui_validate_layout", "mcbe_ui_validate_state_textures",
  "mcbe_ui_measure_reference", "mcbe_ui_compare_screenshot", "mcbe_ui_search_examples", "mcbe_ui_propose_corrections",
  "mcbe_ui_calibrate_renderer", "mcbe_ui_measure_text", "mcbe_ui_validate_upstream_compatibility",
];
assert.deepEqual(MCP_UI_TOOLS.map(({ name }) => name), expected);
assert.equal(new Set(expected).size, expected.length);
for (const tool of MCP_UI_TOOLS) {
  assert.equal(tool.inputSchema.type, "object");
  assert.equal(tool.inputSchema.additionalProperties, false);
}

const temp = await mkdtemp(join(tmpdir(), "mcbe-ui-mcp-"));
const image = join(temp, "reference.png");
await writeFile(image, "fixture");
const calls = [];
const service = createMcbeUiService({
  openProject: async ({ rpRoot }) => ({ namespaceCount: rpRoot.length }),
  resolveScreen: async (args) => { calls.push(args); return { control: args.control, rpRoot: args.rpRoot }; },
  measureReference: async (args) => ({ imagePath: args.imagePath }),
  validateLayout: async () => ({ ok: true, issues: [] }),
  proposeCorrections: async (args) => ({ ok: true, patches: [], maxDeltaUi: args.maxDeltaUi, acceptedEvidence: args.evidence.length }),
});

const opened = await service.dispatch("mcbe_ui_open_project", { rpRoot: temp });
assert.equal(opened.ok, true);
assert.equal(opened.readOnly, true);
assert.equal(opened.schemaVersion, 2);
assert.equal(opened.projectRevision.length, 64);
assert.match(opened.projectId, /^mcbe-ui-/);

const resolved = await service.dispatch("mcbe_ui_resolve_screen", { projectId: opened.projectId, control: "demo.screen" });
assert.equal(resolved.ok, true);
assert.equal(resolved.result.control, "demo.screen");
assert.equal(calls[0].rpRoot, temp);

const unavailable = await service.dispatch("mcbe_ui_render_screen", { projectId: opened.projectId });
assert.equal(unavailable.ok, false);
assert.equal(unavailable.error.code, "CAPABILITY_UNAVAILABLE");

const measured = await service.dispatch("mcbe_ui_measure_reference", { imagePath: image });
assert.equal(measured.ok, true);
assert.equal(measured.result.imagePath, image);

const relative = await service.dispatch("mcbe_ui_measure_reference", { imagePath: "reference.png" });
assert.equal(relative.ok, false);

const legacyCorrection = await service.dispatch("mcbe_ui_propose_corrections", { projectId: opened.projectId, validation: {}, maxDeltaUi: 2 });
assert.equal(legacyCorrection.ok, false);
assert.equal(legacyCorrection.error.code, "EVIDENCE_REQUIRED");
const validation = await service.dispatch("mcbe_ui_validate_layout", { projectId: opened.projectId });
assert.match(validation.evidenceId, /^evidence-/);
const stale = await service.dispatch("mcbe_ui_propose_corrections", { projectId: opened.projectId, evidenceIds: [validation.evidenceId], sourceRevision: "stale", maxDeltaUi: 2 });
assert.equal(stale.error.code, "STALE_SOURCE");
const correction = await service.dispatch("mcbe_ui_propose_corrections", { projectId: opened.projectId, evidenceIds: [validation.evidenceId], sourceRevision: opened.projectRevision, maxDeltaUi: 2 });
assert.equal(correction.ok, true);
assert.equal(correction.acceptedEvidence, 1);

const missingFont = await service.dispatch("mcbe_ui_measure_text", { projectId: opened.projectId, text: "ABC" });
assert.equal(missingFont.error.code, "CAPABILITY_UNAVAILABLE");

const unknown = await service.dispatch("not_a_tool", {});
assert.equal(unknown.ok, false);
assert.equal(unknown.error.code, "UNKNOWN_TOOL");

const rpRoot = join(temp, "rp");
await mkdir(join(rpRoot, "ui"), { recursive: true });
await writeFile(join(rpRoot, "ui", "_ui_defs.json"), JSON.stringify({ ui_defs: ["ui/demo.json"] }));
await writeFile(join(rpRoot, "ui", "demo.json"), JSON.stringify({
  namespace: "demo",
  screen: { type: "panel", size: [120, 60], controls: [{ "title": { type: "label", size: [80, 12], text: "fixture" } }] },
}));
const integrated = createMcbeUiService(await createLocalBackend());
const integratedOpen = await integrated.dispatch("mcbe_ui_open_project", { rpRoot });
assert.equal(integratedOpen.ok, true);
assert.equal(integratedOpen.controlCount, 1);
const integratedResolve = await integrated.dispatch("mcbe_ui_resolve_screen", { projectId: integratedOpen.projectId, control: "demo.screen", viewport: [480, 270] });
assert.equal(integratedResolve.ok, true);
assert.equal(integratedResolve.tree.qualified, "demo.screen");
assert.deepEqual(integratedResolve.layout.viewport, [480, 270]);

console.log("mcp-service: ok");
