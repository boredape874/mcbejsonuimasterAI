// tests/run-all.mjs
// Lightweight test runner with no extra deps. Exits non-zero on any failure.
//
// Categories:
//   1) compile-all-examples: run pipeline on every examples/ir/*.yaml under workspace/_test_<n>/
//   2) validator-negative:   feed a deliberately broken ui.json and expect ok=false
//   3) solver-edge:          inline IR using equal_gap_y, edge_offset, same_size

import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { resolve, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";

const here = fileURLToPath(new URL(".", import.meta.url));
const REPO = resolve(here, "..");
const node = process.execPath;

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
  return new Promise((resolveP) => {
    const child = spawn(cmd, args, { cwd: REPO, ...opts });
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("close", (code) => resolveP({ code, stdout, stderr }));
  });
}

async function readJsonSafe(p) {
  try { return JSON.parse(await readFile(p, "utf8")); }
  catch { return null; }
}

async function category1() {
  console.log("[1] compile-all-examples");
  const dir = resolve(REPO, "examples", "ir");
  const entries = (await readdir(dir)).filter((f) => extname(f) === ".yaml");
  for (const f of entries) {
    const name = basename(f, ".yaml");
    const wsDir = resolve(REPO, "workspace", `_test_${name}`);
    await rm(wsDir, { recursive: true, force: true });
    await mkdir(wsDir, { recursive: true });
    const ir = await readFile(resolve(dir, f), "utf8");
    await writeFile(resolve(wsDir, "ir.yaml"), ir, "utf8");
    const r = await run(node, ["tools/run.mjs", `workspace/_test_${name}/ir.yaml`]);
    if (r.code !== 0) { record(`compile:${name}`, false, { code: r.code, stderr: r.stderr.slice(-400) }); continue; }
    const report = await readJsonSafe(resolve(wsDir, "report.json"));
    record(`compile:${name}`, !!report && report.ok === true, report ? { errors: report.errors.length, warnings: report.warnings.length } : { report: "missing" });
  }
}

async function category2() {
  console.log("[2] validator-negative");
  const wsDir = resolve(REPO, "workspace", "_test_neg");
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
  const r = await run(node, ["tools/validate.mjs", "workspace/_test_neg/ui.json"]);
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
  const wsDir = resolve(REPO, "workspace", "_test_edge");
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
  const r = await run(node, ["tools/run.mjs", "workspace/_test_edge/ir.yaml"]);
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

(async () => {
  await category1();
  await category2();
  await category3();
  console.log("");
  console.log(`Total: ${PASS.length} passed, ${FAIL.length} failed`);
  if (FAIL.length) {
    for (const f of FAIL) console.log("  -", f.name, JSON.stringify(f.info || {}));
    process.exit(1);
  }
})();
