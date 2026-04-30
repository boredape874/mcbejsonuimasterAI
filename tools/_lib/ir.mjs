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
  out.elements = (out.elements || []).map((el) => ({
    kind: "panel",
    anchor: "top_left",
    pos: [0, 0],
    z: 0,
    parent: "__root__",
    props: {},
    ...el,
  }));
  return out;
}
