import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const slash = (value) => value.split(sep).join("/");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function files(root) {
  const out = [];
  async function visit(dir) {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = resolve(dir, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) await visit(path); else if (entry.isFile()) out.push(path);
    }
  }
  await visit(root); return out;
}

function compareVersion(a = [], b = []) {
  for (let i = 0; i < Math.max(a.length, b.length, 3); i++) { const delta = Number(a[i] || 0) - Number(b[i] || 0); if (delta) return Math.sign(delta); }
  return 0;
}

export async function fingerprintPack(rootPath) {
  const root = resolve(rootPath), manifestPath = resolve(root, "manifest.json");
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); }
  catch (error) { const wrapped = new Error(`manifest.json is missing or invalid: ${error.message}`); wrapped.code = "PACK_MANIFEST_MISSING"; throw wrapped; }
  const inventory = [];
  for (const file of await files(root)) {
    const bytes = await readFile(file); inventory.push({ path: slash(relative(root, file)), sha256: sha256(bytes), size: bytes.length });
  }
  const digest = createHash("sha256");
  for (const item of inventory) digest.update(`${item.path}\0${item.sha256}\0${item.size}\n`);
  return { root, uuid: manifest.header?.uuid || null, version: manifest.header?.version || null, modules: (manifest.modules || []).map((item) => item.uuid).filter(Boolean).sort(), dependencies: (manifest.dependencies || []).map((item) => ({ uuid: item.uuid, version: item.version })).sort((a, b) => String(a.uuid).localeCompare(String(b.uuid))), fingerprint: digest.digest("hex"), files: inventory };
}

export async function verifyInstalledPack(sourceRoot, installedRoots) {
  const source = await fingerprintPack(sourceRoot), installed = [];
  for (const root of installedRoots) installed.push(await fingerprintPack(root));
  const issues = [];
  const byUuid = new Map();
  for (const pack of installed) { const values = byUuid.get(pack.uuid) || []; values.push(pack); byUuid.set(pack.uuid, values); }
  for (const [uuid, packs] of byUuid) if (uuid && packs.length > 1) issues.push({ code: "PACK_UUID_DUPLICATE", uuid, roots: packs.map((item) => item.root) });
  const matches = installed.filter((item) => item.uuid === source.uuid);
  if (!matches.length) issues.push({ code: "PACK_UUID_MISMATCH", expected: source.uuid, actual: installed.map((item) => item.uuid) });
  for (const target of matches) {
    const versionOrder = compareVersion(target.version, source.version);
    if (versionOrder < 0) issues.push({ code: "PACK_VERSION_STALE", source: source.version, installed: target.version, root: target.root });
    else if (versionOrder > 0) issues.push({ code: "PACK_VERSION_MISMATCH", source: source.version, installed: target.version, root: target.root });
    if (target.fingerprint !== source.fingerprint) issues.push({ code: "PACK_HASH_MISMATCH", expected: source.fingerprint, actual: target.fingerprint, root: target.root });
    if (JSON.stringify(target.dependencies) !== JSON.stringify(source.dependencies)) issues.push({ code: "PACK_DEPENDENCY_MISMATCH", root: target.root });
  }
  return { schema: "mcbe-jsonui-ai-kit/installed-pack-verification@1", ok: issues.length === 0, source, installed, issues };
}

export { sha256 };
