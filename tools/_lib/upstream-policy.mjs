import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const SHA256 = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const PORT_POLICIES = new Set(["selected-port-with-notice"]);
const NO_SOURCE_POLICIES = new Set(["excluded-derived-source", "local-black-box-only", "fixture-only"]);

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function isSafeRelativePath(value) {
  return typeof value === "string" && value.length > 0 && !value.includes("\\") && !value.startsWith("/") && !/^[a-z]:/i.test(value) && !value.split("/").includes("..");
}

export function validateResearchLock(lock) {
  const errors = [];
  if (lock?.schemaVersion !== 2) errors.push("schemaVersion must be 2");
  if (!isSafeRelativePath(lock?.destination)) errors.push("destination must be a safe repository-relative path");
  if (!Array.isArray(lock?.sources)) errors.push("sources must be an array");
  const ids = new Set();
  for (const source of lock?.sources ?? []) {
    const at = `sources/${source?.id ?? "?"}`;
    if (!source?.id || ids.has(source.id)) errors.push(`${at}: source id must be present and unique`); else ids.add(source.id);
    if (!COMMIT.test(source?.commit ?? "")) errors.push(`${at}: commit must be a lowercase 40-character hash`);
    if (!PORT_POLICIES.has(source?.policy) && !NO_SOURCE_POLICIES.has(source?.policy)) errors.push(`${at}: unsupported policy`);
    if (!Array.isArray(source?.allowlist)) errors.push(`${at}: allowlist must be an array`);
    if (PORT_POLICIES.has(source?.policy)) {
      if (source.sync !== true) errors.push(`${at}: selected-port source must be syncable`);
      if (source?.license?.spdx !== "MIT" || !isSafeRelativePath(source?.license?.path) || !SHA256.test(source?.license?.sha256 ?? "")) errors.push(`${at}: selected-port source requires pinned MIT license evidence`);
      if (!source.allowlist?.length) errors.push(`${at}: selected-port source requires a non-empty allowlist`);
    } else if (source?.allowlist?.length) errors.push(`${at}: ${source.policy} must not allowlist source files`);
    if (source.policy === "local-black-box-only" && source?.license?.spdx !== "NOASSERTION") errors.push(`${at}: black-box source must remain NOASSERTION`);
    for (const item of source?.allowlist ?? []) {
      if (!isSafeRelativePath(item?.path) || !SHA256.test(item?.sha256 ?? "")) errors.push(`${at}: invalid allowlist path or hash`);
    }
  }
  return errors;
}

export async function loadResearchLock(path) {
  const lock = JSON.parse(await readFile(path, "utf8"));
  const errors = validateResearchLock(lock);
  if (errors.length) throw new Error(`Invalid research lock:\n- ${errors.join("\n- ")}`);
  return lock;
}

export async function verifyUpstreamCheckout(source, directory) {
  if (!PORT_POLICIES.has(source.policy)) throw new Error(`${source.id} policy does not permit source verification`);
  const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: directory, encoding: "utf8" });
  if (head.status !== 0) throw new Error(`Cannot read git HEAD for ${source.id}: ${head.stderr.trim()}`);
  const actualCommit = head.stdout.trim();
  if (actualCommit !== source.commit) throw new Error(`Pinned revision mismatch for ${source.id}: ${actualCommit}`);
  const entries = [source.license, ...source.allowlist];
  for (const entry of entries) {
    const bytes = await readFile(resolve(directory, ...entry.path.split("/")));
    const actualHash = sha256(bytes);
    if (actualHash !== entry.sha256) throw new Error(`Pinned file hash mismatch for ${source.id}/${entry.path}: ${actualHash}`);
  }
  return { id: source.id, commit: actualCommit, verifiedFiles: entries.map((entry) => entry.path) };
}
