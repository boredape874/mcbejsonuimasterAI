import { lstat, readFile } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { canonicalJson } from "./upstream-fixtures.mjs";
import { sha256 } from "./upstream-policy.mjs";

export function safeArtifactPath(root, value) {
  if (typeof value !== "string" || !value || value.includes("\\")) throw new Error(`Unsafe capture artifact path: ${value}`);
  const path = resolve(root, ...value.split("/"));
  const rel = relative(root, path).replaceAll("\\", "/");
  if (rel.startsWith("../") || rel === "..") throw new Error(`Capture artifact escapes root: ${value}`);
  return path;
}
export async function hashRegularFile(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Capture artifact must be a regular file: ${path}`);
  const bytes = await readFile(path);
  return { bytes, sha256: sha256(bytes), size: bytes.length };
}
export async function loadBlackBoxCaptures(root, catalog) {
  const captures = new Map();
  for (const fixture of catalog.fixtures.filter((item) => item.captureStatus === "pending-local" && item.required)) {
    const directory = resolve(root, fixture.id);
    let raw;
    try { raw = await readFile(resolve(directory, "capture.json")); } catch { continue; }
    const manifest = JSON.parse(raw.toString("utf8"));
    if (manifest.schemaVersion !== 1 || manifest.fixture !== fixture.id || manifest.source !== fixture.source || manifest.commit !== fixture.commit || manifest.status !== "captured") continue;
    if (manifest.input?.sha256 !== sha256(canonicalJson(fixture.input))) continue;
    if (!Array.isArray(manifest.outputs) || !manifest.outputs.some((item) => item.kind === "screenshot")) continue;
    let valid = true;
    for (const artifact of [manifest.input, ...manifest.outputs]) {
      try {
        const actual = await hashRegularFile(safeArtifactPath(directory, artifact.path));
        const expectedHash = artifact.fileSha256 ?? artifact.sha256;
        if (actual.sha256 !== expectedHash || actual.size !== artifact.size) valid = false;
      } catch { valid = false; }
    }
    if (valid) captures.set(fixture.id, { valid: true, manifestSha256: sha256(raw) });
  }
  return captures;
}
