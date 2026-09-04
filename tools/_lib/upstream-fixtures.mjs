import { readFile } from "node:fs/promises";
import { sha256 } from "./upstream-policy.mjs";

export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}
export const canonicalJson = (value) => JSON.stringify(stable(value));
export const fixtureDigest = (fixture) => sha256(canonicalJson({ input: fixture.input, expected: fixture.expected }));

export function validateFixtureCatalog(catalog, lock) {
  const errors = [], sourceById = new Map(lock.sources.map((source) => [source.id, source]));
  if (catalog?.schemaVersion !== 1) errors.push("fixture schemaVersion must be 1");
  if (!Array.isArray(catalog?.fixtures)) errors.push("fixtures must be an array");
  const ids = new Set();
  for (const fixture of catalog?.fixtures ?? []) {
    const at = `fixtures/${fixture?.id ?? "?"}`, source = sourceById.get(fixture?.source);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(fixture?.id ?? "") || ids.has(fixture.id)) errors.push(`${at}: id must be unique and path-safe`); else ids.add(fixture.id);
    if (!source) { errors.push(`${at}: unknown source`); continue; }
    if (fixture.commit !== source.commit) errors.push(`${at}: commit does not match research lock`);
    if (fixture.inputKind !== "synthetic") errors.push(`${at}: only synthetic inputs are permitted`);
    if (typeof fixture.required !== "boolean") errors.push(`${at}: required must be boolean`);
    if (!fixture.input || typeof fixture.input !== "object") errors.push(`${at}: input must be an object`);
    const pending = fixture.captureStatus === "pending-local";
    if (source.policy === "local-black-box-only" || source.policy === "fixture-only") {
      if (!pending || fixture.expected !== null) errors.push(`${at}: ${source.policy} baseline must remain pending-local with no embedded observation`);
    } else if (pending || fixture.expected === null) errors.push(`${at}: selected-port fixture requires a normalized expected result`);
    if (!pending && fixture.digest !== fixtureDigest(fixture)) errors.push(`${at}: fixture digest mismatch`);
  }
  return errors;
}

export async function loadFixtureCatalog(path, lock) {
  const catalog = JSON.parse(await readFile(path, "utf8"));
  const errors = validateFixtureCatalog(catalog, lock);
  if (errors.length) throw new Error(`Invalid upstream fixtures:\n- ${errors.join("\n- ")}`);
  return catalog;
}

export function compatibilityReport(catalog, captures = new Map()) {
  const results = catalog.fixtures.map((fixture) => {
    const capture = captures.get(fixture.id);
    const status = capture?.valid ? "local-capture-verified" : fixture.captureStatus === "pending-local" ? "pending-local" : "baseline-verified";
    return { id: fixture.id, source: fixture.source, required: fixture.required, status, digest: capture?.manifestSha256 ?? fixture.digest ?? null };
  });
  const requiredPending = results.filter((item) => item.required && item.status === "pending-local");
  return { schemaVersion: 1, ok: true, ready: requiredPending.length === 0, offline: true, passed: results.filter((item) => item.status !== "pending-local").length, pending: results.filter((item) => item.status === "pending-local").length, requiredPending: requiredPending.map((item) => item.id), results };
}
