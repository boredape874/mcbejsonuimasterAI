import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { recipesFromCorpus } from "../tools/_lib/source-corpus.mjs";
import { PNG } from "pngjs";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const node = process.execPath;
function run(args, options = {}) { return new Promise((done) => { const child = spawn(node, args, { cwd: REPO, env: { ...process.env, ...(options.env || {}) } }); let stdout = "", stderr = ""; child.stdout.on("data", (d) => stdout += d); child.stderr.on("data", (d) => stderr += d); child.on("close", (code) => done({ code, stdout, stderr })); }); }

const temp = await mkdtemp(resolve(tmpdir(), "mcbe-source-test-"));
try {
  const rp = resolve(temp, "rp");
  await mkdir(resolve(rp, "ui"), { recursive: true });
  await mkdir(resolve(rp, "textures", "ui"), { recursive: true });
  await mkdir(resolve(rp, "textures", "blocks"), { recursive: true });
  await writeFile(resolve(rp, "ui", "_ui_defs.json"), JSON.stringify({ ui_defs: ["ui/main.json", "ui/missing.json", "ui/../../outside.json"] }));
  await writeFile(resolve(temp, "outside.json"), JSON.stringify({ namespace: "outside", leaked: { type: "panel" } }));
  await writeFile(resolve(rp, "ui", "main.json"), JSON.stringify({ namespace: "fixture", root: { type: "panel", size: [100, 50], controls: [{ icon: { type: "image", texture: "textures/ui/used", size: [16, 16] } }, { vanilla: { type: "image", texture: "textures/ui/Black" } }, { dynamicVariable: { type: "image", texture: "$texture" } }, { dynamicBinding: { type: "image", texture: "#texture" } }, { escaped: { type: "image", texture: "textures/ui/../outside" } }, { missing: { type: "image", texture: "textures/ui/definitely_missing_fixture" } }, { "inherited@unknown.control": {} }, { arbitrary: { type: "label", text: "not@an.inheritance" } }] } }));
  await writeFile(resolve(rp, "ui", "unregistered.json"), JSON.stringify({ namespace: "nope", bad: { type: "image", texture: "textures/ui/unused" } }));
  const fixturePng = new PNG({ width: 1, height: 1 }); fixturePng.data.set([255, 255, 255, 0]);
  await writeFile(resolve(rp, "textures", "ui", "used.png"), PNG.sync.write(fixturePng));
  await writeFile(resolve(rp, "textures", "ui", "used.json"), JSON.stringify({ nineslice_size: 2, base_size: [16, 16] }));
  await writeFile(resolve(rp, "textures", "blocks", "not-ui.png"), "fixture");
  await writeFile(resolve(temp, "LICENSE.txt"), "fixture license");
  await writeFile(resolve(temp, "contact-sheet.png"), "visual fixture");
  await writeFile(resolve(temp, "validation.json"), JSON.stringify({ ok: true }));
  const config = resolve(temp, "sources.json");
  const validSource = { id: "fixture", kind: "resource-pack", tier: "pattern", redistribution: "local-only", license: "test-only", licenseEvidence: ["./LICENSE.txt"], revision: "fixture", rpRoot: "./rp", include: ["ui/**/*.json"], exclude: [], overrides: { visualEvidence: ["./contact-sheet.png", "./validation.json"] } };
  await writeFile(config, JSON.stringify({ schemaVersion: 1, scope: "local", sources: [validSource] }));
  const corpusDir = resolve(temp, "corpus");
  let result = await run(["tools/validate-sources.mjs", config, "--json"]); assert.equal(result.code, 0, result.stderr + result.stdout);
  const missingRootConfig = resolve(temp, "missing-root.json");
  await writeFile(missingRootConfig, JSON.stringify({ schemaVersion: 1, scope: "local", sources: [{ ...validSource, rpRoot: "./missing", bpRoot: "./missing-bp", licenseEvidence: ["./missing-license.txt"] }] }));
  result = await run(["tools/validate-sources.mjs", missingRootConfig, "--json"]); assert.equal(result.code, 9); {
    const report = JSON.parse(result.stdout);
    assert.ok(report.errors.some((item) => item.path.endsWith("/rpRoot")));
    assert.ok(report.errors.some((item) => item.path.endsWith("/bpRoot")));
    assert.ok(report.errors.some((item) => item.path.includes("licenseEvidence")));
  }
  const unsafeConfig = resolve(temp, "unsafe.json");
  await writeFile(unsafeConfig, JSON.stringify({ schemaVersion: 1, scope: "local", sources: [{ ...validSource, include: [], exclude: ["../outside/**"], overrides: { entryFiles: ["../outside.json"] } }] }));
  result = await run(["tools/validate-sources.mjs", unsafeConfig, "--json"]); assert.equal(result.code, 9); {
    const report = JSON.parse(result.stdout);
    assert.ok(report.errors.some((item) => item.path.endsWith("/include")));
    assert.ok(report.errors.some((item) => item.path.includes("/exclude/0")));
    assert.ok(report.errors.some((item) => item.path.includes("/entryFiles/0")));
  }
  const publicConfig = resolve(temp, "sources.public.json");
  await writeFile(publicConfig, JSON.stringify({ schemaVersion: 1, scope: "public", sources: [{ ...validSource, redistribution: "prohibited", rpRoot: rp, licenseEvidence: [resolve(temp, "LICENSE.txt")] }] }));
  result = await run(["tools/validate-sources.mjs", publicConfig, "--json"]); assert.equal(result.code, 9); {
    const report = JSON.parse(result.stdout);
    assert.ok(report.errors.some((item) => item.path.endsWith("/redistribution")));
    assert.ok(report.errors.some((item) => item.path.endsWith("/rpRoot") && /absolute/.test(item.message)));
    assert.ok(report.errors.some((item) => item.path.includes("licenseEvidence") && /absolute/.test(item.message)));
  }
  result = await run(["tools/source-scan.mjs", "--config", config, "--out", corpusDir, "--json"]); assert.equal(result.code, 0, result.stderr + result.stdout);
  const scan = JSON.parse(await readFile(resolve(corpusDir, "fixture.json"), "utf8"));
  assert.deepEqual(scan.files.entries, ["ui/_ui_defs.json", "ui/main.json"]);
  assert.equal(scan.assets.length, 2); assert.equal(scan.assets.find((item) => item.reference === "textures/ui/used").nineslice.path, "textures/ui/used.json");
  assert.equal(scan.assets.find((item) => item.reference === "textures/ui/used").nineslice.valid, true);
  assert.equal(scan.assets.find((item) => item.reference === "textures/ui/used").image.width, 1);
  assert.equal(scan.assets.find((item) => item.reference === "textures/ui/Black").kind, "vanilla-texture");
  assert.ok(scan.assets.find((item) => item.reference === "textures/ui/Black").evidence.length > 0);
  assert.equal(scan.unresolved.filter((item) => item.kind === "dynamic-texture").length, 2);
  assert.ok(scan.unresolved.filter((item) => item.kind === "dynamic-texture").every((item) => item.blocking === false && item.reason));
  assert.ok(scan.unresolved.some((item) => item.kind === "missing-texture" && item.blocking === true));
  assert.ok(scan.unresolved.some((item) => item.reference === "textures/ui/../outside" && /escapes/.test(item.reason)));
  assert.equal(scan.stats.unresolved, scan.unresolved.length);
  assert.equal(scan.stats.blockingUnresolved, scan.unresolved.filter((item) => item.blocking).length);
  assert.equal(scan.files.visualEvidence.length, 2);
  assert.ok(scan.files.visualEvidence.every((item) => /^[a-f0-9]{64}$/.test(item.sha256)));
  assert.deepEqual(scan.files.visualProfiles, []);
  assert.ok(scan.warnings.some((item) => /safe default profile/.test(item)));
  assert.ok(scan.unresolved.some((item) => item.kind === "ui-entry"));
  assert.ok(scan.unresolved.some((item) => item.reason === "entry escapes ui root"));
  assert.ok(scan.unresolved.some((item) => item.kind === "inherited-control"));
  assert.ok(!scan.unresolved.some((item) => item.reference === "an.inheritance"));
  assert.ok(scan.files.metadata.includes("ui/_ui_defs.json"));
  assert.ok(!scan.screens.some((item) => item.path === "ui/_ui_defs.json"));
  assert.ok(!JSON.stringify(scan).includes("unregistered.json"));
  assert.ok(!scan.files.entries.some((item) => item.includes("outside.json")));
  const missingIndexCorpus = resolve(temp, "corpus-no-index");
  result = await run(["tools/source-scan.mjs", "--config", config, "--out", missingIndexCorpus, "--json"], { env: { MCBEKIT_VANILLA_TEXTURE_INDEX: resolve(temp, "missing-vanilla-index.json") } }); assert.equal(result.code, 0, result.stderr + result.stdout); {
    const noIndexScan = JSON.parse(await readFile(resolve(missingIndexCorpus, "fixture.json"), "utf8"));
    assert.ok(noIndexScan.unresolved.some((item) => item.kind === "vanilla-index" && item.blocking === true));
    assert.ok(noIndexScan.unresolved.some((item) => item.kind === "missing-texture" && item.reference === "textures/ui/Black"));
  }
  const publicCorpus = resolve(temp, "public-corpus");
  result = await run(["tools/source-scan.mjs", "--config", "config/sources.public.json", "--out", publicCorpus, "--json"]); assert.equal(result.code, 0, result.stderr + result.stdout); {
    const summary = JSON.parse(result.stdout);
    assert.equal(summary.unresolved, 0); assert.equal(summary.blockingUnresolved, 0);
  }
  const publicRecipes = JSON.parse(await readFile(resolve(REPO, "data", "design-recipes.public.json"), "utf8")).recipes;
  assert.equal(publicRecipes.length, 14);
  assert.ok(publicRecipes.every((recipe) => recipe.validation.visual === true && recipe.validation.runtime === false));
  assert.ok(publicRecipes.every((recipe) => recipe.targetProfiles.includes("pc_1920x1080_gui3") && recipe.targetProfiles.includes("touch_1280x720_gui2")));
  assert.ok(publicRecipes.every((recipe) => recipe.evidence[0].visualEvidence.length === 2 && recipe.evidence[0].visualEvidence.every((item) => /^[a-f0-9]{64}$/.test(item.sha256))));
  const catalog = resolve(temp, "recipes.json");
  result = await run(["tools/catalog-build.mjs", "--corpus", resolve(corpusDir, "index.json"), "--out", catalog, "--json"]); assert.equal(result.code, 0, result.stderr + result.stdout);
  const firstCatalogBytes = await readFile(catalog, "utf8"); assert.equal(JSON.parse(firstCatalogBytes).generatedAt, null);
  result = await run(["tools/catalog-build.mjs", "--corpus", resolve(corpusDir, "index.json"), "--out", catalog, "--json"]); assert.equal(result.code, 0); assert.equal(await readFile(catalog, "utf8"), firstCatalogBytes);
  const epochCatalog = resolve(temp, "recipes-epoch.json");
  result = await run(["tools/catalog-build.mjs", "--corpus", resolve(corpusDir, "index.json"), "--out", epochCatalog, "--json"], { env: { SOURCE_DATE_EPOCH: "0" } }); assert.equal(result.code, 0); assert.equal(JSON.parse(await readFile(epochCatalog, "utf8")).generatedAt, "1970-01-01T00:00:00.000Z");
  result = await run(["tools/design-search.mjs", "main", "--catalog", catalog, "--json"]); assert.equal(result.code, 0, result.stderr + result.stdout); assert.equal(JSON.parse(result.stdout).count, 1);
  result = await run(["tools/catalog-build.mjs", "--help"]); assert.equal(result.code, 0); assert.match(result.stdout, /--public/); assert.match(result.stdout, /--generated-at/);
  result = await run(["tools/design-search.mjs", "--help"]); assert.equal(result.code, 0); assert.match(result.stdout, /--catalog/);
  const goldBase = { source: { id: "gold", tier: "gold", redistribution: "public" }, screens: [{ path: "ui/main.json", namespace: "gold", controls: [{ id: "x", type: "panel", size: [1, 1], offset: null, anchorFrom: null, anchorTo: null, textRole: null, states: [] }], textureReferences: [] }], assets: [], files: { protocol: [], runtimeEvidence: ["runtime-ok.json"], visualEvidence: [{ path: "visual.png", sha256: "a".repeat(64) }], visualProfiles: ["pc_verified", "touch_verified"] }, warnings: [], stats: { blockingUnresolved: 0 } };
  assert.equal(recipesFromCorpus({ sources: [goldBase] })[0].validation.runtime, true);
  assert.equal(recipesFromCorpus({ sources: [goldBase] })[0].validation.visual, true);
  assert.deepEqual(recipesFromCorpus({ sources: [goldBase] })[0].targetProfiles, ["pc_verified", "touch_verified"]);
  assert.equal(recipesFromCorpus({ sources: [{ ...goldBase, stats: { blockingUnresolved: 1 } }] })[0].validation.runtime, false);
  assert.equal(recipesFromCorpus({ sources: [{ ...goldBase, files: { ...goldBase.files, visualEvidence: [] } }] })[0].validation.visual, false);
  console.log("PASS source-catalog: safe paths, dynamic/local/vanilla/missing textures, missing index, public zero-unresolved, catalog search");
} finally { await rm(temp, { recursive: true, force: true }); }
