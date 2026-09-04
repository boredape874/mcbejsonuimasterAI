#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { loadResearchLock, sha256 } from "./_lib/upstream-policy.mjs";
import { canonicalJson, loadFixtureCatalog } from "./_lib/upstream-fixtures.mjs";
import { hashRegularFile } from "./_lib/upstream-blackbox.mjs";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const option = (name) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };
const id = option("--id"), dirArg = option("--dir"), screenshotArg = option("--screenshot"), outputArg = option("--output-artifact");
if (!id || !dirArg) throw new Error("Usage: upstream-compat-capture --id <fixture> --dir workspace/<capture-root> [--screenshot <image>] [--output-artifact <file>]");
const captureRoot = resolve(dirArg), rel = relative(repoRoot, captureRoot).replaceAll("\\", "/");
if (!rel.startsWith("workspace/") || rel.includes("../")) throw new Error("Black-box captures must be written below workspace/");
const lock = await loadResearchLock(join(repoRoot, "config", "research-lock.json"));
const catalog = await loadFixtureCatalog(join(repoRoot, lock.policy.offlineFixture), lock);
const fixture = catalog.fixtures.find((item) => item.id === id);
const source = lock.sources.find((item) => item.id === fixture?.source);
if (!fixture || fixture.captureStatus !== "pending-local" || source?.policy !== "local-black-box-only") throw new Error(`Fixture is not a local black-box capture contract: ${id}`);

const directory = resolve(captureRoot, id);
await mkdir(directory, { recursive: true });
const inputBytes = Buffer.from(`${JSON.stringify({ schemaVersion: 1, fixture: id, source: fixture.source, commit: fixture.commit, inputKind: "synthetic", input: fixture.input }, null, 2)}\n`);
await writeFile(resolve(directory, "input.json"), inputBytes);
const input = { kind: "synthetic-input", path: "input.json", sha256: sha256(canonicalJson(fixture.input)), fileSha256: sha256(inputBytes), size: inputBytes.length };
const outputs = [];
async function storeArtifact(kind, sourcePath, preferredName) {
  const original = await hashRegularFile(resolve(sourcePath));
  if (kind === "screenshot") {
    const png = original.bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const jpeg = original.bytes[0] === 0xff && original.bytes[1] === 0xd8;
    if (!png && !jpeg) throw new Error("Screenshot artifact must be a PNG or JPEG file");
  }
  const name = preferredName + extname(basename(sourcePath)).toLowerCase();
  await writeFile(resolve(directory, name), original.bytes);
  const stored = await hashRegularFile(resolve(directory, name));
  outputs.push({ kind, path: name, sha256: stored.sha256, size: stored.size });
}
if (screenshotArg) await storeArtifact("screenshot", screenshotArg, "screen");
if (outputArg) await storeArtifact("exported-output", outputArg, "output");
const status = screenshotArg ? "captured" : "pending";
const manifest = { schemaVersion: 1, fixture: id, source: fixture.source, commit: fixture.commit, status, input, outputs };
await writeFile(resolve(directory, "capture.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, status, directory, inputSha256: input.sha256, outputs }, null, 2));
