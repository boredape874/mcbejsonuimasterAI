import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const node = process.execPath;
function run(args) {
  return new Promise((done) => {
    const child = spawn(node, args, { cwd: REPO });
    let stdout = "", stderr = "";
    child.stdout.on("data", (data) => { stdout += data; });
    child.stderr.on("data", (data) => { stderr += data; });
    child.on("close", (code) => done({ code, stdout, stderr }));
  });
}

const temp = await mkdtemp(resolve(tmpdir(), "mcbe-asset-search-"));
try {
  const root = resolve(temp, "library-root");
  await mkdir(resolve(root, "indexes"), { recursive: true });
  await writeFile(resolve(root, "indexes", "assets.json"), JSON.stringify({ assets: [
    { id: "a:button.png", sourceId: "a", sourceKind: "fixture", sourceRelativePath: "ui/button.png", category: "textures/buttons", extension: ".png", width: 32, height: 16, hasAlpha: true, bytes: 10, sha256: "a", duplicateOf: null, libraryPath: "textures/buttons/a/button.png" },
    { id: "a:duplicate.png", sourceId: "a", sourceKind: "fixture", sourceRelativePath: "ui/duplicate.png", category: "textures/buttons", extension: ".png", width: 32, height: 16, hasAlpha: true, bytes: 10, sha256: "a", duplicateOf: "a:button.png", libraryPath: "textures/buttons/a/duplicate.png" },
    { id: "a:block.png", sourceId: "a", sourceKind: "fixture", sourceRelativePath: "blocks/stone.png", category: "textures/block-textures", extension: ".png", width: 16, height: 16, hasAlpha: false, bytes: 10, sha256: "b", duplicateOf: null, libraryPath: "textures/block-textures/a/block.png" },
  ] }));
  const result = await run(["tools/asset-search.mjs", "button", "--root", root, "--min-width", "30", "--json"]);
  assert.equal(result.code, 0, result.stderr + result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.count, 1);
  assert.equal(report.results[0].libraryPath, "textures/buttons/a/button.png");
  assert.ok(!("resolvedPath" in report.results[0]));
  const all = await run(["tools/asset-search.mjs", "--root", root, "--all-categories", "--include-duplicates", "--json"]);
  assert.equal(all.code, 0, all.stderr + all.stdout);
  assert.equal(JSON.parse(all.stdout).count, 3);
  const escaped = await run(["tools/asset-search.mjs", "--root", root, "--report", resolve(temp, "escaped.json"), "--json"]);
  assert.equal(escaped.code, 1);
  assert.match(escaped.stderr, /must stay inside the repository/);
  console.log("PASS asset-search: UI-only defaults, dimension filtering, deduplication, local path privacy");
} finally {
  await rm(temp, { recursive: true, force: true });
}
