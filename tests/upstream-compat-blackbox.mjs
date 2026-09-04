import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repo = resolve(fileURLToPath(new URL("..", import.meta.url)));
const root = resolve(process.env.MCBEKIT_REPO_TEST_ROOT || resolve(repo, "workspace"), "upstream-blackbox");
const source = resolve(root, "source");
await rm(root, { recursive: true, force: true });
await mkdir(source, { recursive: true });
try {
  const args = ["tools/upstream-compat-capture.mjs", "--id", "json-ui-maker-synthetic-panel-v1", "--dir", root];
  let result = spawnSync(process.execPath, args, { cwd: repo, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, "pending");
  let readiness = spawnSync(process.execPath, ["tools/upstream-compat.mjs", "--strict", "--captures", root], { cwd: repo, encoding: "utf8" });
  assert.equal(readiness.status, 9);

  const screenshot = resolve(source, "capture.png");
  await writeFile(screenshot, Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]));
  const output = resolve(source, "export.json");
  await writeFile(output, `${JSON.stringify({ namespace: "synthetic_capture", synthetic_panel: { type: "panel" } }, null, 2)}\n`);
  result = spawnSync(process.execPath, [...args, "--screenshot", screenshot, "--output-artifact", output], { cwd: repo, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).status, "captured");
  const manifest = JSON.parse(await readFile(resolve(root, "json-ui-maker-synthetic-panel-v1", "capture.json"), "utf8"));
  assert.equal(manifest.status, "captured");
  assert.ok(manifest.input.sha256.match(/^[a-f0-9]{64}$/));
  assert.ok(manifest.outputs.every((item) => item.sha256.match(/^[a-f0-9]{64}$/)));
  assert.ok(manifest.outputs.some((item) => item.kind === "screenshot"));
  assert.ok(manifest.outputs.some((item) => item.kind === "exported-output"));
  assert.ok(!JSON.stringify(manifest).includes(source));
  readiness = spawnSync(process.execPath, ["tools/upstream-compat.mjs", "--strict", "--captures", root], { cwd: repo, encoding: "utf8" });
  assert.equal(readiness.status, 0, readiness.stderr);
  const report = JSON.parse(readiness.stdout);
  assert.equal(report.ready, true);
  assert.equal(report.results.find((item) => item.id === "json-ui-maker-synthetic-panel-v1").status, "local-capture-verified");
  await writeFile(resolve(root, "json-ui-maker-synthetic-panel-v1", "screen.png"), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1]));
  readiness = spawnSync(process.execPath, ["tools/upstream-compat.mjs", "--strict", "--captures", root], { cwd: repo, encoding: "utf8" });
  assert.equal(readiness.status, 9);
  assert.equal(JSON.parse(readiness.stdout).ready, false);
  console.log("PASS upstream-compat-blackbox: pending preparation, hashed capture artifacts, and strict readiness");
} finally {
  await rm(root, { recursive: true, force: true });
}
