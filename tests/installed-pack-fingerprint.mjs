import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fingerprintPack, verifyInstalledPack, sha256 } from "../tools/_lib/pack-fingerprint.mjs";
import { validateRuntimeEvidence } from "../tools/_lib/runtime-evidence.mjs";

const root = await mkdtemp(resolve(tmpdir(), "jsonui-pack-")), source = resolve(root, "source"), installed = resolve(root, "installed");
const manifest = { format_version: 2, header: { name: "x", uuid: "11111111-1111-1111-1111-111111111111", version: [1, 0, 0], min_engine_version: [1, 21, 0] }, modules: [{ type: "resources", uuid: "22222222-2222-2222-2222-222222222222", version: [1, 0, 0] }] };
try {
  await mkdir(resolve(source, "ui"), { recursive: true }); await writeFile(resolve(source, "manifest.json"), JSON.stringify(manifest)); await writeFile(resolve(source, "ui/a.json"), "{}"); await cp(source, installed, { recursive: true });
  let report = await verifyInstalledPack(source, [installed]); assert.equal(report.ok, true);
  await writeFile(resolve(installed, "ui/a.json"), "[]"); report = await verifyInstalledPack(source, [installed]); assert(report.issues.some((item) => item.code === "PACK_HASH_MISMATCH"));
  await writeFile(resolve(installed, "manifest.json"), JSON.stringify({ ...manifest, header: { ...manifest.header, version: [0, 9, 0] } })); report = await verifyInstalledPack(source, [installed]); assert(report.issues.some((item) => item.code === "PACK_VERSION_STALE"));
  const artifact = resolve(root, "screen.png"); await writeFile(artifact, "pixels"); const pack = await fingerprintPack(source);
  const evidencePath = resolve(root, "evidence.json"), evidence = { schema: "mcbe-jsonui-ai-kit/runtime-evidence@1", bedrock: { version: "1.21.100", channel: "stable", platform: "Windows", jsonDialect: "bedrock-json@1.21.100" }, pack: { uuid: pack.uuid, version: pack.version, fingerprint: pack.fingerprint }, world: { resourcePackStack: [], behaviorPackStack: [] }, device: { input: "mouse-keyboard", guiScale: 3, safeZone: [0,0,1,1] }, scenario: "route", requiredStates: ["default"], states: ["default"], screenshots: [{ path: "screen.png", sha256: sha256(await readFile(artifact)), state: "default", profile: "pc-480x270-gui3" }], contentLog: { path: "screen.png", sha256: sha256(await readFile(artifact)), targetUiErrors: 0, externalErrors: 0 }, interaction: { passed: true, observations: ["opened"] }, review: { reviewer: "tester", verifiedAt: "2026-09-04T00:00:00Z", toolVersion: "0.2.0" }, capturedAt: "2026-09-04T00:00:00Z" };
  let evidenceReport = await validateRuntimeEvidence(evidence, { manifestPath: evidencePath, expectedPackFingerprint: pack.fingerprint }); assert.equal(evidenceReport.runtimeVerified, true);
  evidence.requiredStates = ["default", "hover"]; evidence.states = ["default", "hover"]; evidenceReport = await validateRuntimeEvidence(evidence, { manifestPath: evidencePath, expectedPackFingerprint: pack.fingerprint }); assert(evidenceReport.issues.some((item) => item.code === "RUNTIME_EVIDENCE_SCREENSHOT_STATE_MISSING")); evidence.requiredStates = ["default"]; evidence.states = ["default"];
  evidence.screenshots[0].sha256 = "0".repeat(64); evidence.states = []; evidenceReport = await validateRuntimeEvidence(evidence, { manifestPath: evidencePath, expectedPackFingerprint: pack.fingerprint }); assert(evidenceReport.issues.some((item) => item.code === "RUNTIME_EVIDENCE_HASH_MISMATCH")); assert(evidenceReport.issues.some((item) => item.code === "RUNTIME_EVIDENCE_STATE_MISSING"));
} finally { await rm(root, { recursive: true, force: true }); }
console.log("installed pack fingerprint and runtime evidence OK");
