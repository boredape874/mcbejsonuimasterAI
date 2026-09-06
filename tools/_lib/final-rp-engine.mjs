import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { indexResourcePack } from "./final-rp-v2/rp-index.mjs";
import { resolveControl, resolveRoute } from "./final-rp-v2/resolver.mjs";
import { materializeCollections, projectInteractionState } from "./final-rp-v2/state-engine.mjs";
import { layoutTree } from "./final-rp-v2/layout-engine.mjs";
import { buildDisplayList, FONT_UNAVAILABLE } from "./final-rp-v2/display-list.mjs";
import { MinecraftFontEngine } from "./final-rp-v2/font-engine.mjs";
import { createVanillaProfile, discoverMinecraftUwp } from "./final-rp-v2/vanilla-profile.mjs";
import { clearRendererCaches, renderDisplayList } from "./final-rp-v2/renderer.mjs";
import { compareStateReports, validateDisplayList } from "./final-rp-v2/validator.mjs";
import { DeviceTransform } from "./final-rp-v2/device-transform.mjs";
import { buildBindingGraph } from "./final-rp-v2/bindings.mjs";
import { classifyUnresolved as classifyImpacts } from "./final-rp-v2/unresolved-impact.mjs";
import { loadResearchLock } from "./upstream-policy.mjs";
import { compatibilityReport, loadFixtureCatalog } from "./upstream-fixtures.mjs";
import { loadBlackBoxCaptures } from "./upstream-blackbox.mjs";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const safeName = (value) => String(value).replaceAll(/[^A-Za-z0-9_.-]+/g, "-");
const inside = (root, target) => { const path = relative(resolve(root), resolve(target)); return path === "" || (!path.startsWith("..") && !isAbsolute(path)); };
const indexCache=new Map(),overlayIndexCache=new Map(),profileCache=new Map();let discoveryCache=null;
const cacheStats={indexHits:0,indexMisses:0,profileHits:0,profileMisses:0};
const CACHE_SCHEMA="final-rp-content-cache@1";
async function stamp(path){try{const info=await stat(path);if(info.isDirectory()){const names=(await readdir(path)).sort();return createHash("sha256").update(CACHE_SCHEMA).update(names.join("\0")).digest("hex");}return createHash("sha256").update(CACHE_SCHEMA).update(await readFile(path)).digest("hex");}catch{return"missing";}}
async function snapshot(paths){return new Map(await Promise.all([...new Set(paths)].map(async path=>[path,await stamp(path)])));}
async function current(snapshotValue){for(const[path,value]of snapshotValue)if(await stamp(path)!==value)return false;return true;}
async function cachedOverlayIndex(vanillaRoot){
  if(!vanillaRoot)return null;
  const key=resolve(vanillaRoot),cached=overlayIndexCache.get(key),now=Date.now();
  if(cached&&await current(cached.stamps)){cached.checkedAt=now;return cached;}
  const index=await indexResourcePack(key,{targetLayer:"overlay",includeControlProvenance:false}),paths=[join(key,"ui","_ui_defs.json"),...index.files.map(file=>file.file)];
  const entry={index,stamps:await snapshot(paths),checkedAt:now,revision:(cached?.revision??0)+1};overlayIndexCache.set(key,entry);return entry;
}
function mergeIndexes(target,overlay){if(!overlay)return target;return{targetRoot:target.targetRoot,roots:[...overlay.roots,...target.roots],files:[...overlay.files,...target.files],controls:new Map([...overlay.controls,...target.controls]),unresolved:[...overlay.unresolved,...target.unresolved],globals:{...overlay.globals,...target.globals},globalSources:[...overlay.globalSources,...target.globalSources]};}
async function cachedIndex(rpRoot,vanillaRoot){
  const targetRoot=resolve(rpRoot),key=`${targetRoot}\0${vanillaRoot?resolve(vanillaRoot):""}`,overlay=await cachedOverlayIndex(vanillaRoot),cached=indexCache.get(key),now=Date.now();
  if(cached&&cached.overlayRevision===(overlay?.revision??0)&&await current(cached.stamps)){cached.checkedAt=now;cacheStats.indexHits++;return cached.index;}
  cacheStats.indexMisses++;const target=await indexResourcePack(targetRoot,{includeControlProvenance:false}),paths=[join(targetRoot,"ui","_ui_defs.json"),...target.files.map(file=>file.file)],index=mergeIndexes(target,overlay?.index);indexCache.set(key,{index,stamps:await snapshot(paths),checkedAt:now,overlayRevision:overlay?.revision??0});return index;
}
export function finalRpCacheStats(){return{...cacheStats,indexEntries:indexCache.size,overlayIndexEntries:overlayIndexCache.size,profileEntries:profileCache.size};}
export function clearFinalRpCaches(){indexCache.clear();overlayIndexCache.clear();profileCache.clear();discoveryCache=null;Object.assign(cacheStats,{indexHits:0,indexMisses:0,profileHits:0,profileMisses:0});clearRendererCaches();}

function classifyUnresolved(entries, rpRoot, vanillaRoot) {
  const deferred = [], candidates = [];
  for (const entry of entries) {
    const overlayMissingFile = entry.kind === "unreadable_ui_file"
      && entry.file
      && vanillaRoot
      && inside(vanillaRoot, entry.file)
      && !inside(rpRoot, entry.file);
    (overlayMissingFile ? deferred : candidates).push(entry);
  }
  const impact=classifyImpacts(candidates);
  return { blocking:impact.blocking, warnings:[...deferred.map(entry=>({...entry,impact:"decorative",severity:"warning"})),...impact.warnings], impact };
}

export async function loadCanvas() {
  try { return await import("@napi-rs/canvas"); }
  catch (error) { throw new Error(`@napi-rs/canvas is required for final-RP v2 rendering: ${error.message}`); }
}

async function vanillaContext(args = {}) {
  let vanillaRoot = args.vanillaRoot ? resolve(args.vanillaRoot) : null;
  let discovered = null;
  if (!vanillaRoot) {
    discovered = discoveryCache ??= await discoverMinecraftUwp();
    vanillaRoot = discovered.vanillaRoot;
  }
  const key=vanillaRoot||"unavailable",cached=profileCache.get(key);let profile;
  if(cached&&await current(cached.stamps)){cached.checkedAt=Date.now();cacheStats.profileHits++;profile=cached.profile;}
  else{cacheStats.profileMisses++;profile=await createVanillaProfile({vanillaRoot,version:discovered?.version});const paths=vanillaRoot?[join(vanillaRoot,"manifest.json"),join(vanillaRoot,"font"),join(vanillaRoot,"font","font_metadata.json"),join(vanillaRoot,"font","default8.png"),...(profile.files||[]).map(file=>join(vanillaRoot,...file.path.split("/")))]:[];profileCache.set(key,{profile,stamps:await snapshot(paths),checkedAt:Date.now()});}
  return { vanillaRoot, profile };
}

function fixtureForState(fixture = {}, state = "default") {
  const next = structuredClone(fixture);
  if (state === "default") { next.hoveredIndex = null; next.pressedIndex = null; next.focusedIndex = null; }
  else if (state === "hover") { next.pressedIndex = null; next.focusedIndex = null; }
  else if (state === "pressed") { next.pressedIndex ??= next.hoveredIndex; next.hoveredIndex = null; next.focusedIndex = null; }
  else if (state === "focus") { next.focusedIndex ??= next.hoveredIndex; next.hoveredIndex = null; next.pressedIndex = null; }
  return next;
}

function attachFonts(layout, profile, unresolved) {
  if (profile?.font?.status !== "available") {
    for (const node of layout.nodes) if (node.props?.type === "label") node.props.font_status = FONT_UNAVAILABLE;
    unresolved.push(...(profile?.diagnostics ?? [{ kind: FONT_UNAVAILABLE }]));
    return;
  }
  const engine = new MinecraftFontEngine(profile.font);
  for (const node of layout.nodes) {
    if (node.props?.type !== "label") continue;
    try { engine.attachGlyphRun(node); }
    catch (error) {
      node.props.font_status = error.code ?? FONT_UNAVAILABLE;
      unresolved.push({ kind: error.code ?? FONT_UNAVAILABLE, control: node.qualified ?? node.id, pointer: node.pointer, message: error.message, details: error.details ?? {} });
    }
  }
}

function materializeDefaultLabelSizes(tree, profile) {
  if (profile?.font?.status !== "available") return;
  const engine = new MinecraftFontEngine(profile.font);
  function visit(node) {
    const props=node?.props||{};
    if(props.type==="label"&&Array.isArray(props.size)&&props.size.includes("default")){
      try {
        const run=engine.layoutText({text:props.text??"",fontType:props.font_type??props.fontType??"default",fontSize:props.font_size??props.fontSize??"normal",fontScale:props.font_scale_factor??props.fontScale??1,rect:{x:0,y:0,w:4096,h:4096},alignment:"left",shadow:props.shadow??false});
        props.size=props.size.map((value,index)=>value==="default"?Math.ceil(index===0?run.contentSize.w:run.contentSize.h):value);
      } catch (error) {
        props.font_status=error.code??FONT_UNAVAILABLE;
      }
    }
    for(const child of node?.controls||[])visit(child);
  }
  visit(tree);
}

async function resolveBundle(args = {}) {
  if (!args.rpRoot) throw new Error("rpRoot is required");
  const rpRoot = resolve(args.rpRoot), rawFixture = structuredClone(args.fixture ?? {});
  if (args.routeToken && !rawFixture.title) rawFixture.title = args.routeToken;
  const fixture = fixtureForState(rawFixture, args.interactionState ?? "default");
  const { vanillaRoot, profile } = await vanillaContext(args);
  const index = await cachedIndex(rpRoot, vanillaRoot);
  let control = args.control, route = null, routeUnresolved = [];
  if (!control) {
    const routed = resolveRoute(index, fixture);
    route = routed.route; routeUnresolved = routed.unresolved;
    control = route?.target;
  }
  if (!control) throw new Error("control is required when the fixture does not resolve exactly one server-form route");
  const fixtureEnvironment = {
    "#title_text": fixture.title ?? "",
    "#form_text": fixture.body ?? "",
    ...(args.variables ?? {}),
  };
  const resolved = resolveControl(index, control, { namespace: args.namespace, environment: fixtureEnvironment, overrides: args.overrides, fixture });
  if (!resolved.tree) throw new Error(`Control could not be resolved: ${control}`);
  const collections = materializeCollections(resolved.tree, fixture);
  const interaction = projectInteractionState(collections.tree, fixture, { index, interactionState: args.interactionState ?? "default" });
  const bindingGraph = buildBindingGraph(interaction.tree, { globals:{...index.globals,...fixtureEnvironment}, fixture });
  materializeDefaultLabelSizes(interaction.tree, profile);
  const layout = layoutTree(interaction.tree, { viewport: args.viewport ?? [480, 270], defaults: args.defaults, content: args.content, contentMax: args.contentMax });
  const unresolved = [
    ...routeUnresolved.map((entry) => ({ ...entry, stage: "route" })),
    ...resolved.unresolved.map((entry) => ({ ...entry, stage: "resolver" })),
    ...collections.unresolved.map((entry) => ({ ...entry, stage: "collection" })),
    ...interaction.unresolved.map((entry) => ({ ...entry, stage: "interaction" })),
    ...bindingGraph.unresolved.map((entry) => ({ ...entry, stage: "binding" })),
    ...layout.unresolved.map((entry) => ({ ...entry, stage: "layout" })),
  ];
  attachFonts(layout, profile, unresolved);
  const classified = classifyUnresolved(unresolved, rpRoot, vanillaRoot);
  const displayList = buildDisplayList({ ...layout, unresolved: classified.blocking });
  return {
    rpRoot,
    vanillaRoot,
    profile,
    fixture,
    index,
    control,
    route,
    tree: interaction.tree,
    layout,
    displayList,
    unresolved: displayList.unresolved,
    warnings: classified.warnings,
    diagnostics: interaction.diagnostics ?? [],
    bindingGraph,
    collectionProvenance: collections.provenance ?? [],
    hitAnalysis: layout.hitAnalysis,
    unresolvedImpact: classified.impact,
  };
}

function publicProfile(profile) {
  return { schemaVersion: profile.schemaVersion, source: profile.source, version: profile.version, status: profile.status, fingerprint: profile.fingerprint ?? null, font: profile.font?.status === "available" ? { status: "available", defaultAtlas: profile.font.defaultAtlas?.size, glyphPages: profile.font.glyphAtlases?.length ?? 0, aliases: Object.keys(profile.font.aliases ?? {}).sort(), types: Object.keys(profile.font.types ?? {}).sort() } : profile.font, diagnostics: profile.diagnostics ?? [] };
}

export async function openProject(args) {
  const { vanillaRoot, profile } = await vanillaContext(args);
  const index = await cachedIndex(args.rpRoot, vanillaRoot);
  const classified = classifyUnresolved(index.unresolved, resolve(args.rpRoot), vanillaRoot);
  const targetFiles = index.files.filter((file) => file.layer === "target");
  const targetControls = [...index.controls.values()].filter((control) => control.layer === "target");
  return { ok: classified.blocking.length === 0, engine: "final-rp-v2", rpRoot: resolve(args.rpRoot), fileCount: targetFiles.length, controlCount: targetControls.length, overlayFileCount: index.files.length - targetFiles.length, overlayControlCount: index.controls.size - targetControls.length, namespaces: [...new Set(targetFiles.map((file) => file.namespace).filter(Boolean))].sort(), vanillaProfile: publicProfile(profile), unresolved: classified.blocking, warnings: classified.warnings };
}

export async function resolveScreen(args) {
  const bundle = await resolveBundle(args);
  return { ok: bundle.unresolved.length === 0, engine: "final-rp-v2", control: bundle.control, route: bundle.route, routeTrace:bundle.route, tree: bundle.tree, layout: { viewport: bundle.layout.viewport, nodes: bundle.layout.nodes, unresolved: bundle.layout.unresolved, hitAnalysis:bundle.hitAnalysis }, bindingGraph:bundle.bindingGraph, collectionProvenance:bundle.collectionProvenance, stateModel:bundle.layout.nodes.filter(node=>node.interaction).map(node=>({control:node.qualified||node.id,pointer:node.pointer,...node.interaction})), hitAnalysis:bundle.hitAnalysis, displayList: bundle.displayList, unresolved: bundle.unresolved, unresolvedImpact:bundle.unresolvedImpact, warnings: bundle.warnings, vanillaProfile: publicProfile(bundle.profile), sourceAttribution: bundle.index.files.map(({ relative, namespace, hash, layer }) => ({ relative, namespace, hash, layer })) };
}

export async function renderScreen(args) {
  const bundle = await resolveBundle(args), canvasMod = await loadCanvas();
  const outputDir = resolve(args.outputDir ?? join(repoRoot, "workspace", "final-rp-v2"));
  await mkdir(outputDir, { recursive: true });
  const state = args.interactionState ?? "default", outputPath = resolve(args.outputPath ?? join(outputDir, `${safeName(bundle.control)}-${state}.png`));
  if (inside(bundle.rpRoot, outputPath)) throw new Error("final-RP render output must remain outside the source resource pack");
  await mkdir(dirname(outputPath), { recursive: true });
  const render = await renderDisplayList({ canvasMod, displayList: bundle.displayList, targetRoot: bundle.rpRoot, vanillaRoot: bundle.vanillaRoot, outputPath, analyzeControls: args.analyzeControls !== false });
  const validation = validateDisplayList(render, { constraints: args.constraints ?? [], toleranceUi: args.toleranceUi ?? 1 });
  const reportPath = outputPath.replace(/\.png$/i, ".report.json");
  const compactControls = Object.fromEntries(Object.entries(render.controls).map(([id, control]) => [id, Object.fromEntries(Object.entries(control).filter(([key]) => key !== "mask"))]));
  const compactRender = { viewport: render.viewport, hash: render.hash, outputPath: render.outputPath, outputAlpha:render.outputAlpha, renderedTextures:render.renderedTextures, controls: compactControls, diagnostics: render.diagnostics };
  const report = { schemaVersion: 2, engine: "final-rp-v2", ok: bundle.unresolved.length === 0 && validation.ok, control: bundle.control, state, outputPath, hash: render.hash, viewport: render.viewport, outputAlpha:render.outputAlpha, renderedTextures:render.renderedTextures, unresolved: bundle.unresolved, unresolvedImpact:bundle.unresolvedImpact, warnings: bundle.warnings, diagnostics: [...bundle.diagnostics, ...render.diagnostics], controls: compactControls, routeTrace:bundle.route, bindingGraph:bundle.bindingGraph, collectionProvenance:bundle.collectionProvenance, stateModel:bundle.layout.nodes.filter(node=>node.interaction).map(node=>({control:node.qualified||node.id,pointer:node.pointer,...node.interaction})), hitAnalysis:bundle.hitAnalysis, sourceAttribution:bundle.index.files.map(({relative,namespace,hash,layer})=>({relative,namespace,hash,layer})), validation, vanillaProfile: publicProfile(bundle.profile) };
  if(args.writeReport!==false)await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  return { ...report, reportPath:args.writeReport===false?null:reportPath, render: compactRender };
}

async function contactSheet(canvasMod, reports, outputPath) {
  const entries = Object.entries(reports), width = Math.max(...entries.map(([, report]) => report.render.viewport[0])), height = Math.max(...entries.map(([, report]) => report.render.viewport[1]));
  const canvas = canvasMod.createCanvas(width * entries.length, height), context = canvas.getContext("2d");
  context.imageSmoothingEnabled = false;
  for (const [index, [, report]] of entries.entries()) {
    const image = await canvasMod.loadImage(report.outputPath);
    context.drawImage(image, index * width, 0);
  }
  await writeFile(outputPath, await canvas.encode("png"));
  return outputPath;
}

export async function renderStates(args) {
  const states = args.states ?? ["default", "hover", "pressed"], reports = {};
  for (const state of states) reports[state] = await renderScreen({ ...args, interactionState: state });
  const outputDir = resolve(args.outputDir ?? join(repoRoot, "workspace", "final-rp-v2"));
  const sheetPath = join(outputDir, `${safeName(args.control ?? "server-form")}-contact-sheet.png`);
  await contactSheet(await loadCanvas(), reports, sheetPath);
  return { ok: Object.values(reports).every((report) => report.ok), engine: "final-rp-v2", reports, contactSheet: sheetPath };
}

export async function inspectControl(args) {
  const bundle = await resolveBundle(args);
  const match = bundle.layout.nodes.find((node) => node.pointer === args.controlId || node.qualified === args.controlId || node.id === args.controlId);
  if (!match) return { ok: false, error: { code: "CONTROL_NOT_FOUND", message: `Control was not found: ${args.controlId}` } };
  const command = bundle.displayList.commands.find((entry) => entry.id === match.id || entry.control === match.qualified || entry.control === match.id) ?? null;
  return { ok: true, engine: "final-rp-v2", control: match, command, unresolved: bundle.unresolved.filter((entry) => entry.pointer?.startsWith(match.pointer)) };
}

export async function validateLayout(args) {
  const rendered = await renderScreen(args);
  return { ...rendered.validation, control: rendered.control, outputPath: rendered.outputPath, reportPath: rendered.reportPath, unresolved: rendered.unresolved };
}

export async function validateStateTextures(args) {
  const rendered = await renderStates(args), raw = Object.fromEntries(Object.entries(rendered.reports).map(([state, report]) => [state, report.render]));
  const comparison = compareStateReports(raw, { bboxTolerance: args.toleranceSourcePx ?? 1, centroidTolerance: args.toleranceSourcePx ?? 1 });
  return { ...comparison, reports: rendered.reports, contactSheet: rendered.contactSheet };
}

export async function measureText(args) {
  const { profile } = await vanillaContext(args);
  if (profile.font?.status !== "available") return { ok: false, error: { code: FONT_UNAVAILABLE, message: "Minecraft bitmap font profile is unavailable", details: profile.diagnostics } };
  const engine = new MinecraftFontEngine(profile.font), rect = args.rect ?? { x: 0, y: 0, w: args.maxWidth ?? 4096, h: args.maxHeight ?? 4096 };
  const glyphRun = engine.layoutText({ text: args.text, fontType: args.fontType ?? "default", fontSize: args.fontSize ?? "normal", fontScale: args.fontScaleFactor ?? 1, rect, alignment: args.alignment ?? "left", shadow: args.shadow ?? false });
  return { ok: true, glyphRun, vanillaProfile: publicProfile(profile) };
}

export async function calibrateRenderer(args) {
  const canvasMod = await loadCanvas(), image = await canvasMod.loadImage(args.screenshotPath);
  let samples = args.correspondences;
  if ((!samples || samples.length < 3) && Array.isArray(args.rootRect) && args.rootRect.length === 4) {
    const [x, y, w, h] = args.rootRect, logical = args.logicalSize ?? [480, 270];
    samples = [{ logical: [0, 0], pixel: [x, y] }, { logical: [logical[0], 0], pixel: [x + w, y] }, { logical: [0, logical[1]], pixel: [x, y + h] }, { logical: logical, pixel: [x + w, y + h] }];
  }
  if (!samples || samples.length < 3) return { ok: false, error: { code: "CALIBRATION_POINTS_REQUIRED", message: "At least three correspondences or a rootRect are required" } };
  const transform = DeviceTransform.calibrate({ screenshotSize: [image.width, image.height], logicalSize: args.logicalSize ?? [480, 270], guiScale: args.guiScale ?? 1, safeArea: args.safeArea ?? [0, 0, 0, 0], samples });
  return { ok: true, transform: transform.toJSON(), screenshotHash: createHash("sha256").update(await readFile(args.screenshotPath)).digest("hex") };
}

export async function validateUpstreamCompatibility(args = {}) {
  const lockPath = resolve(args.lockPath ?? join(repoRoot, "config", "research-lock.json")), lock = await loadResearchLock(lockPath);
  const catalog = await loadFixtureCatalog(resolve(args.fixturesPath ?? join(repoRoot, lock.policy.offlineFixture)), lock);
  const captures = await loadBlackBoxCaptures(resolve(args.capturesPath ?? join(repoRoot, "workspace", "upstream-captures")), catalog);
  const report = compatibilityReport(catalog, captures);
  const selected = report.results.filter((item) => (!args.sourceIds?.length || args.sourceIds.includes(item.source)) && (!args.fixtureIds?.length || args.fixtureIds.includes(item.id)));
  return { ...report, results: selected, ok: report.ready };
}
