// tools/_lib/ui-validator.mjs
// Rule-based validator for compiled Bedrock JSON UI nodes.
// Inspired by gamezaSRC/JSON-UI-Web-Editor (MIT) src/core/UIValidator.ts; rules ported to JS,
// driven by data/jsonui-spec.json so the catalog stays the single source of truth.

import { readJson } from "./fsx.mjs";
import { PATHS } from "./paths.mjs";

let _spec = null;

async function getSpec() {
  if (_spec) return _spec;
  _spec = await readJson(PATHS.jsonuiSpec);
  return _spec;
}

function isVar(v) {
  return typeof v === "string" && (v.startsWith("$") || v.startsWith("#"));
}

function pushErr(out, path, message, suggestion) {
  out.push({ severity: "error", path, message, ...(suggestion ? { suggestion } : {}) });
}
function pushWarn(out, path, message, suggestion) {
  out.push({ severity: "warning", path, message, ...(suggestion ? { suggestion } : {}) });
}
function pushInfo(out, path, message, suggestion) {
  out.push({ severity: "info", path, message, ...(suggestion ? { suggestion } : {}) });
}

function validateBindings(bindings, path, out, spec) {
  const okTypes = new Set(spec.binding_types);
  for (let i = 0; i < bindings.length; i++) {
    const b = bindings[i] || {};
    const p = `${path} > bindings[${i}]`;
    if (b.binding_type !== undefined && !isVar(b.binding_type) && !okTypes.has(b.binding_type)) {
      pushErr(out, p, `Invalid binding_type "${b.binding_type}"`, `Valid: ${[...okTypes].join(", ")}`);
    }
    if (b.binding_type === "collection" && !b.binding_collection_name) {
      pushWarn(out, p, "Collection binding missing binding_collection_name");
    }
    if (b.binding_type === "view") {
      if (!b.source_property_name) pushWarn(out, p, "View binding missing source_property_name");
      if (!b.target_property_name) pushWarn(out, p, "View binding missing target_property_name");
    }
  }
}

function validateNode(name, node, path, out, spec) {
  const here = `${path} > ${name}`;
  // @-extends references: skip type-rule checks but still walk children/bindings.
  const isExtends = name.includes("@");

  if (!isExtends) {
    if (node.type !== undefined && !isVar(node.type) && !spec.control_types.includes(node.type)) {
      pushErr(out, here, `Invalid type "${node.type}"`, `Valid: ${spec.control_types.join(", ")}`);
    }
    if (node.anchor_from !== undefined && !isVar(node.anchor_from) && !spec.anchors.includes(node.anchor_from)) {
      pushErr(out, here, `Invalid anchor_from "${node.anchor_from}"`, `Valid: ${spec.anchors.join(", ")}`);
    }
    if (node.anchor_to !== undefined && !isVar(node.anchor_to) && !spec.anchors.includes(node.anchor_to)) {
      pushErr(out, here, `Invalid anchor_to "${node.anchor_to}"`, `Valid: ${spec.anchors.join(", ")}`);
    }
    if (node.orientation !== undefined && !isVar(node.orientation) && !spec.orientations.includes(node.orientation)) {
      pushErr(out, here, `Invalid orientation "${node.orientation}"`);
    }
    if (node.font_size !== undefined && !isVar(node.font_size) && !spec.font_sizes.includes(node.font_size)) {
      pushWarn(out, here, `Invalid font_size "${node.font_size}"`);
    }
    if (node.text_alignment !== undefined && !isVar(node.text_alignment) && !spec.text_alignments.includes(node.text_alignment)) {
      pushWarn(out, here, `Invalid text_alignment "${node.text_alignment}"`);
    }
    if (typeof node.layer === "number" && node.layer > spec.rules.layer_warn_above) {
      pushWarn(out, here, `Layer ${node.layer} unusually high`,
        "Typical layer values are 0-50; high values may cause z-order issues.");
    }
    if (node.type === "grid" && !node.grid_item_template && (!Array.isArray(node.controls) || node.controls.length === 0)) {
      pushWarn(out, here, "Grid should have grid_item_template or controls[]");
    }
    if (node.type === "scroll_view" && !node.scrollbar_track_button && !node.scrollbar_touch_button) {
      pushInfo(out, here, "scroll_view has no scrollbar configuration");
    }
  }

  if (Array.isArray(node.bindings)) validateBindings(node.bindings, here, out, spec);
  if (Array.isArray(node.controls)) {
    for (const child of node.controls) {
      if (!child || typeof child !== "object") continue;
      const keys = Object.keys(child);
      if (keys.length !== 1) {
        pushErr(out, here, "child entry must be a single-key object");
        continue;
      }
      const childName = keys[0];
      const childNode = child[childName];
      if (!childNode || typeof childNode !== "object") continue;
      validateNode(childName, childNode, here, out, spec);
    }
  }
}

export async function validateUiFile(ui, filePath) {
  const spec = await getSpec();
  const issues = [];
  for (const [key, value] of Object.entries(ui)) {
    if (key === "namespace") continue;
    if (value && typeof value === "object") {
      validateNode(key, value, filePath, issues, spec);
    }
  }
  return issues;
}

export function partition(issues) {
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");
  const infos = issues.filter((i) => i.severity === "info");
  return { errors, warnings, infos };
}
