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
};
const literal = (value) => typeof value === "string" && !value.startsWith("$") && !value.startsWith("#") && !value.startsWith("@");
const missingEnums = [];
function walk(node, file) {
  if (Array.isArray(node)) { for (const item of node) walk(item, file); return; }
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    if (enumSets[key] && literal(value) && !enumSets[key].has(value)) missingEnums.push({ file, key, value });
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

// Guard the two regressions that the 1.26.50 sync exposed.
assert.ok(spec.control_types.includes("tooltip_trigger"));
assert.ok(spec.font_sizes.includes("medium"));
assert.ok(Object.values(spec.properties).flat().includes("tts_skip_enumeration"));
const globals = parseUiSource((await readFile(resolve(SAMPLES, "_global_variables.json"), "utf8")).replace(/^﻿/, ""), { kind: "runtime", dialect: DEFAULT_RUNTIME_DIALECT }).document;
assert.deepEqual((await validateUiFile(globals, "_global_variables.json")).filter((issue) => issue.severity === "error"), [], "top-level $variable arrays must not be reported as unknown properties");
console.log(`jsonui-spec covers ${files.length} pinned vanilla files`);
