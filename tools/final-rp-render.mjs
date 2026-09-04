#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderScreen, renderStates } from "./_lib/final-rp-engine.mjs";
import { createResultEnvelope, printResultJson, resultExitCode } from "./_lib/result-envelope.mjs";
import { writeReportArtifact } from "./_lib/report-envelope.mjs";

const args = process.argv.slice(2);
const option = (name, fallback = null) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : fallback; };
if (args.includes("--help") || !args[0]) {
  console.log("Usage: node tools/final-rp-render.mjs <rpRoot> [control] [--fixture file] [--control ref] [--vanilla-root path] [--out png] [--output-dir dir] [--viewport WxH] [--hover N] [--pressed N] [--states default,hover,pressed] [--diagnostic-ok] [--report file] [--engine legacy]");
  process.exit(args.includes("--help") ? 0 : 64);
}
if (option("--engine") === "legacy") {
  process.argv = [process.argv[0], resolve("tools/final-rp-render-legacy.mjs"), ...args.filter((value, index) => value !== "--engine" && args[index - 1] !== "--engine")];
  await import("./final-rp-render-legacy.mjs");
  process.exit();
}
const rpRoot = resolve(args[0]);
const fixturePath = option("--fixture"), fixture = fixturePath ? JSON.parse(await readFile(resolve(fixturePath), "utf8")) : {};
const positionalControl = args[1] && !args[1].startsWith("--") ? args[1] : null;
const control = option("--control", positionalControl), viewport = String(option("--viewport", "480x270")).toLowerCase().split("x").map(Number);
if (viewport.length !== 2 || viewport.some((value) => !Number.isFinite(value) || value <= 0)) throw new Error("--viewport must be WxH");
const asIndex = (value) => value == null || value === "" ? null : Number(value);
if (args.includes("--hover")) fixture.hoveredIndex = asIndex(option("--hover"));
if (args.includes("--pressed")) fixture.pressedIndex = asIndex(option("--pressed"));
const common = { rpRoot, control, fixture, viewport, vanillaRoot: option("--vanilla-root"), outputDir: option("--output-dir") ? resolve(option("--output-dir")) : undefined };
const states = option("--states");
const result = states
  ? await renderStates({ ...common, states: states.split(",").map((value) => value.trim()).filter(Boolean) })
  : await renderScreen({ ...common, interactionState: fixture.pressedIndex != null ? "pressed" : fixture.hoveredIndex != null ? "hover" : "default", outputPath: option("--out") ? resolve(option("--out")) : undefined });
const details = states
  ? { ok: result.ok, engine: result.engine, states: Object.fromEntries(Object.entries(result.reports).map(([state, report]) => [state, { output: report.outputPath, report: report.reportPath, hash: report.hash, unresolved: report.unresolved.length, issues: report.validation.issues.length }])), contactSheet: result.contactSheet }
  : { ok: result.ok, engine: result.engine, output: result.outputPath, report: result.reportPath, hash: result.hash, unresolved: result.unresolved.length, issues: result.validation.issues.length };
const diagnosticOk = args.includes("--diagnostic-ok");
const blockingCount = states
  ? Object.values(result.reports).reduce((count, report) => count + report.unresolved.length + report.validation.issues.length, 0)
  : result.unresolved.length + result.validation.issues.length;
const envelope = createResultEnvelope({
  ok: result.ok,
  status: result.ok ? "passed" : diagnosticOk ? "incomplete" : "failed",
  evidenceLevel: "final-rp-static-visual",
  blocking: result.ok ? [] : [{ code: "FINAL_RP_BLOCKING_DIAGNOSTICS", count: blockingCount }],
  exitCodeReason: result.ok ? "SUCCESS" : diagnosticOk ? "DIAGNOSTIC_OK_OPT_IN" : "BLOCKING_FINAL_RP_DIAGNOSTICS",
  optIn: diagnosticOk ? { diagnosticOk: true, source: "--diagnostic-ok" } : null,
  artifacts: [],
  summary: { ...details, artifactProduced: Boolean(states ? result.contactSheet || Object.keys(result.reports).length : result.outputPath) },
});
const reportPath = option("--report");
const artifact = await writeReportArtifact(reportPath, details, { kind: "final-rp-details" });
if (artifact) envelope.artifacts.push(artifact);
printResultJson(envelope);
process.exitCode = resultExitCode(envelope);
