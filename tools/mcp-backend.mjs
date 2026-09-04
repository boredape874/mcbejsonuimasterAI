import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

async function optionalModule(relativePath) {
  const path = resolve(relativePath);
  return existsSync(path) ? import(pathToFileURL(path)) : null;
}

function projectSummary(project) {
  return {
    rpRoot: project.rpRoot,
    defsPath: project.defsPath,
    files: project.files.map(({ relative, namespace }) => ({ relative, namespace })),
    namespaceCount: new Set(project.files.map(({ namespace }) => namespace).filter(Boolean)).size,
    controlCount: project.controls.size,
    diagnostics: project.diagnostics,
  };
}

function addSourceTrace(node) {
  if (!node || typeof node !== "object") return node;
  const qualified = node.qualified ?? null, sourceFile = typeof node.source === "string" ? node.source : node.source?.relative, provenance = node.provenance ?? {};
  node.sourceTrace ??= {
    definition: sourceFile ? { file: sourceFile, jsonPointer: provenance[""]?.sourcePointer ?? (qualified ? `/${qualified.split(".").slice(1).join(".")}` : null), namespace: node.namespace ?? null, control: qualified } : null,
    inheritance: qualified ? [qualified] : [],
    instanceOverrides: [],
    propertyOrigins: Object.fromEntries(Object.keys(node.props ?? {}).map((key) => [`/props/${key}`, provenance[`/${key}`] ?? (sourceFile ? { file: sourceFile, control: qualified } : { kind: "inline" })])),
  };
  for (const child of node.controls ?? []) addSourceTrace(child);
  return node;
}

function sourceAttribution(bundle) {
  return [...new Map(bundle.layout.nodes.filter((node) => node.source).map((node) => { const file=typeof node.source === "string" ? node.source : node.source.relative; return [file, { kind: node.source?.layer ?? "target-rp", file, hash: node.source?.hash ?? null, namespace: node.namespace ?? null }]; })).values()];
}

function isInside(root, target) {
  const rel = relative(resolve(root), resolve(target));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function requestedControl(args, resolver, project) {
  if (args.control) return { control: args.control, route: null, unresolved: [] };
  const fixture = { ...(args.fixture ?? {}) };
  if (args.routeToken && !fixture.title) fixture.title = args.routeToken;
  const routed = resolver.resolveServerFormRoute(project, fixture);
  if (!routed.route?.target) throw new Error("control is required when the server-form fixture does not resolve exactly one route");
  return { control: routed.route.target, route: routed.route, unresolved: routed.unresolved };
}

async function resolveBundle(args, resolver) {
  const project = await resolver.loadRpProject(args.rpRoot);
  const selected = requestedControl(args, resolver, project);
  const resolved = resolver.resolveControl(project, selected.control, { fixture: args.fixture, variables: args.variables, overrides: args.overrides });
  addSourceTrace(resolved.tree);
  const layout = resolver.layoutResolvedTree(resolved.tree, { viewport: args.viewport ?? [480, 270] });
  return { project, control: selected.control, route: selected.route, tree: resolved.tree, layout, unresolved: [...selected.unresolved, ...resolved.unresolved, ...layout.unresolved] };
}

export async function createLocalBackend() {
  const resolver = await optionalModule("tools/_lib/final-rp-resolver.mjs");
  const renderer = await optionalModule("tools/_lib/final-rp-renderer.mjs");
  const validator = await optionalModule("tools/_lib/final-rp-validator.mjs");
  const screenshot = await optionalModule("tools/_lib/screenshot-compare.mjs");
  const calibration = await optionalModule("tools/_lib/renderer-calibration.mjs");
  const fonts = await optionalModule("tools/_lib/font-metrics.mjs");
  const compatibility = await optionalModule("tools/_lib/upstream-compatibility.mjs");
  const engine = await optionalModule("tools/_lib/final-rp-engine.mjs");
  const backend = {};

  if (resolver) {
    backend.openProject = async ({ rpRoot }) => projectSummary(await resolver.loadRpProject(rpRoot));
    backend.resolveScreen = async (args) => {
      const bundle = await resolveBundle(args, resolver);
      return { ok: bundle.unresolved.length === 0, control: bundle.control, route: bundle.route, tree: bundle.tree, layout: bundle.layout, unresolved: bundle.unresolved, sourceAttribution: sourceAttribution(bundle) };
    };
    backend.inspectControl = async (args) => {
      const bundle = await resolveBundle(args, resolver);
      const match = bundle.layout.nodes.find((node) => node.path === args.controlId || node.qualified === args.controlId || node.id === args.controlId);
      if (!match) return { ok: false, error: { code: "CONTROL_NOT_FOUND", message: `Control was not found: ${args.controlId}` } };
      return { ok: true, control: match, unresolved: bundle.unresolved.filter((item) => item.path?.startsWith(match.path)), sourceAttribution: sourceAttribution(bundle) };
    };
  }

  if (resolver && renderer) {
    backend.renderScreen = async (args) => {
      const bundle = await resolveBundle(args, resolver);
      const outputDir = resolve(args.outputDir ?? join("workspace", "mcp-render"));
      if (isInside(args.rpRoot, outputDir)) throw new Error("outputDir must be outside rpRoot; MCP rendering never writes into the source pack");
      await mkdir(outputDir, { recursive: true });
      const state = args.interactionState ?? "default";
      const outputPath = join(outputDir, `${basename(String(bundle.control).replaceAll(".", "-"))}-${state}.png`);
      const interaction = {
        hoveredIndex: state === "hover" ? args.fixture?.hoveredIndex : null,
        pressedIndex: state === "pressed" ? args.fixture?.pressedIndex ?? args.fixture?.hoveredIndex : null,
        focusedIndex: state === "focus" ? args.fixture?.focusedIndex : null,
      };
      const report = await renderer.renderResolvedTree({ canvasMod: await renderer.loadCanvas(), project: bundle.project, layout: bundle.layout, outputPath, interaction, overlays: args.overlays === true });
      return { ok: report.diagnostics.length === 0 && bundle.unresolved.length === 0, control: bundle.control, outputPath, hash: report.hash, render: report, unresolved: bundle.unresolved, sourceAttribution: sourceAttribution(bundle) };
    };
    backend.renderStates = async (args) => {
      const states = args.states ?? ["default", "hover", "pressed"];
      const reports = {};
      for (const state of states) reports[state] = await backend.renderScreen({ ...args, interactionState: state });
      return { ok: Object.values(reports).every((report) => report.ok), reports };
    };
  }

  if (resolver && validator) {
    backend.validateLayout = async (args) => {
      const bundle = await resolveBundle(args, resolver);
      const report = validator.validateResolvedLayout(bundle.layout, null, { tolerance: args.toleranceUi ?? 1 });
      return { ...report, control: bundle.control, unresolved: bundle.unresolved };
    };
    backend.proposeCorrections = async (args) => {
      const maxDeltaUi = Math.min(2, args.maxDeltaUi ?? 2), candidates = [], rejected = [];
      for (const record of args.evidence ?? []) {
        const items = record.result?.issues ?? record.result?.elements ?? record.result?.result?.issues ?? [];
        for (const item of items) {
          const proposal = item.proposal ?? item.patchProposal;
          if (!proposal) continue;
          const file = resolve(args.rpRoot, proposal.file ?? "");
          if (!isInside(args.rpRoot, file)) { rejected.push({ proposal, reason: "path_escape" }); continue; }
          if (!proposal.jsonPointer?.startsWith("/") || proposal.unresolved) { rejected.push({ proposal, reason: "unresolved_pointer" }); continue; }
          if (args.allowPointers?.length && !args.allowPointers.some((prefix) => proposal.jsonPointer.startsWith(prefix))) { rejected.push({ proposal, reason: "pointer_not_allowed" }); continue; }
          const delta = proposal.deltaUi ?? item.deltaUi ?? 0;
          if (Math.abs(delta) > maxDeltaUi) { rejected.push({ proposal, reason: "delta_exceeds_limit" }); continue; }
          try {
            const bytes = await readFile(file), fileHash = createHash("sha256").update(bytes).digest("hex");
            if (proposal.fileHash && proposal.fileHash !== fileHash) { rejected.push({ proposal, reason: "stale_file_hash" }); continue; }
            candidates.push({ file, jsonPointer: proposal.jsonPointer, oldValue: proposal.oldValue, newValue: proposal.newValue, reason: proposal.reason ?? item.kind, evidenceIds: args.evidenceIds, expectedResidual: proposal.expectedResidual ?? null, source: { fileHash, propertyOrigin: proposal.propertyOrigin ?? null }, preconditions: [{ op: "test", path: proposal.jsonPointer, value: proposal.oldValue }], jsonPatch: [{ op: "test", path: proposal.jsonPointer, value: proposal.oldValue }, { op: "replace", path: proposal.jsonPointer, value: proposal.newValue }], applyAllowed: false });
          } catch (error) { rejected.push({ proposal, reason: "source_unreadable", message: error.message }); }
        }
      }
      return { ok: true, readOnly: true, maxDeltaUi, patches: candidates, rejected, note: candidates.length ? "Read-only RFC6902 proposals; no files were changed." : "No deterministic evidence-backed correction was available." };
    };
  }
  if (renderer && validator && backend.renderStates) {
    backend.validateStateTextures = async (args) => {
      const rendered = await backend.renderStates({ ...args, states: args.states ?? ["default", "hover", "pressed"] });
      const raw = Object.fromEntries(Object.entries(rendered.reports).map(([state, report]) => [state, report.render]));
      const comparison = validator.compareStateReports(raw, args.toleranceSourcePx ?? 1);
      return { ...comparison, reports: rendered.reports };
    };
  }

  const copy = (source, names) => {
    if (!source) return;
    for (const name of names) if (typeof source[name] === "function" && !backend[name]) backend[name] = source[name];
  };
  copy(screenshot, ["measureReference", "compareScreenshot"]);
  copy(calibration, ["calibrateRenderer"]);
  copy(fonts, ["measureText"]);
  copy(compatibility, ["validateUpstreamCompatibility"]);
  if (engine) for (const name of ["openProject", "resolveScreen", "renderScreen", "renderStates", "inspectControl", "validateLayout", "validateStateTextures", "calibrateRenderer", "measureText", "validateUpstreamCompatibility"]) {
    if (typeof engine[name] === "function") backend[name] = engine[name];
  }
  return backend;
}
