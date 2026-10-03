// data/presets-catalog.json feeds the IR `extends` feature: the compiler emits
// "id@<ref>" verbatim. Every ref must therefore be a control that the pinned
// official sample files define, and every listed $variable must be consumed
// somewhere in that control's vanilla inheritance chain.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseVanillaFile } from "../tools/_lib/vanilla-names.mjs";
import { SELECTED_FILES } from "../tools/sync-bedrock-samples-ui.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SAMPLES = resolve(ROOT, "references", "official", "bedrock-samples-ui");
const catalog = JSON.parse(await readFile(resolve(ROOT, "data", "presets-catalog.json"), "utf8"));

// namespace -> { controlName -> { parent, text } }
const namespaces = new Map();
for (const name of SELECTED_FILES) {
  if (name === "_ui_defs.json" || name === "_global_variables.json") continue;
  const { text, document } = await parseVanillaFile(resolve(SAMPLES, name));
  if (typeof document.namespace !== "string") continue;
  const controls = namespaces.get(document.namespace) || new Map();
  for (const key of Object.keys(document)) {
    if (key === "namespace") continue;
    const [control, parent] = key.split("@");
    // Slice the raw text of this top-level control so nested child references stay visible.
    const start = text.search(new RegExp(`^  "${control.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:@[^"]*)?"\\s*:`, "m"));
    let body = "";
    if (start >= 0) {
      let depth = 0, index = text.indexOf("{", start);
      for (let cursor = index; cursor < text.length; cursor++) {
        if (text[cursor] === "{") depth++;
        else if (text[cursor] === "}") { depth--; if (depth === 0) { body = text.slice(start, cursor + 1); break; } }
      }
    }
    controls.set(control, { parent: parent || null, body });
  }
  namespaces.set(document.namespace, controls);
}

function chainVariables(namespace, control, seen = new Set()) {
  const key = `${namespace}.${control}`;
  if (seen.has(key) || seen.size > 64) return new Set();
  seen.add(key);
  const entry = namespaces.get(namespace)?.get(control);
  if (!entry) return new Set();
  const variables = new Set(entry.body.match(/\$[A-Za-z0-9_]+/g) || []);
  // Follow @parent, nested child@ns.control, and template names assigned to
  // $variables (e.g. "$button_content|default": "common_buttons.new_ui_binding_button_label").
  const references = [
    entry.parent,
    ...[...entry.body.matchAll(/"[A-Za-z0-9_]+@([A-Za-z0-9_.]+)"/g)].map((match) => match[1]),
    ...[...entry.body.matchAll(/"\$[A-Za-z0-9_]+(?:\|default)?"\s*:\s*"([a-z0-9_]+\.[a-z0-9_]+)"/g)].map((match) => match[1]),
  ].filter(Boolean);
  for (const reference of references) {
    if (reference.startsWith("$")) continue;
    const [refNamespace, refControl] = reference.includes(".") ? reference.split(/\.(.+)/) : [namespace, reference];
    for (const variable of chainVariables(refNamespace, refControl, seen)) variables.add(variable);
  }
  return variables;
}

const groups = ["common_refs", "common_dialogs_refs", "common_buttons_refs", "server_form_refs"];
let checked = 0;
for (const group of groups) {
  assert.ok(Array.isArray(catalog[group]) && catalog[group].length, `${group} must list presets`);
  for (const entry of catalog[group]) {
    const [namespace, control] = entry.ref.split(/\.(.+)/);
    assert.ok(namespaces.get(namespace)?.has(control), `${entry.ref} is not defined in the pinned official sample files (${[...namespaces.keys()].join(", ")})`);
    const variables = chainVariables(namespace, control);
    for (const variable of entry.common_variables || []) {
      assert.ok(variables.has(variable), `${entry.ref} does not consume ${variable} anywhere in its vanilla inheritance chain`);
    }
    checked++;
  }
}
const refs = groups.flatMap((group) => catalog[group].map((entry) => entry.ref));
const listedVariables = groups.flatMap((group) => catalog[group].flatMap((entry) => entry.common_variables || []));
assert.ok(!refs.includes("common.cancel_button"), "common.cancel_button is not a vanilla control");
assert.ok(!listedVariables.includes("$button1_panel") && !listedVariables.includes("$button2_panel"), "$button1_panel/$button2_panel are not vanilla variables");
assert.ok(catalog.common_refs.some((entry) => entry.ref === "common.close_button"));
assert.ok(catalog.common_buttons_refs.some((entry) => entry.ref === "common_buttons.light_text_button"));
console.log(`presets catalog: ${checked} refs and their variables verified against the pinned vanilla samples`);
