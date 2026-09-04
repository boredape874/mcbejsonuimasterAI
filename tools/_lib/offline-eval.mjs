import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { writeJsonAtomic } from "./fsx.mjs";
import { spawn } from "node:child_process";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const slash = (value) => value.replaceAll("\\", "/");
async function exists(path) { try { await stat(path); return true; } catch { return false; } }
async function json(path) { return JSON.parse(await readFile(path, "utf8")); }
async function files(root) {
  const output = [];
  async function walk(dir) { for (const item of await readdir(dir, { withFileTypes: true })) { const path = join(dir, item.name); if (item.isDirectory()) await walk(path); else output.push(path); } }
  if (await exists(root)) await walk(root);
  return output.sort();
}
function spawnNode(root, args) {
  return new Promise((done) => { const child = spawn(process.execPath, args, { cwd: root }); let stdout = "", stderr = ""; child.stdout.on("data", (d) => { stdout += d; }); child.stderr.on("data", (d) => { stderr += d; }); child.on("close", (code) => done({ code, stdout, stderr })); });
}
function check(id, ok, details = undefined) { return { id, ok: Boolean(ok), ...(details === undefined ? {} : { details }) }; }
function walkObject(value, visitor, path = "$") {
  if (!value || typeof value !== "object") return;
  visitor(value, path);
  if (Array.isArray(value)) value.forEach((child, i) => walkObject(child, visitor, `${path}[${i}]`));
  else for (const [key, child] of Object.entries(value)) walkObject(child, visitor, `${path}.${key}`);
}
function namedControls(value, output = []) {
  if (!value || typeof value !== "object") return output;
  for (const entry of value.controls || []) for (const [name, child] of Object.entries(entry)) { output.push({ id: name.split("@")[0].split(".").pop(), node: child }); namedControls(child, output); }
  for (const [name, child] of Object.entries(value)) if (name !== "controls" && name !== "namespace" && child?.type) { output.push({ id: name.split("@")[0].split(".").pop(), node: child }); namedControls(child, output); }
  return output;
}

const GOLDEN_POLICY = { engine: "pixelmatch", threshold: 0.15, maxDiffRatio: 0.001, fontPolicy: "platform text antialiasing is tolerated; geometry and texture layers remain deterministic" };
async function comparePng(actualPath, goldenPath) {
  if (!(await exists(goldenPath))) return { ok: false, reason: "missing_golden" };
  const actual = PNG.sync.read(await readFile(actualPath)), golden = PNG.sync.read(await readFile(goldenPath));
  if (actual.width !== golden.width || actual.height !== golden.height) return { ok: false, reason: "dimension_mismatch", actual: [actual.width, actual.height], golden: [golden.width, golden.height] };
  const pixels = pixelmatch(actual.data, golden.data, null, actual.width, actual.height, { threshold: GOLDEN_POLICY.threshold }), total = actual.width * actual.height, ratio = pixels / total;
  return { ok: ratio <= GOLDEN_POLICY.maxDiffRatio, pixels, total, ratio };
}

async function structuralChecks(root, exampleRoot, validation, fixtures, task) {
  const checks = [], exampleFiles = await files(exampleRoot), jsonFiles = exampleFiles.filter((p) => extname(p) === ".json"), jsFiles = exampleFiles.filter((p) => extname(p) === ".js");
  const parsed = new Map(), parseErrors = [];
  for (const path of jsonFiles) try { parsed.set(path, await json(path)); } catch (error) { parseErrors.push({ path: slash(relative(root, path)), error: error.message }); }
  checks.push(check("json_parse", parseErrors.length === 0, parseErrors));
  const jsErrors = [];
  for (const path of jsFiles) { const result = await spawnNode(root, ["--check", path]); if (result.code) jsErrors.push({ path: slash(relative(root, path)), output: (result.stderr || result.stdout).trim() }); }
  checks.push(check("javascript_syntax", jsErrors.length === 0, jsErrors));

  const defsPath = join(exampleRoot, "RP", "ui", "_ui_defs.json"), defsMissing = [];
  const defs = parsed.get(defsPath) || [...parsed.entries()].find(([path]) => slash(path).endsWith("/RP/ui/_ui_defs.json"))?.[1];
  if (defs) {
    for (const entry of defs.ui_defs || []) if (!(await exists(join(exampleRoot, "RP", entry)))) defsMissing.push(entry);
  } else {
    defsMissing.push("RP/ui/_ui_defs.json");
  }
  checks.push(check("ui_defs_resolution", defsMissing.length === 0, defsMissing));

  const manifestIssues = [];
  for (const pack of ["RP", "BP"]) {
    const manifestPath = join(exampleRoot, pack, "manifest.json"), manifest = parsed.get(manifestPath);
    if (!manifest?.header?.uuid || !Array.isArray(manifest.modules)) manifestIssues.push(`${pack}/manifest.json missing header/modules`);
    for (const module of manifest?.modules || []) if (module.entry && !(await exists(join(exampleRoot, pack, module.entry)))) manifestIssues.push(`${pack}/${module.entry}`);
  }
  checks.push(check("manifest_entries", manifestIssues.length === 0, manifestIssues));

  const textureIssues = [], ninesliceIssues = [];
  for (const [path, data] of parsed) if (slash(path).includes("/RP/ui/") && basename(path) !== "_ui_defs.json") walkObject(data, (node, at) => {
    if (node.type !== "image" || typeof node.texture !== "string" || node.texture.startsWith("#") || node.texture.includes("$")) return;
    const texture = join(exampleRoot, "RP", `${node.texture}.png`), sidecar = join(exampleRoot, "RP", `${node.texture}.json`);
    if (!exampleFiles.includes(texture)) textureIssues.push({ file: slash(relative(exampleRoot, path)), at, texture: node.texture });
    const stretchable = node.nineslice_size != null || (Array.isArray(node.size) && node.size.some((v) => typeof v === "string" && v.includes("%"))) || /(?:panel|card|button|page)/i.test(basename(node.texture));
    if (stretchable && !exampleFiles.includes(sidecar)) ninesliceIssues.push({ texture: node.texture, reason: "missing_sidecar" });
    else if (stretchable) { const meta = parsed.get(sidecar); if (!meta || meta.nineslice_size == null || !Array.isArray(meta.base_size)) ninesliceIssues.push({ texture: node.texture, reason: "invalid_sidecar" }); }
  });
  checks.push(check("local_textures", textureIssues.length === 0, textureIssues));
  checks.push(check("nineslice_sidecars", ninesliceIssues.length === 0, ninesliceIssues));

  const labels = [], colors = [];
  for (const [path, data] of parsed) if (slash(path).includes("/RP/ui/") && basename(path) !== "_ui_defs.json") walkObject(data, (node, at) => {
    if (node.type === "label" && !Array.isArray(node.size)) labels.push({ file: slash(relative(exampleRoot, path)), at });
    for (const [key, value] of Object.entries(node)) if (/color/i.test(key) && Array.isArray(value) && value.every(Number.isFinite) && value.some((part) => part < 0 || part > 1)) colors.push({ file: slash(relative(exampleRoot, path)), at: `${at}.${key}`, value });
  });
  checks.push(check("label_explicit_size", labels.length === 0, labels));
  checks.push(check("normalized_colors", colors.length === 0, colors));

  const taskIssues = [];
  if (!Array.isArray(task.profiles) || !task.profiles.some((p) => p.startsWith("pc_")) || !task.profiles.some((p) => p.startsWith("touch_"))) taskIssues.push("task must declare PC and touch profiles");
  for (const fixture of task.fixtures || []) if (!(await exists(join(root, fixture)))) taskIssues.push(`missing task fixture ${fixture}`);
  for (const required of ["all JSON files parse", "all JavaScript files pass syntax check", "all labels declare explicit size"]) if (!(task.invariants || []).includes(required)) taskIssues.push(`missing invariant: ${required}`);
  if (!Number.isFinite(task.geometryToleranceUiUnits)) taskIssues.push("missing geometry tolerance");
  checks.push(check("task_contract", taskIssues.length === 0, taskIssues));

  const requiredStates = fixtures.buttons.requiredStates || [], buttons = [];
  for (const [path, data] of parsed) if (slash(path).includes("/RP/ui/")) walkObject(data, (node, at) => { if (node.type === "button") buttons.push({ node, at }); });
  const stateIssues = [];
  for (const { node, at } of buttons) for (const state of requiredStates) if (!node[`${state}_control`]) stateIssues.push({ at, missing: `${state}_control` });
  checks.push(check("button_fixture_states", buttons.length === 0 || stateIssues.length === 0, stateIssues));
  const range = fixtures.colors.componentRange || {}, expectedFailure = fixtures.colors.expectedFailures?.[0]?.value || [];
  checks.push(check("color_fixture_contract", range.minimum === 0 && range.maximum === 1 && expectedFailure.some((v) => v > 1), { range, expectedFailure }));

  const protocolIssues = [];
  if (!validation.protocol?.token || !validation.protocol?.sender || !validation.protocol?.uiEntry) protocolIssues.push("validation.protocol incomplete");
  else for (const role of ["sender", "uiEntry"]) {
    const path = join(exampleRoot, validation.protocol[role]);
    if (!(await exists(path))) protocolIssues.push(`${role} missing: ${validation.protocol[role]}`);
    else if (!(await readFile(path, "utf8")).includes(validation.protocol.token)) protocolIssues.push(`${role} does not contain token ${validation.protocol.token}`);
  }
  if (validation.protocol?.sender) {
    const senderText = await readFile(join(exampleRoot, validation.protocol.sender), "utf8").catch(() => "");
    const formRoute = /new\s+ActionFormData\s*\(/.test(senderText) && /\.title\s*\(/.test(senderText) && /\.show\s*\(/.test(senderText);
    const hudRoute = /onScreenDisplay\.(?:setTitle|setActionBar)\s*\(/.test(senderText) && /system\.run(?:Interval|Timeout)\s*\(/.test(senderText);
    if (task.surface === "hud" ? !hudRoute : !formRoute) protocolIssues.push(`sender lacks ${task.surface === "hud" ? "HUD title/actionbar" : "ActionFormData title/show"} route structure`);
  }
  checks.push(check("protocol_sender_ui", protocolIssues.length === 0, protocolIssues));

  const fixtureCases = fixtures.text.cases || [], stringValues = Object.values(validation.stringCases || {}), fixtureIssues = [];
  for (const wanted of ["long_ko_130", "long_en"]) { const item = fixtureCases.find((entry) => entry.id === wanted); if (!item) fixtureIssues.push(`missing fixture ${wanted}`); else if (!stringValues.includes(item.text)) fixtureIssues.push(`${wanted} is not represented in validation.stringCases`); }
  checks.push(check("long_ko_en_fixtures", fixtureIssues.length === 0, fixtureIssues));

  const leakIssues = [];
  for (const path of exampleFiles.filter((p) => [".json", ".js", ".yaml", ".yml", ".md"].includes(extname(p)))) {
    const text = await readFile(path, "utf8");
    if (/baccarat/i.test(text)) leakIssues.push({ path: slash(relative(root, path)), kind: "baccarat" });
    if (/[A-Za-z]:\\(?:Users|개발빠른)\\/i.test(text) || /\/Users\/[^/]+\//.test(text)) leakIssues.push({ path: slash(relative(root, path)), kind: "absolute_local_path" });
  }
  checks.push(check("forbidden_content_leaks", leakIssues.length === 0, leakIssues));
  return checks;
}

export async function evaluateOffline({ root, taskManifest, taskId = null, reportPath, updateGoldens = false }) {
  const manifest = await json(resolve(root, taskManifest)), selected = taskId ? manifest.tasks.filter((task) => task.id === taskId) : manifest.tasks;
  if (taskId && selected.length !== 1) throw new Error(`unknown task: ${taskId}`);
  const fixtures = {
    text: await json(join(root, "evals", "fixtures", "text-cases.json")),
    buttons: await json(join(root, "evals", "fixtures", "button-states.json")),
    colors: await json(join(root, "evals", "fixtures", "color-ranges.json")),
  };
  const tasks = [];
  for (const task of selected) {
    const exampleRoot = join(root, task.example), validation = await json(join(exampleRoot, "validation.json")), outDir = join(root, "workspace", "_eval_offline", task.id);
    await rm(outDir, { recursive: true, force: true }); await mkdir(outDir, { recursive: true });
    const checks = await structuralChecks(root, exampleRoot, validation, fixtures, task);
    const pipeline = await spawnNode(root, ["tools/run.mjs", join(exampleRoot, "ir.yaml"), "--out", outDir]);
    checks.push(check("ir_validate_solve_compile", pipeline.code === 0, pipeline.code ? (pipeline.stderr || pipeline.stdout).slice(-2000) : undefined));
    if (pipeline.code === 0) {
      const featureEntry = validation.requiredFiles?.find((path) => /^RP\/ui\/features\/.+\.json$/.test(path));
      const actualUi = featureEntry ? join(exampleRoot, featureEntry) : join(outDir, "ui.json");
      const preview = await spawnNode(root, ["tools/preview.mjs", actualUi, join(outDir, "solved.json"), "--out-dir", outDir, "--strict", "--report", join(outDir, "preview-report.json")]);
      const previewReport = await json(join(outDir, "preview-report.json"));
      const expected = ["preview-pc-default.png", "preview-pc-hover.png", "preview-pc-pressed.png", "preview-touch-default.png", "preview-touch-hover.png", "preview-touch-pressed.png", "preview-contact-sheet.png", "preview.png"];
      const requestedProfiles = task.profiles.map((item) => item.startsWith("pc_") ? "pc" : item.startsWith("touch_") ? "touch" : null).filter(Boolean);
      checks.push(check("preview_matrix_contact_sheet", preview.code === 0 && previewReport.imageRenderer.enabled && requestedProfiles.every((profile) => ["default", "hover", "pressed"].every((state) => previewReport.outputs.includes(`preview-${profile}-${state}.png`))) && previewReport.outputs.includes("preview-contact-sheet.png"), previewReport));
      checks.push(check("unsupported_diagnostics", previewReport.unsupported.length === 0 && previewReport.diagnostics.length === 0, { unsupported: previewReport.unsupported, diagnostics: previewReport.diagnostics }));
      const validationReport = await json(join(outDir, "report.json")), overflow = validationReport.warnings.filter((item) => /outside parent|overflow|clipping/i.test(item.message || ""));
      checks.push(check("overflow_diagnostics", overflow.length === 0, overflow));
      const solved = await json(join(outDir, "solved.json")), actualUiText = JSON.stringify(await json(actualUi));
      const mappingMissing = (solved.elements || []).map((item) => item.id).filter((id) => !actualUiText.includes(`\"${id}\"`));
      checks.push(check("ir_control_mapping", mappingMissing.length === 0, mappingMissing));
      const actualData = await json(actualUi), labelRegions = namedControls(actualData).filter((item) => item.node.type === "label" && solved.rects[item.id]).map((item) => {
        const rect = solved.rects[item.id], scale = (Number(item.node.font_scale_factor) || 1) * 0.5, font = item.node.font_size === "large" ? 12 : item.node.font_size === "small" ? 8 : 10;
        return { id: item.id, capacity: Math.floor((rect.w * rect.h) / Math.max(1, font * scale * 0.55 * font * scale * 1.2)), policy: "word wrap with font scale down to 0.5" };
      });
      const textMeasurements = ["long_ko_130", "long_en"].map((id) => { const item = fixtures.text.cases.find((entry) => entry.id === id), best = labelRegions.reduce((a, b) => a.capacity > b.capacity ? a : b, { capacity: 0 }); return { id, characters: item?.text.length || 0, region: best.id, capacity: best.capacity, fits: Boolean(item) && best.capacity >= item.text.length }; });
      checks.push(check("long_text_label_measurement", textMeasurements.every((item) => item.fits), textMeasurements));
      const geometryIssues = [];
      for (const constraint of solved.constraints || []) {
        const rects = (constraint.ids || []).map((id) => solved.rects[id]).filter(Boolean);
        if (constraint.op === "equal_gap_x" && rects.length > 2) { const gaps = rects.slice(1).map((r, i) => r.x - (rects[i].x + rects[i].w)); if (Math.max(...gaps) - Math.min(...gaps) > task.geometryToleranceUiUnits) geometryIssues.push({ constraint, gaps }); }
      }
      checks.push(check("geometry_tolerance", geometryIssues.length === 0, geometryIssues));
      const goldenDir = join(root, "evals", "goldens", task.id), comparisons = [];
      const preGoldenOk = checks.every((item) => item.ok);
      if (updateGoldens && !preGoldenOk) checks.push(check("golden_update_guard", false, "structural or render checks failed; goldens were not modified"));
      if (updateGoldens && preGoldenOk) { await mkdir(goldenDir, { recursive: true }); for (const name of expected) await cp(join(outDir, name), join(goldenDir, name)); }
      for (const name of expected) comparisons.push({ name, ...(await comparePng(join(outDir, name), join(goldenDir, name))) });
      checks.push(check("pixelmatch_goldens", comparisons.every((item) => item.ok), { updated: updateGoldens && preGoldenOk, policy: GOLDEN_POLICY, comparisons }));
    }
    tasks.push({ id: task.id, example: task.example, ok: checks.every((item) => item.ok), checks });
  }
  const report = { schema: "mcbe-jsonui-ai-kit/offline-eval@1", ok: tasks.every((task) => task.ok), updateGoldens, goldenPolicy: GOLDEN_POLICY, tasks };
  if (reportPath) await writeJsonAtomic(reportPath, report);
  return report;
}
