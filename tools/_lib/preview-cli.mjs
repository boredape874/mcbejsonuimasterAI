import { dirname, relative, resolve } from "node:path";
import { log } from "./log.mjs";
import { readJson, writeJsonAtomic } from "./fsx.mjs";
import { createResultEnvelope, printResultJson, resultExitCode } from "./result-envelope.mjs";
import { writeReportArtifact } from "./report-envelope.mjs";
import { PREVIEW_PROFILES, PREVIEW_STATES, inspectUnsupported, renderGeometryDebugger, renderProfile, writeContactSheet } from "./preview-engine.mjs";

const HELP = `Usage: node tools/preview.mjs <ui.json> [<solved.json>] [options]

Options:
  --profiles <list>  Comma-separated pc,touch (default: pc,touch)
  --states <list>    Comma-separated default,hover,pressed (default: all)
  --report <path>    Write the machine-readable preview report to this path
  --out-dir <path>   Write preview artifacts outside the UI source directory
  --json             Print the final report as JSON
  --strict           Deprecated alias for the fail-closed default
  --diagnostic-ok    Explicitly allow diagnostic artifacts to exit 0
  --no-image         Write geometry and reports without raster output
  --help              Show this help

tools/render.mjs accepts the same arguments for backward compatibility.`;

function flattenSolvedRects(solved) {
  const baseW = solved?.base_resolution?.[0] || 1920, baseH = solved?.base_resolution?.[1] || 1080, rects = [];
  for (const [id, r] of Object.entries(solved?.rects || {})) if (id !== "__root__" && id !== "__screen__") rects.push({ id, x: r.x, y: r.y, w: r.w, h: r.h });
  return { baseW, baseH, rects };
}

function option(args, name, fallback) { const index = args.indexOf(name); return index >= 0 && args[index + 1] ? args[index + 1] : fallback; }
function selection(value, allowed, label) {
  const result = [...new Set(value.split(",").filter(Boolean))], invalid = result.filter((item) => !allowed.includes(item));
  if (invalid.length) throw new Error(`unknown ${label}: ${invalid.join(", ")}`);
  return result;
}
async function tryLoadCanvas() { try { return await import("@napi-rs/canvas"); } catch { return null; } }

export async function runPreviewCli(args, { command = "preview" } = {}) {
  if (args.includes("--help")) { console.log(HELP); return; }
  if (!args.length) { console.error(HELP); process.exitCode = 64; return; }
  const noImage = args.includes("--no-image"), jsonOutput = args.includes("--json"), diagnosticOk = args.includes("--diagnostic-ok"), valueOptions = new Set(["--profiles", "--states", "--report", "--out-dir"]);
  const positional = args.filter((arg, index) => !arg.startsWith("--") && !valueOptions.has(args[index - 1]));
  const uiFile = resolve(positional[0]), solvedFile = resolve(positional[1] || uiFile.replace(/ui\.json$/, "solved.json"));
  const profiles = selection(option(args, "--profiles", "pc,touch"), Object.keys(PREVIEW_PROFILES), "profile");
  const states = selection(option(args, "--states", PREVIEW_STATES.join(",")), PREVIEW_STATES, "state");
  const outDir = resolve(option(args, "--out-dir", dirname(uiFile))), requestedReport = option(args, "--report", null), reportPath = requestedReport ? resolve(requestedReport) : null;
  const solved = await readJson(solvedFile), ui = await readJson(uiFile), flat = flattenSolvedRects(solved);
  const coordsPath = resolve(outDir, "coords.json"), unsupportedPath = resolve(outDir, "unsupported.json");
  await writeJsonAtomic(coordsPath, { schema: "mcbe-jsonui-ai-kit/coords@1", base_resolution: [flat.baseW, flat.baseH], namespace: ui.namespace, rects: flat.rects });
  const unsupported = inspectUnsupported(ui);
  await writeJsonAtomic(unsupportedPath, { schema: "mcbe-jsonui-ai-kit/unsupported@1", items: unsupported });
  const publicPath = (path) => relative(outDir, path).replaceAll("\\", "/") || ".";
  const report = {
    schema: "mcbe-jsonui-ai-kit/preview-report@1", ok: true, status: "pending", diagnosticOk, command,
    imageRenderer: { enabled: false, dependency: "@napi-rs/canvas", reason: noImage ? "disabled_by_flag" : null },
    profiles: profiles.map((id) => PREVIEW_PROFILES[id]), states, unsupported, diagnostics: [], outputs: [publicPath(coordsPath), publicPath(unsupportedPath)], report: reportPath ? publicPath(reportPath) : null,
  };
  if (!jsonOutput) log.ok("coords written", { path: coordsPath, count: flat.rects.length });
  if (!noImage) {
    const canvasMod = await tryLoadCanvas();
    if (!canvasMod) report.imageRenderer.reason = "optional_dependency_missing";
    else {
      report.imageRenderer.enabled = true;
      const sheetInputs = [];
      for (const profileId of profiles) for (const state of states) {
        const outputPath = resolve(outDir, `preview-${profileId}-${state}.png`);
        const diagnostics = await renderProfile({ canvasMod, ui, uiFile, flat, profile: PREVIEW_PROFILES[profileId], state, outputPath });
        report.diagnostics.push(...diagnostics.map((item) => ({ profile: profileId, state, ...item })));
        report.outputs.push(publicPath(outputPath)); sheetInputs.push({ path: outputPath, label: `${profileId} / ${state}` });
      }
      if (sheetInputs.length) {
        const contactPath = resolve(outDir, "preview-contact-sheet.png");
        await writeContactSheet({ canvasMod, imagePaths: sheetInputs, outputPath: contactPath });
        report.outputs.push(publicPath(contactPath));
        const legacy = resolve(outDir, "preview.png");
        await renderGeometryDebugger({ canvasMod, flat, outputPath: legacy });
        report.outputs.push(publicPath(legacy));
      }
    }
  }
  report.ok = report.imageRenderer.enabled && unsupported.length === 0 && report.diagnostics.length === 0;
  report.status = report.ok ? "complete" : "diagnostic_artifact";
  const result = createResultEnvelope({
    ok: report.ok,
    status: report.ok ? "passed" : diagnosticOk ? "incomplete" : "failed",
    evidenceLevel: "approximate-preview",
    blocking: report.ok ? [] : [
      ...(!report.imageRenderer.enabled ? [{ code: "IMAGE_RENDERER_UNAVAILABLE", reason: report.imageRenderer.reason }] : []),
      ...(unsupported.length ? [{ code: "UNSUPPORTED_FIELDS", count: unsupported.length }] : []),
      ...(report.diagnostics.length ? [{ code: "PREVIEW_DIAGNOSTICS", count: report.diagnostics.length }] : []),
    ],
    exitCodeReason: report.ok ? "SUCCESS" : diagnosticOk ? "DIAGNOSTIC_OK_OPT_IN" : "BLOCKING_PREVIEW_DIAGNOSTICS",
    optIn: diagnosticOk ? { diagnosticOk: true, source: "--diagnostic-ok" } : null,
    artifacts: report.outputs.map((path) => ({ kind: "preview-output", path })),
    summary: { command, artifactProduced: report.outputs.length > 0, imageRenderer: report.imageRenderer, unsupported: unsupported.length, diagnostics: report.diagnostics.length },
  });
  const artifact = await writeReportArtifact(reportPath, report, { kind: "preview-details" });
  if (artifact) result.artifacts.push(artifact);
  if (jsonOutput) printResultJson(result);
  else if (!report.imageRenderer.enabled) log.warn("image rendering unavailable", { reason: report.imageRenderer.reason, ...(reportPath ? { report: reportPath } : {}) });
  else log[report.ok ? "ok" : "warn"]("preview complete", { unsupported: unsupported.length, diagnostics: report.diagnostics.length, ...(reportPath ? { report: reportPath } : {}) });
  process.exitCode = resultExitCode(result);
  return result;
}
