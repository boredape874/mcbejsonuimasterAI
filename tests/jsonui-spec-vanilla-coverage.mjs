// data/jsonui-spec.json must accept every property, control type, renderer,
// animation type, easing, binding type and binding condition that the pinned
// official sample files use. Any upstream sync that introduces new vocabulary
// fails here until the spec (and docs/48) are extended with evidence.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateUiFile } from "../tools/_lib/ui-validator.mjs";
import { parseUiSource, DEFAULT_RUNTIME_DIALECT } from "../tools/_lib/json-dialect.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SAMPLES = resolve(ROOT, "references", "official", "bedrock-samples-ui");
const spec = JSON.parse(await readFile(resolve(ROOT, "data", "jsonui-spec.json"), "utf8"));
const enumSets = {
  renderer: new Set(spec.renderer_types),
  anim_type: new Set(spec.animation_types),
  easing: new Set(spec.easings),
  binding_type: new Set(spec.binding_types),
  binding_condition: new Set(spec.binding_conditions),
  font_type: new Set(spec.font_types),
  font_size: new Set(spec.font_sizes),
  text_alignment: new Set(spec.text_alignments),
  clip_direction: new Set(spec.clip_directions),
  grid_rescaling_type: new Set(spec.grid_rescaling_types),
  grid_fill_direction: new Set(spec.grid_fill_directions),
  orientation: new Set(spec.orientations),
  anchor_from: new Set(spec.anchors),
  anchor_to: new Set(spec.anchors),
  operation: new Set(spec.modification_operations),
  mapping_type: new Set(spec.mapping_types),
  input_mode_condition: new Set(spec.input_mode_conditions),
  focus_navigation_mode_left: new Set(spec.focus_navigation_modes),
  focus_navigation_mode_right: new Set(spec.focus_navigation_modes),
  focus_navigation_mode_up: new Set(spec.focus_navigation_modes),
  focus_navigation_mode_down: new Set(spec.focus_navigation_modes),
};
const literal = (value) => typeof value === "string" && value !== "" && !value.startsWith("$") && !value.startsWith("#") && !value.startsWith("@");
const missingEnums = [];
const unknownEntryKeys = [];
const buttonMappingKeys = new Set(spec.button_mapping_entry_keys);
const variablesEntryKeys = new Set([...spec.variables_entry_keys, ...Object.values(spec.properties).flat()]);
function walk(node, file) {
  if (Array.isArray(node)) { for (const item of node) walk(item, file); return; }
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    if (enumSets[key] && literal(value) && !enumSets[key].has(value)) missingEnums.push({ file, key, value });
    if (key === "button_mappings" && Array.isArray(value)) for (const entry of value) if (entry && typeof entry === "object") {
      for (const entryKey of Object.keys(entry)) if (!buttonMappingKeys.has(entryKey)) unknownEntryKeys.push({ file, array: "button_mappings", key: entryKey });
      if (literal(entry.scope) && !spec.button_mapping_scopes.includes(entry.scope)) missingEnums.push({ file, key: "button_mappings.scope", value: entry.scope });
    }
    if (key === "variables" && Array.isArray(value)) for (const entry of value) if (entry && typeof entry === "object") for (const entryKey of Object.keys(entry)) if (!entryKey.startsWith("$") && !variablesEntryKeys.has(entryKey)) unknownEntryKeys.push({ file, array: "variables", key: entryKey });
    walk(value, file);
  }
}

const files = (await readdir(SAMPLES)).filter((name) => name.endsWith(".json")).sort();
assert.ok(files.length >= 12, "expected the selected official sample files");
const unknownProperties = new Map();
const invalidValues = [];
for (const name of files) {
  const text = (await readFile(resolve(SAMPLES, name), "utf8")).replace(/^﻿/, "");
  const { document } = parseUiSource(text, { kind: "runtime", dialect: DEFAULT_RUNTIME_DIALECT });
  if (name === "_ui_defs.json") { assert.ok(Array.isArray(document.ui_defs) && document.ui_defs.length > 100); continue; }
  if (name !== "_global_variables.json") assert.equal(typeof document.namespace, "string", `${name} must declare a namespace`);
  walk(document, name);
  for (const issue of await validateUiFile(document, name)) {
    if (issue.severity !== "error") continue;
    const unknown = /^Unknown property "(.+)"$/.exec(issue.message);
    if (unknown) { unknownProperties.set(unknown[1], (unknownProperties.get(unknown[1]) || 0) + 1); continue; }
    if (/^Invalid (type|anchor_from|anchor_to|orientation|binding_type) /.test(issue.message)) invalidValues.push({ file: name, path: issue.path, message: issue.message });
  }
}
assert.deepEqual([...unknownProperties.entries()], [], "pinned vanilla files use properties that data/jsonui-spec.json does not list; add them with evidence");
assert.deepEqual(invalidValues, [], "pinned vanilla files use enum values that data/jsonui-spec.json rejects");
assert.deepEqual(missingEnums, [], "pinned vanilla files use enum values missing from data/jsonui-spec.json");
assert.deepEqual(unknownEntryKeys, [], "pinned vanilla files use button_mappings/variables entry keys that data/jsonui-spec.json does not list");

// Documented-but-unverified names from the official creator reference and the schemas repository
// (nine_slice_* and slider_range) must stay out of the accepted vocabulary until a vanilla file uses them.
for (const name of spec._confirmed_extensions.docs_cross_check_2026_10_03.microsoftdocs_minecraft_creator_reference.documented_but_absent_from_vanilla) {
  assert.ok(!Object.values(spec.properties).flat().includes(name), `${name} is documented by the creator reference but absent from vanilla; it must not be listed as accepted`);
}
assert.ok(spec.button_mapping_entry_keys.includes("from_button_id") && spec.button_mapping_entry_keys.includes("ignore_input_scope"));
assert.deepEqual(spec.variables_entry_keys, ["requires"]);

// Guard the two regressions that the 1.26.50 sync exposed.
assert.ok(spec.control_types.includes("tooltip_trigger"));
assert.ok(spec.font_sizes.includes("medium"));
assert.ok(Object.values(spec.properties).flat().includes("tts_skip_enumeration"));
const globals = parseUiSource((await readFile(resolve(SAMPLES, "_global_variables.json"), "utf8")).replace(/^﻿/, ""), { kind: "runtime", dialect: DEFAULT_RUNTIME_DIALECT }).document;
assert.deepEqual((await validateUiFile(globals, "_global_variables.json")).filter((issue) => issue.severity === "error"), [], "top-level $variable arrays must not be reported as unknown properties");
// Optional: when the full sparse mirror is present locally, every vanilla ui file must pass too.
const mirrorUi = resolve(ROOT, "references", "upstreams", "bedrock-samples", "resource_pack", "ui");
let mirrorFiles = 0;
try {
  const { readdir: readDir } = await import("node:fs/promises");
  async function walk(dir) { const out = []; for (const entry of await readDir(dir, { withFileTypes: true })) { const path = resolve(dir, entry.name); if (entry.isDirectory()) out.push(...await walk(path)); else if (entry.name.endsWith(".json")) out.push(path); } return out; }
  const all = await walk(mirrorUi);
  const mirrorUnknown = new Map();
  for (const file of all) {
    if (file.endsWith("_ui_defs.json")) continue;
    const { document } = parseUiSource((await readFile(file, "utf8")).replace(/^\uFEFF/, ""), { kind: "runtime", dialect: DEFAULT_RUNTIME_DIALECT });
    for (const issue of await validateUiFile(document, file)) {
      const unknown = issue.severity === "error" && /^(Unknown property|Invalid type) "(.+)"$/.exec(issue.message);
      if (unknown) mirrorUnknown.set(unknown[2], (mirrorUnknown.get(unknown[2]) || 0) + 1);
    }
    mirrorFiles++;
  }
  assert.deepEqual([...mirrorUnknown.entries()], [], "mirror vanilla files use vocabulary that data/jsonui-spec.json does not list");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
console.log(`jsonui-spec covers ${files.length} pinned vanilla files${mirrorFiles ? ` and ${mirrorFiles} mirror files` : " (no local mirror)"}`);
