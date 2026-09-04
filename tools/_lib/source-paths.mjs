import { realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
export function contained(root, target) {
  const rel = relative(root, target);
  return rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`));
}
export function safeRelative(value) {
  return typeof value === "string" && !isAbsolute(value) && !value.replace(/\\/g, "/").split("/").includes("..");
}
export async function resolveContained(root, value, { mustExist = true, type = null } = {}) {
  const rootReal = await realpath(root);
  const target = resolve(root, value);
  let targetReal = target;
  try { targetReal = await realpath(target); } catch { if (mustExist) throw new Error("path does not exist"); }
  if (!contained(rootReal, targetReal)) throw new Error("path escapes root");
  if (mustExist && type) {
    const info = await stat(targetReal);
    if (type === "file" && !info.isFile()) throw new Error("path is not a file");
    if (type === "directory" && !info.isDirectory()) throw new Error("path is not a directory");
  }
  return targetReal;
}
export async function resolveSafeOutput(root, value) {
  const target = resolve(value);
  if (!contained(resolve(root), target)) throw new Error("output escapes root");
  let ancestor = dirname(target);
  while (ancestor !== dirname(ancestor)) {
    try {
      const realAncestor = await realpath(ancestor);
      if (!contained(await realpath(root), realAncestor)) throw new Error("output parent resolves outside root");
      return target;
    } catch (error) {
      if (/outside root/.test(error.message)) throw error;
      ancestor = dirname(ancestor);
    }
  }
  throw new Error("no safe output parent found");
}
export async function resolveSourceRoots(source, configPath, scope) {
  const configDir = dirname(configPath);
  const boundary = scope === "public" ? REPO_ROOT : configDir;
  const resolveRoot = async (field) => {
    const value = source[field]; if (!value) return null;
    if (scope === "public" && isAbsolute(value)) throw new Error(`${field} absolute path forbidden in public scope`);
    const target = resolve(configDir, value);
    const real = await realpath(target);
    if (scope === "public" && !contained(await realpath(boundary), real)) throw new Error(`${field} escapes public repository boundary`);
    const info = await stat(real); if (!info.isDirectory()) throw new Error(`${field} is not a directory`);
    return real;
  };
  return { rpRoot: await resolveRoot("rpRoot"), bpRoot: await resolveRoot("bpRoot") };
}
export async function validateSourcePaths(config, configPath) {
  const errors = [];
  const scope = config.scope;
  const configDir = dirname(configPath);
  for (const [index, source] of (config.sources || []).entries()) {
    const base = `/sources/${index}`;
    if (scope === "public" && !["public", "metadata-only"].includes(source.redistribution)) errors.push({ path: `${base}/redistribution`, message: "public scope only permits public or metadata-only redistribution" });
    if (!source.include?.length) errors.push({ path: `${base}/include`, message: "include must contain an explicit UI-scoped pattern" });
    for (const field of ["include", "exclude"]) for (const [i, value] of (source[field] || []).entries()) if (!safeRelative(value)) errors.push({ path: `${base}/${field}/${i}`, message: `${field} path escapes source root` });
    for (const field of ["entryFiles", "protocolFiles", "runtimeEvidence"]) for (const [i, value] of (source.overrides?.[field] || []).entries()) if (!safeRelative(value)) errors.push({ path: `${base}/overrides/${field}/${i}`, message: `${field} path escapes source root` });
    for (const [i, value] of (source.overrides?.visualEvidence || []).entries()) {
      const path = `${base}/overrides/visualEvidence/${i}`;
      if (scope === "public" && isAbsolute(value)) { errors.push({ path, message: "visualEvidence absolute path forbidden in public scope" }); continue; }
      try {
        const target = await realpath(resolve(configDir, value));
        if (!(await stat(target)).isFile()) throw new Error("not a file");
        if (scope === "public" && !contained(await realpath(REPO_ROOT), target)) throw new Error("escapes public repository boundary");
      } catch (error) { errors.push({ path, message: `visual evidence invalid: ${error.message}` }); }
    }
    for (const field of ["rpRoot", "bpRoot"]) {
      if (!source[field]) continue;
      try {
        const probe = field === "rpRoot" ? { ...source, bpRoot: undefined } : { ...source, rpRoot: source.bpRoot, bpRoot: undefined };
        await resolveSourceRoots(probe, configPath, scope);
      } catch (error) { errors.push({ path: `${base}/${field}`, message: String(error.message).replace(/^rpRoot/, field) }); }
    }
    for (const [i, value] of (source.licenseEvidence || []).entries()) {
      if (scope === "public" && isAbsolute(value)) { errors.push({ path: `${base}/licenseEvidence/${i}`, message: "absolute path forbidden in public scope" }); continue; }
      try {
        const target = await realpath(resolve(configDir, value)); const info = await stat(target);
        if (!info.isFile()) throw new Error("not a file");
        if (scope === "public" && !contained(await realpath(REPO_ROOT), target)) throw new Error("escapes public repository boundary");
      } catch (error) { errors.push({ path: `${base}/licenseEvidence/${i}`, message: `license evidence invalid: ${error.message}` }); }
    }
  }
  return errors;
}
