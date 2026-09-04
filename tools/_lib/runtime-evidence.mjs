import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { sha256 } from "./pack-fingerprint.mjs";

export async function validateRuntimeEvidence(manifest, { manifestPath, expectedPackFingerprint } = {}) {
  const schema = JSON.parse(await readFile(new URL("../../schemas/runtime-evidence.schema.json", import.meta.url), "utf8"));
  const ajv = new Ajv2020({ allErrors: true, strict: false }); addFormats(ajv); const validate = ajv.compile(schema);
  const issues = [];
  if (!validate(manifest)) issues.push(...(validate.errors || []).map((item) => ({ code: item.keyword === "required" && item.params?.missingProperty === "sha256" ? "RUNTIME_EVIDENCE_HASH_REQUIRED" : "RUNTIME_EVIDENCE_SCHEMA_INVALID", path: item.instancePath, message: item.message })));
  if (expectedPackFingerprint && manifest.pack?.fingerprint !== expectedPackFingerprint) issues.push({ code: "RUNTIME_EVIDENCE_STALE", expected: expectedPackFingerprint, actual: manifest.pack?.fingerprint });
  const missingStates = (manifest.requiredStates || []).filter((state) => !(manifest.states || []).includes(state));
  if (missingStates.length) issues.push({ code: "RUNTIME_EVIDENCE_STATE_MISSING", states: missingStates });
  const capturedStates = new Set((manifest.screenshots || []).map((item) => item.state).filter(Boolean));
  const uncapturedStates = (manifest.requiredStates || []).filter((state) => !capturedStates.has(state));
  if (uncapturedStates.length) issues.push({ code: "RUNTIME_EVIDENCE_SCREENSHOT_STATE_MISSING", states: uncapturedStates });
  const root = dirname(resolve(manifestPath || "."));
  for (const artifact of [...(manifest.screenshots || []), ...(manifest.contentLog ? [manifest.contentLog] : [])]) {
    if (!artifact?.path || !artifact.sha256) continue;
    const absolute = resolve(root, artifact.path), rel = relative(root, absolute);
    if (rel.startsWith("..") || rel.startsWith("/") || rel.startsWith("\\")) { issues.push({ code: "RUNTIME_EVIDENCE_PATH_ESCAPE", path: artifact.path }); continue; }
    try { const actual = sha256(await readFile(absolute)); if (actual !== artifact.sha256) issues.push({ code: "RUNTIME_EVIDENCE_HASH_MISMATCH", path: artifact.path, expected: artifact.sha256, actual }); }
    catch { issues.push({ code: "RUNTIME_EVIDENCE_FILE_MISSING", path: artifact.path }); }
  }
  return { ok: issues.length === 0, runtimeVerified: issues.length === 0, issues };
}
