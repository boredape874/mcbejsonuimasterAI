// tools/_lib/ir.mjs
// IR loading + schema validation.

import { readFile } from "node:fs/promises";
import YAML from "yaml";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { PATHS } from "./paths.mjs";
import { readJson } from "./fsx.mjs";

let _validator = null;

async function getValidator() {
  if (_validator) return _validator;
  const schema = await readJson(PATHS.irSchema);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  _validator = ajv.compile(schema);
  return _validator;
}

export async function loadIr(path) {
  const raw = await readFile(path, "utf8");
  const ir = YAML.parse(raw);
  if (ir == null || typeof ir !== "object") {
    throw new Error(`IR file ${path} is empty or not an object`);
  }
  return ir;
}

export async function validateIr(ir) {
  const validate = await getValidator();
  const ok = validate(ir);
  return { ok, errors: ok ? [] : validate.errors || [] };
}

function estimateTextWidth(text, fontSize = "normal", scale = 1) {
  const base = fontSize === "small" ? 8 : fontSize === "large" ? 14 : 10;
  let width = 0;
  for (const ch of String(text || "")) {
    const code = ch.codePointAt(0);
    if (ch === "\n") continue;
    width += code > 0x2e80 ? base : base * 0.62;
  }
  return Math.ceil(width * scale);
}

function estimateTextHeight(text, fontSize = "normal", scale = 1) {
  const base = fontSize === "small" ? 8 : fontSize === "large" ? 14 : 10;
  const lines = String(text || "").split("\n").length;
  return Math.ceil(lines * base * scale * 1.25);
}

function clampSize(size, auto) {
  const min = auto.min || [0, 0];
  const max = auto.max || [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  return [
    Math.min(max[0], Math.max(min[0], Math.ceil(size[0]))),
    Math.min(max[1], Math.max(min[1], Math.ceil(size[1]))),
  ];
}

function aspectValue(auto) {
  if (typeof auto.aspect === "number" && auto.aspect > 0) return auto.aspect;
  if (Array.isArray(auto.aspect) && auto.aspect[0] > 0 && auto.aspect[1] > 0) {
    return auto.aspect[0] / auto.aspect[1];
  }
  if (Array.isArray(auto.source_size) && auto.source_size[0] > 0 && auto.source_size[1] > 0) {
    return auto.source_size[0] / auto.source_size[1];
  }
  return 1;
}

function collectionGridSize(el) {
  const c = el.collection || {};
  const dims = c.dimensions || c.grid_dimensions || [1, 1];
  const item = c.item_size || [0, 0];
  const gap = c.gap || [0, 0];
  return [
    dims[0] * item[0] + Math.max(0, dims[0] - 1) * gap[0],
    dims[1] * item[1] + Math.max(0, dims[1] - 1) * gap[1],
  ];
}

function applyAutoSize(el) {
  const auto = el.auto_size;
  if (!auto) return el;
  const axis = auto.axis || "both";
  let measured = null;

  if (auto.mode === "text") {
    const props = el.props || {};
    const text = auto.text ?? props.text ?? "";
    const fontSize = auto.font_size || props.font_size || "normal";
    const scale = Number(auto.font_scale_factor ?? props.font_scale_factor ?? 1);
    const pad = auto.padding || [0, 0];
    measured = [
      estimateTextWidth(text, fontSize, scale) + pad[0] * 2,
      estimateTextHeight(text, fontSize, scale) + pad[1] * 2,
    ];
  }

  if (auto.mode === "image_aspect") {
    const aspect = aspectValue(auto);
    const source = auto.source_size || [0, 0];
    const scale = Number(auto.scale ?? 1);
    const cur = el.size || [0, 0];
    if (cur[0] > 0 && cur[1] <= 0) measured = [cur[0], cur[0] / aspect];
    else if (cur[0] <= 0 && cur[1] > 0) measured = [cur[1] * aspect, cur[1]];
    else if (source[0] > 0 && source[1] > 0) measured = [source[0] * scale, source[1] * scale];
    else measured = cur;
  }

  if (auto.mode === "collection_grid") {
    measured = collectionGridSize(el);
  }

  if (!measured) return el;
  const next = [...el.size];
  const clamped = clampSize(measured, auto);
  if (axis === "both" || axis === "width") next[0] = clamped[0];
  if (axis === "both" || axis === "height") next[1] = clamped[1];
  return { ...el, size: next };
}

export function applyDefaults(ir) {
  const out = { ...ir };
  out.namespace = out.namespace || out.screen;
  out.base_resolution = out.base_resolution || [1920, 1080];
  out.gui_scale = out.gui_scale ?? 3;
  out.units = { allowPercent: false, ...(out.units || {}) };
  out.constraints = out.constraints || [];
  out.root = {
    size: [out.base_resolution[0], out.base_resolution[1]],
    anchor: "top_left",
    pos: [0, 0],
    ...(out.root || {}),
  };
  out.elements = (out.elements || [])
    .map((el) => ({
      kind: "panel",
      anchor: "top_left",
      pos: [0, 0],
      z: 0,
      parent: "__root__",
      props: {},
      ...el,
    }))
    .map(applyAutoSize);
  return out;
}
