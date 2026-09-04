// tests/run-all.mjs
// Lightweight test runner with no extra deps. Exits non-zero on any failure.
//
// Categories:
//   1) compile-all-examples: run pipeline on every examples/ir/*.yaml under the UUID run workspace
//   2) validator-negative:   feed a deliberately broken ui.json and expect ok=false
//   3) solver-edge:          inline IR using equal_gap_y, edge_offset, same_size
//   4) layout-audit:          group centering + solved-geometry warnings
//   5) root-and-units:        root rect compilation + solver-stage unit guard
//   6) measured-controls:     auto text/image/collection sizing and form grid props
//   7) go-solver-parity:      Go solver output parity with Node solver
//   8) project-templates:      initialize and compile every bundled IR template
//   9) pack-validator:         JSONC, texture, _ui_defs, and failure behavior
//  10) vanilla-index:          root-form official samples and texture evidence

import { cp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { resolve, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";
import { renderProjectTemplate } from "../tools/_lib/project-templates.mjs";
import { captureRepositoryState, compareRepositoryState, createTestRunContext, DEFAULT_REPOSITORY_GUARDS, runChild } from "./_lib/test-run-context.mjs";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  process.stdout.write("Usage: node tests/run-all.mjs\nRuns the 10 core deterministic test categories.\n");
  process.exit(0);
}
if (process.argv.length > 2) {
  process.stderr.write(`unknown option: ${process.argv[2]}\n`);
  process.exit(64);
}

const here = fileURLToPath(new URL(".", import.meta.url));
const REPO = resolve(here, "..");
const node = process.execPath;
const context = await createTestRunContext(REPO);
const beforeState = await captureRepositoryState(REPO, DEFAULT_REPOSITORY_GUARDS);
const testPath = (name) => resolve(context.workspace, name);

const FAIL = [];
const PASS = [];

function record(name, ok, info) {
  if (ok) {
    PASS.push(name);
    console.log("  PASS", name, info ? JSON.stringify(info) : "");
  } else {
    FAIL.push({ name, info });
    console.log("  FAIL", name, info ? JSON.stringify(info) : "");
  }
}

function run(cmd, args, opts = {}) {
  return runChild(cmd, args, { cwd: opts.cwd || REPO, env: opts.env });
}

async function readJsonSafe(p) {
  try { return JSON.parse(await readFile(p, "utf8")); }
  catch { return null; }
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, stable(value[k])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stable(value));
}

async function category1() {
  console.log("[1] compile-all-examples");
  const dir = resolve(REPO, "examples", "ir");
  const entries = (await readdir(dir)).filter((f) => extname(f) === ".yaml");
  for (const f of entries) {
    const name = basename(f, ".yaml");
    const wsDir = testPath(`compile_${name}`);
    await rm(wsDir, { recursive: true, force: true });
    await mkdir(wsDir, { recursive: true });
    const ir = await readFile(resolve(dir, f), "utf8");
    await writeFile(resolve(wsDir, "ir.yaml"), ir, "utf8");
    const r = await run(node, ["tools/run.mjs", resolve(wsDir, "ir.yaml")]);
    if (r.code !== 0) { record(`compile:${name}`, false, { code: r.code, stderr: r.stderr.slice(-400) }); continue; }
    const report = await readJsonSafe(resolve(wsDir, "report.json"));
    record(`compile:${name}`, !!report && report.ok === true, report ? { errors: report.errors.length, warnings: report.warnings.length } : { report: "missing" });
  }
}

async function category2() {
  console.log("[2] validator-negative");
  const wsDir = testPath("validator_negative");
  await rm(wsDir, { recursive: true, force: true });
  await mkdir(wsDir, { recursive: true });
  const badUi = {
    namespace: "neg",
    root_panel: { type: "panel", size: ["100%", "100%"], controls: [] },
    bogus: {
      type: "panel",
      anchor_from: "top_diagonal",
      anchor_to: "center",
      bindings: [{ binding_type: "view" }],
      controls: [
        { "child@x.y": { type: "panel" } },
        { ok_panel: { type: "grid" } },
      ],
    },
  };
  await writeFile(resolve(wsDir, "ui.json"), JSON.stringify(badUi, null, 2));
  const r = await run(node, ["tools/validate.mjs", resolve(wsDir, "ui.json"), "--strict-root", "--report", resolve(wsDir, "report.json")]);
  const report = await readJsonSafe(resolve(wsDir, "report.json"));
  const sawAnchorErr = !!(report && report.errors.find((e) => /anchor_from "top_diagonal"/.test(e.message)));
  const sawBindingWarns = !!(report && report.warnings.find((w) => /source_property_name/.test(w.message)));
  const sawGridWarn = !!(report && report.warnings.find((w) => /Grid should have/.test(w.message)));
  record("neg:exits-9", r.code === 9, { code: r.code });
  record("neg:flags-bad-anchor", sawAnchorErr);
  record("neg:flags-binding-view-missing", sawBindingWarns);
  record("neg:flags-empty-grid", sawGridWarn);
}

async function category3() {
  console.log("[3] solver-edge");
  const wsDir = testPath("solver_edge");
  await rm(wsDir, { recursive: true, force: true });
  await mkdir(wsDir, { recursive: true });
  const ir = `screen: edge
base_resolution: [800, 600]
elements:
  - id: a
    anchor: top_left
    pos: [40, 40]
    size: [80, 40]
  - id: b
    anchor: top_left
    pos: [200, 60]
    size: [80, 40]
  - id: c
    anchor: top_left
    pos: [360, 80]
    size: [80, 40]
  - id: ref
    anchor: top_left
    pos: [40, 200]
    size: [120, 60]
  - id: shadow
    anchor: top_left
    pos: [0, 0]
    size: [10, 10]
  - id: pinned
    anchor: top_left
    pos: [0, 0]
    size: [40, 20]
constraints:
  - { op: same_size, ids: [a, b, c] }
  - { op: equal_gap_y, ids: [a, b, c], gap: 30 }
  - { op: edge_offset, a: "shadow.left", b: "ref.left", delta: 4 }
  - { op: edge_offset, a: "shadow.top", b: "ref.top", delta: 4 }
  - { op: edge_eq, a: "pinned.right", b: "ref.right" }
  - { op: edge_eq, a: "pinned.bottom", b: "ref.bottom" }
`;
  await writeFile(resolve(wsDir, "ir.yaml"), ir, "utf8");
  const r = await run(node, ["tools/run.mjs", resolve(wsDir, "ir.yaml")]);
  const report = await readJsonSafe(resolve(wsDir, "report.json"));
  record("edge:pipeline-ok", r.code === 0 && report && report.ok === true);

  const solved = await readJsonSafe(resolve(wsDir, "solved.json"));
  if (solved) {
    const a = solved.rects.a, b = solved.rects.b, c = solved.rects.c;
    record("edge:same_size", a && b && c && a.w === b.w && b.w === c.w && a.h === b.h && b.h === c.h, { a, b, c });
    const gap1 = b.y - (a.y + a.h);
    const gap2 = c.y - (b.y + b.h);
    record("edge:equal_gap_y=30", gap1 === 30 && gap2 === 30, { gap1, gap2 });
    const ref = solved.rects.ref, shadow = solved.rects.shadow, pinned = solved.rects.pinned;
    record("edge:edge_offset-translates", shadow.x === ref.x + 4 && shadow.y === ref.y + 4
      && shadow.w === 10 && shadow.h === 10,
      { ref, shadow });
    record("edge:edge_eq-pins-right-bottom",
      pinned.x + pinned.w === ref.x + ref.w && pinned.y + pinned.h === ref.y + ref.h
      && pinned.w === 40 && pinned.h === 20,
      { ref, pinned });
  } else {
    record("edge:solved.json-present", false);
  }
}

async function category4() {
  console.log("[4] layout-audit");
  const wsDir = testPath("layout_audit");
  await rm(wsDir, { recursive: true, force: true });
  await mkdir(wsDir, { recursive: true });
  const ir = `screen: layout_audit
base_resolution: [640, 360]
elements:
  - id: panel
    kind: panel
    anchor: center
    pos: [0, 0]
    size: [300, 120]
  - id: left
    parent: panel
    kind: button
    anchor: top_left
    pos: [12, 20]
    size: [70, 28]
  - id: middle
    parent: panel
    kind: button
    anchor: top_left
    pos: [96, 20]
    size: [70, 28]
  - id: right
    parent: panel
    kind: button
    anchor: top_left
    pos: [180, 20]
    size: [70, 28]
  - id: risky_label
    parent: panel
    kind: label
    anchor: top_left
    pos: [260, 96]
    size: [60, 10]
    props:
      text: "Very Long Label"
      localize: false
      font_size: large
constraints:
  - { op: same_size, ids: [left, middle, right] }
  - { op: align_y, ids: [left, middle, right], edge: start }
  - { op: equal_gap_x, ids: [left, middle, right], gap: 14 }
  - { op: center_group_x, ids: [left, middle, right] }
`;
  await writeFile(resolve(wsDir, "ir.yaml"), ir, "utf8");
  const r = await run(node, ["tools/run.mjs", resolve(wsDir, "ir.yaml")]);
  const report = await readJsonSafe(resolve(wsDir, "report.json"));
  const solved = await readJsonSafe(resolve(wsDir, "solved.json"));
  record("audit:pipeline-ok-with-warnings", r.code === 0 && report && report.ok === true && report.warnings.length >= 2,
    report ? { warnings: report.warnings.length } : { report: "missing" });
  if (solved) {
    const p = solved.rects.panel;
    const a = solved.rects.left;
    const b = solved.rects.middle;
    const c = solved.rects.right;
    const left = Math.min(a.x, b.x, c.x);
    const right = Math.max(a.x + a.w, b.x + b.w, c.x + c.w);
    record("audit:center_group_x", ((left + right) / 2) === (p.x + p.w / 2), { group: [left, right], panel: p });
  } else {
    record("audit:solved.json-present", false);
  }
  const sawBounds = !!(report && report.warnings.find((w) => /outside parent/.test(w.message)));
  const sawLabel = !!(report && report.warnings.find((w) => /label height/.test(w.message)));
  record("audit:flags-parent-overflow", sawBounds);
  record("audit:flags-label-height", sawLabel);
}

async function category5() {
  console.log("[5] root-and-units");
  const wsDir = testPath("root_units");
  await rm(wsDir, { recursive: true, force: true });
  await mkdir(wsDir, { recursive: true });
  const ir = `screen: root_units
base_resolution: [640, 360]
root:
  size: [320, 180]
  anchor: center
  pos: [0, 0]
elements:
  - id: child
    kind: panel
    anchor: top_left
    pos: [20, 20]
    size: [80, 40]
`;
  await writeFile(resolve(wsDir, "ir.yaml"), ir, "utf8");
  const r = await run(node, ["tools/run.mjs", resolve(wsDir, "ir.yaml")]);
  const solved = await readJsonSafe(resolve(wsDir, "solved.json"));
  const ui = await readJsonSafe(resolve(wsDir, "ui.json"));
  const root = solved && solved.rects.__root__;
  const child = solved && solved.rects.child;
  record("root:pipeline-ok", r.code === 0 && !!solved && !!ui);
  record("root:rect-centered", root && root.x === 160 && root.y === 90 && root.w === 320 && root.h === 180, { root });
  record("root:child-relative", child && child.x === 180 && child.y === 110 && child.w === 80 && child.h === 40, { child });
  record("root:compiled-layout", ui && ui.root_panel && ui.root_panel.size[0] === 320 && ui.root_panel.size[1] === 180
    && ui.root_panel.anchor_from === "center" && ui.root_panel.anchor_to === "center",
    ui && ui.root_panel ? ui.root_panel : null);
  const render = await run(node, ["tools/render.mjs", resolve(wsDir, "ui.json"), resolve(wsDir, "solved.json"), "--no-image", "--diagnostic-ok"]);
  const coords = await readJsonSafe(resolve(wsDir, "coords.json"));
  record("render:coords-exclude-internal-rects", render.code === 0 && coords && coords.rects.length === 1 && coords.rects[0].id === "child",
    coords ? { rects: coords.rects.map((r) => r.id) } : { coords: "missing" });

  const badDir = testPath("nonpixel");
  await rm(badDir, { recursive: true, force: true });
  await mkdir(badDir, { recursive: true });
  const badIr = `screen: nonpixel
units:
  allowPercent: true
elements:
  - id: panel
    size: ["100%", 40]
`;
  await writeFile(resolve(badDir, "ir.yaml"), badIr, "utf8");
  const bad = await run(node, ["tools/ir-validate.mjs", resolve(badDir, "ir.yaml")]);
  record("units:rejects-nonpixel-solver-size", bad.code === 6 && /numeric pixel sizes/.test(bad.stderr + bad.stdout),
    { code: bad.code });
}

async function category6() {
  console.log("[6] measured-controls");
  const wsDir = testPath("measured_controls");
  await rm(wsDir, { recursive: true, force: true });
  await mkdir(wsDir, { recursive: true });
  const ir = `screen: measured_controls
base_resolution: [800, 450]
elements:
  - id: form_grid
    kind: collection_grid
    anchor: center
    pos: [0, 20]
    size: [0, 0]
    auto_size: { mode: collection_grid }
    collection:
      name: form_buttons
      dimensions: [3, 2]
      maximum_items: 6
      item_template: measured_controls.form_button
      item_size: [40, 40]
      gap: [6, 8]
      length_binding: "#form_button_contents"
  - id: title
    kind: label
    anchor: top_middle
    pos: [0, 24]
    size: [0, 0]
    auto_size:
      mode: text
      padding: [6, 2]
    props:
      text: "SHOP MENU"
      localize: false
      font_size: large
      font_scale_factor: 1.5
  - id: icon
    kind: image
    anchor: top_left
    pos: [40, 40]
    size: [64, 0]
    auto_size:
      mode: image_aspect
      aspect: [2, 1]
    props:
      texture: textures/ui/icon_recipe_book
`;
  await writeFile(resolve(wsDir, "ir.yaml"), ir, "utf8");
  const r = await run(node, ["tools/run.mjs", resolve(wsDir, "ir.yaml")]);
  const report = await readJsonSafe(resolve(wsDir, "report.json"));
  const solved = await readJsonSafe(resolve(wsDir, "solved.json"));
  const ui = await readJsonSafe(resolve(wsDir, "ui.json"));
  record("measure:pipeline-ok", r.code === 0 && report && report.ok === true);
  if (solved && ui) {
    const grid = solved.rects.form_grid;
    const title = solved.rects.title;
    const icon = solved.rects.icon;
    record("measure:collection-size", grid && grid.w === 132 && grid.h === 88, { grid });
    record("measure:text-size", title && title.w > 120 && title.h > 25, { title });
    record("measure:image-aspect", icon && icon.w === 64 && icon.h === 32, { icon });
    record("measure:compiled-grid-props", ui.form_grid && ui.form_grid.type === "grid"
      && ui.form_grid.collection_name === "form_buttons"
      && ui.form_grid.grid_dimensions[0] === 3
      && ui.form_grid.grid_dimensions[1] === 2
      && ui.form_grid.maximum_grid_items === 6
      && ui.form_grid.grid_item_template === "measured_controls.form_button"
      && Array.isArray(ui.form_grid.bindings),
      ui.form_grid);
  } else {
    record("measure:outputs-present", false);
  }
}

async function category7() {
  console.log("[7] go-solver-parity");
  const goCheck = await run("go", ["version"]);
  if (goCheck.code !== 0) {
    record("go:available-or-skipped", true, { skipped: true });
    return;
  }
  const wsDir = testPath("go_parity");
  await rm(wsDir, { recursive: true, force: true });
  await mkdir(wsDir, { recursive: true });
  const ir = `screen: go_parity
base_resolution: [800, 600]
root:
  size: [500, 320]
  anchor: center
  pos: [0, 0]
elements:
  - id: panel
    kind: panel
    anchor: center
    pos: [0, 0]
    size: [320, 180]
  - id: left
    parent: panel
    anchor: top_left
    pos: [12, 20]
    size: [64, 24]
  - id: mid
    parent: panel
    anchor: top_left
    pos: [96, 20]
    size: [64, 24]
  - id: right
    parent: panel
    anchor: top_left
    pos: [180, 20]
    size: [64, 24]
  - id: shadow
    parent: panel
    anchor: top_left
    pos: [0, 0]
    size: [20, 20]
constraints:
  - { op: same_size, ids: [left, mid, right] }
  - { op: align_y, ids: [left, mid, right], edge: start }
  - { op: equal_gap_x, ids: [left, mid, right], gap: 12 }
  - { op: center_group_x, ids: [left, mid, right] }
  - { op: edge_offset, a: "shadow.right", b: "right.right", delta: 4 }
  - { op: edge_eq, a: "shadow.bottom", b: "right.bottom" }
`;
  await writeFile(resolve(wsDir, "ir.yaml"), ir, "utf8");
  const nodeRun = await run(node, ["tools/solve.mjs", resolve(wsDir, "ir.yaml"), resolve(wsDir, "node.json")], {
    env: { ...process.env, MCBEKIT_SOLVER: "node" },
  });
  const goRun = await run(node, ["tools/solve.mjs", resolve(wsDir, "ir.yaml"), resolve(wsDir, "go.json")], {
    env: { ...process.env, MCBEKIT_SOLVER: "go" },
  });
  const nodeSolved = await readJsonSafe(resolve(wsDir, "node.json"));
  const goSolved = await readJsonSafe(resolve(wsDir, "go.json"));
  record("go:both-solvers-run", nodeRun.code === 0 && goRun.code === 0, { node: nodeRun.code, go: goRun.code });
  record("go:rect-parity", !!nodeSolved && !!goSolved && stableJson(nodeSolved.rects) === stableJson(goSolved.rects));
  record("go:log-parity", !!nodeSolved && !!goSolved && stableJson(nodeSolved.log) === stableJson(goSolved.log));
}

async function category8() {
  console.log("[8] project-templates");
  const listed = await run(node, ["tools/init-project.mjs", "--list-templates"]);
  record("template:list", listed.code === 0 && ["minimal", "rpg_hud", "rpg_menu"].every((id) => listed.stdout.includes(id)));

  for (const template of ["minimal", "rpg_hud", "rpg_menu"]) {
    const name = `test_template_${template}`;
    const wsDir = testPath(name);
    await rm(wsDir, { recursive: true, force: true });
    await mkdir(wsDir, { recursive: true });
    await writeFile(resolve(wsDir, "ir.yaml"), await renderProjectTemplate(template, name), "utf8");
    record(`template:${template}:init`, true, { isolated: true });
    const compiled = await run(node, ["tools/run.mjs", resolve(wsDir, "ir.yaml")]);
    const report = await readJsonSafe(resolve(wsDir, "report.json"));
    record(`template:${template}:clean`, compiled.code === 0 && report?.ok === true && report.warnings.length === 0,
      report ? { errors: report.errors.length, warnings: report.warnings.length } : { code: compiled.code, report: "missing" });
  }

  const invalid = await run(node, ["tools/init-project.mjs", "test_invalid_template", "--template", "missing"]);
  record("template:invalid-is-usage-error", invalid.code === 64, { code: invalid.code });
}

async function category9() {
  console.log("[9] pack-validator");
  const validDir = testPath("pack_valid");
  const validUi = resolve(validDir, "ui");
  await rm(validDir, { recursive: true, force: true });
  await mkdir(validUi, { recursive: true });
  await writeFile(resolve(validUi, "_ui_defs.json"), JSON.stringify({ ui_defs: ["ui/main.json", "ui/extra.json"] }, null, 2));
  await writeFile(resolve(validUi, "main.json"), JSON.stringify({
    namespace: "pack_test",
    root_panel: {
      type: "panel",
      size: ["100%", "100%"],
      controls: [{ icon: { type: "image", size: [20, 20], texture: "textures/ui/Black" } }],
    },
  }, null, 2));
  await writeFile(resolve(validUi, "extra.json"), `{
  "namespace": "pack_extra",
  "extra": {
    "type": "panel",
    "size": [20, 20]
  }
}
`, "utf8");
  const valid = await run(node, ["tools/validate-pack.mjs", validDir, "--strict-warnings", "--report", resolve(validDir, "report.json")]);
  const validReport = await readJsonSafe(resolve(validDir, "report.json"));
  record("pack:clean-jsonc-pack", valid.code === 0 && validReport?.clean === true && validReport.files === 3,
    validReport ? { files: validReport.files, errors: validReport.errors.length, warnings: validReport.warnings.length } : { code: valid.code });

  const unknownDir = testPath("pack_unknown_property");
  const unknownUi = resolve(unknownDir, "ui");
  await rm(unknownDir, { recursive: true, force: true });
  await mkdir(unknownUi, { recursive: true });
  await writeFile(resolve(unknownUi, "_ui_defs.json"), JSON.stringify({ ui_defs: ["ui/main.json"] }, null, 2));
  await writeFile(resolve(unknownUi, "main.json"), JSON.stringify({
    namespace: "pack_unknown",
    root_panel: {
      type: "panel",
      controls: [
        { tooltip: { type: "custom", renderer: "hover_text_renderer", hover_text: "invalid" } },
        { grid: { type: "grid", grid_dimensions: [1, 1], grid_item_size: [20, 20], controls: [{ cell: { type: "panel", size: [20, 20] } }] } },
      ],
    },
  }, null, 2));
  const unknown = await run(node, ["tools/validate-pack.mjs", unknownDir, "--report", resolve(unknownDir, "report.json")]);
  const unknownReport = await readJsonSafe(resolve(unknownDir, "report.json"));
  record("pack:runtime-unknown-properties-exit-9", unknown.code === 9 && unknownReport?.ok === false, { code: unknown.code });
  record("pack:flags-runtime-unknown-properties", ["hover_text", "grid_item_size"].every((property) =>
    unknownReport?.errors.some((error) => error.message === `Unknown property "${property}"`)));

  const brokenDir = testPath("pack_broken");
  const brokenUi = resolve(brokenDir, "ui");
  await rm(brokenDir, { recursive: true, force: true });
  await mkdir(brokenUi, { recursive: true });
  await writeFile(resolve(brokenUi, "_ui_defs.json"), JSON.stringify({ ui_defs: ["ui/main.json", "ui/missing.json"] }, null, 2));
  await writeFile(resolve(brokenUi, "main.json"), JSON.stringify({ namespace: "pack_broken", root_panel: { type: "panel" } }, null, 2));
  const broken = await run(node, ["tools/validate-pack.mjs", brokenDir, "--report", resolve(brokenDir, "report.json")]);
  const brokenReport = await readJsonSafe(resolve(brokenDir, "report.json"));
  record("pack:missing-def-entry-exits-9", broken.code === 9 && brokenReport?.ok === false, { code: broken.code });
  record("pack:flags-missing-def-entry", !!brokenReport?.errors.find((error) => error.path === "ui/missing.json"));
  const invalidArgs = await run(node, ["tools/validate-pack.mjs", validDir, "--unknown"]);
  record("pack:invalid-option-is-usage-error", invalidArgs.code === 64, { code: invalidArgs.code });
}

async function category10() {
  console.log("[10] vanilla-index");
  const isolatedRepo = resolve(context.resources, "vanilla-index-builder");
  await mkdir(resolve(isolatedRepo, "tools", "_lib"), { recursive: true });
  await cp(resolve(REPO, "tools", "build-vanilla-index.mjs"), resolve(isolatedRepo, "tools", "build-vanilla-index.mjs"));
  for (const file of ["paths.mjs", "fsx.mjs", "log.mjs"]) {
    await cp(resolve(REPO, "tools", "_lib", file), resolve(isolatedRepo, "tools", "_lib", file));
  }
  await cp(resolve(REPO, "references", "official", "bedrock-samples-ui"), resolve(isolatedRepo, "references", "official", "bedrock-samples-ui"), { recursive: true });
  const built = await run(node, [resolve(isolatedRepo, "tools", "build-vanilla-index.mjs"), "--force"], { cwd: isolatedRepo });
  const screens = await readJsonSafe(resolve(isolatedRepo, "vanilla-index", "screens.json"));
  const textures = await readJsonSafe(resolve(isolatedRepo, "vanilla-index", "textures.json"));
  record("index:builds", built.code === 0 && screens?.schema?.endsWith("@2") && textures?.schema?.endsWith("@2"),
    { code: built.code, screens: screens?.count, textures: textures?.count });
  record("index:official-root-screen", !!screens?.screens?.hud_screen?.find((entry) =>
    entry.source === "bedrock-samples-ui" && entry.path.endsWith("references/official/bedrock-samples-ui/hud_screen.json")));
  record("index:texture-evidence", Array.isArray(textures?.textures?.["textures/ui/Black"]));
}

let cleanupError = null;
try {
  await category1();
  await category2();
  await category3();
  await category4();
  await category5();
  await category6();
  await category7();
  await category8();
  await category9();
  await category10();
} catch (error) {
  record("runner:uncaught-error", false, { error: String(error?.stack || error) });
} finally {
  try { await context.cleanup(); }
  catch (error) { cleanupError = String(error?.stack || error); record("runner:cleanup", false, { error: cleanupError }); }
  try {
    const afterState = await captureRepositoryState(REPO, DEFAULT_REPOSITORY_GUARDS);
    const parity = compareRepositoryState(beforeState, afterState);
    record("runner:repository-state-parity", parity.ok, parity);
  } catch (error) {
    record("runner:repository-state-parity", false, { error: String(error?.stack || error) });
  }
}

console.log("");
console.log(`Run: ${context.runId}`);
console.log(`Resource manifest: ${context.resourceManifest}`);
console.log(`Total: ${PASS.length} passed, ${FAIL.length} failed`);
if (FAIL.length) {
  for (const failure of FAIL) console.log("  -", failure.name, JSON.stringify(failure.info || {}));
  process.exitCode = 1;
}
