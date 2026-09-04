import { readdir, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const evalRoot = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(evalRoot, "..");
const examplesRoot = join(repoRoot, "examples", "v2");
const STRETCHABLE = new Set(["panel", "card", "page", "button_default", "button_hover", "button_pressed"]);
const COLOR_KEYS = new Set(["color", "shadow_color", "outline_color", "locked_color"]);
const IGNORED_DIRECT_CONTROLS = new Set(["background", "payload_store"]);
const errors = [];
const warnings = [];

function fail(path, message) {
  errors.push({ path, message });
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(root) {
  const output = [];
  async function visit(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const child = join(path, entry.name);
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile()) output.push(child);
    }
  }
  await visit(root);
  return output;
}

function walk(value, path, visitor) {
  visitor(value, path);
  if (Array.isArray(value)) {
    value.forEach((child, index) => walk(child, `${path}[${index}]`, visitor));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => walk(child, `${path}.${key}`, visitor));
  }
}

function collectTextureRefs(value) {
  const refs = new Set();
  walk(value, "$", (node) => {
    if (typeof node === "string" && node.startsWith("textures/")) refs.add(node.replace(/\.png$/i, ""));
  });
  return refs;
}

function directControlIds(screenJson) {
  const shell = screenJson?.screen?.controls?.[0]?.shell;
  if (!shell || !Array.isArray(shell.controls)) return [];
  return shell.controls.flatMap((entry) => Object.keys(entry).map((key) => key.split("@", 1)[0]))
    .filter((id) => !IGNORED_DIRECT_CONTROLS.has(id));
}

function inspectUiJson(value, path) {
  walk(value, "$", (node, nodePath) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (node.type === "label" && !Object.hasOwn(node, "size")) fail(path, `${nodePath}: label is missing explicit size`);
    if (node.type === "button") {
      for (const state of ["default_control", "hover_control", "pressed_control"]) {
        if (!Object.hasOwn(node, state)) fail(path, `${nodePath}: button is missing ${state}`);
      }
      const stateNames = new Set((node.controls ?? []).flatMap((entry) => Object.keys(entry)));
      for (const state of [node.default_control, node.hover_control, node.pressed_control]) {
        if (state && !stateNames.has(state)) fail(path, `${nodePath}: button state control ${state} does not exist`);
      }
    }
    for (const [key, child] of Object.entries(node)) {
      if (!COLOR_KEYS.has(key) && !key.endsWith("_color")) continue;
      if (!Array.isArray(child)) continue;
      if (!child.every((component) => typeof component === "number" && component >= 0 && component <= 1)) {
        fail(path, `${nodePath}.${key}: JSON UI color components must be normalized to 0..1`);
      }
    }
  });
}

async function validatePng(path) {
  const buffer = await readFile(path);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) {
    fail(path, "invalid PNG signature");
    return;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width < 1 || height < 1) fail(path, "invalid PNG dimensions");
}

async function validateExample(exampleDir) {
  const root = join(examplesRoot, exampleDir);
  const rp = join(root, "RP");
  const validationPath = join(root, "validation.json");
  const validation = JSON.parse(await readFile(validationPath, "utf8"));
  for (const required of validation.requiredFiles ?? []) {
    const target = join(root, required);
    if (!(await exists(target))) fail(validationPath, `missing required file: ${required}`);
  }
  const evidence = join(root, validation.redistribution?.licenseEvidence ?? "");
  if (!(await exists(evidence))) fail(validationPath, "licenseEvidence does not resolve");

  const uiDefsPath = join(rp, "ui", "_ui_defs.json");
  const uiDefs = JSON.parse(await readFile(uiDefsPath, "utf8"));
  for (const target of uiDefs.ui_defs ?? []) {
    if (!(await exists(join(rp, target)))) fail(uiDefsPath, `unresolved _ui_defs entry: ${target}`);
  }

  const files = await listFiles(root);
  const jsonFiles = files.filter((path) => extname(path).toLowerCase() === ".json");
  const uiValues = [];
  for (const path of jsonFiles) {
    let value;
    try {
      value = JSON.parse(await readFile(path, "utf8"));
    } catch (error) {
      fail(path, `JSON parse failed: ${error.message}`);
      continue;
    }
    if (path.includes(`${join("RP", "ui")}`)) {
      inspectUiJson(value, path);
      uiValues.push(value);
    }
  }

  for (const ref of new Set(uiValues.flatMap((value) => [...collectTextureRefs(value)]))) {
    const png = join(rp, `${ref}.png`);
    if (!(await exists(png))) {
      fail(root, `missing texture: ${ref}.png`);
      continue;
    }
    const stem = ref.split("/").at(-1);
    if (STRETCHABLE.has(stem) && !(await exists(join(rp, `${ref}.json`)))) {
      fail(root, `missing same-stem nine-slice metadata: ${ref}.json`);
    }
  }

  for (const png of files.filter((path) => extname(path).toLowerCase() === ".png")) await validatePng(png);
  for (const script of files.filter((path) => [".js", ".mjs"].includes(extname(path).toLowerCase()))) {
    const check = spawnSync(process.execPath, ["--check", script], { encoding: "utf8" });
    if (check.status !== 0) fail(script, check.stderr.trim() || "JavaScript syntax check failed");
  }

  const featurePath = join(rp, validation.requiredFiles.find((path) => path.includes("/features/"))?.replace(/^RP\//, "") ?? "");
  if (await exists(featurePath)) {
    const feature = JSON.parse(await readFile(featurePath, "utf8"));
    const visibleIds = directControlIds(feature);
    const ir = parseYaml(await readFile(join(root, "ir.yaml"), "utf8"));
    const irIds = new Set((ir.elements ?? []).map((element) => element.id));
    for (const id of visibleIds) if (!irIds.has(id)) fail(join(root, "ir.yaml"), `visible screen control is missing from IR: ${id}`);
  }
}

async function main() {
  const exampleDirs = (await readdir(examplesRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^\d\d-/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (exampleDirs.length !== 7) fail(examplesRoot, `expected 7 public examples, found ${exampleDirs.length}`);
  for (const exampleDir of exampleDirs) await validateExample(exampleDir);

  const allText = (await listFiles(examplesRoot)).filter((path) => [".json", ".js", ".mjs", ".md", ".yaml"].includes(extname(path).toLowerCase()));
  for (const path of allText) {
    const source = await readFile(path, "utf8");
    if (/[A-Z]:[\\/](?:Users|개발)/i.test(source)) fail(path, "public example contains an absolute local path");
  }

  const report = {
    schemaVersion: 1,
    ok: errors.length === 0,
    examples: exampleDirs.length,
    errors,
    warnings,
    runtime: "not-run"
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
