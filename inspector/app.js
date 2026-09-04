const $ = (id) => document.getElementById(id);
let state = "default", evidenceTab="route", lastLayout = null, lastRender = null, selectedNode = null, projectId = null, projectRevision = null, fixtureData = {};

async function api(name, args) {
  $("status").textContent = `${name}…`;
  const response = await fetch(`/api/${name}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(args) });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message ?? data.error ?? `${response.status}`);
  $("status").textContent = data.ok === false ? "경고 있음" : "완료";
  return data;
}

function request(name) {
  const [w, h] = $("viewport").value.split("x").map(Number), index = Number($("index").value), title = $("title").value.trim();
  const fixture = { ...fixtureData, ...(title ? { title } : {}), hoveredIndex: index, pressedIndex: index, focusedIndex: index };
  const base = { control: $("control").value.trim() || undefined, routeToken: title || fixture.title || undefined, viewport: [w, h], fixture, interactionState: state, overlays: $("overlay").checked };
  return name === "openProject" ? { rpRoot: $("rpRoot").value.trim() } : { ...base, ...(projectId ? { projectId } : { rpRoot: $("rpRoot").value.trim() }) };
}

function nodePath(node) { return node?.path ?? node?.pointer ?? node?.qualified ?? node?.id ?? ""; }
function sourcePointer(node) {
  const direct = node?.provenance?.[node?.pointer ?? ""];
  if (direct?.sourcePointer) return direct.sourcePointer;
  const inherited = Object.values(node?.provenance ?? {}).find((entry) => entry?.sourcePointer);
  return inherited?.sourcePointer ?? node?.sourceTrace?.definition?.jsonPointer ?? "";
}
function renderedControl(node) {
  const controls = lastRender?.controls ?? lastRender?.render?.controls ?? {};
  return Object.values(controls).find((control) => control.pointer === node?.pointer) ?? controls[node?.qualified] ?? controls[node?.id] ?? null;
}
function selectNode(node) {
  selectedNode = node;
  $("pointer").value = sourcePointer(node);
  document.querySelectorAll(".node").forEach((element) => element.classList.toggle("selected", element.dataset.path === nodePath(node)));
  const rendered = renderedControl(node), legacyPath = nodePath(node);
  const alphaBBox = rendered?.alphaBBox ?? lastRender?.render?.alphaBoxes?.[legacyPath] ?? lastRender?.alphaBoxes?.[legacyPath] ?? null;
  const baseline = rendered?.baseline ?? lastRender?.render?.baselines?.[legacyPath] ?? lastRender?.baselines?.[legacyPath] ?? null;
  renderEvidence();
}
function evidenceFor(tab){const data=lastRender||lastLayout||{};if(tab==="route")return data.routeTrace??data.route??null;if(tab==="binding")return data.bindingGraph??null;if(tab==="state")return data.stateModel??selectedNode?.interaction??null;if(tab==="hit")return data.hitAnalysis??data.layout?.hitAnalysis??null;return {selectedControl:selectedNode?{control:nodePath(selectedNode),sourcePointer:sourcePointer(selectedNode),source:selectedNode.source,propertyOrigins:selectedNode.provenance,collectionProvenance:selectedNode.collectionProvenance}:null,sourceAttribution:data.sourceAttribution??null};}
function renderEvidence(){$("evidencePanel").textContent=JSON.stringify(evidenceFor(evidenceTab)??{message:`${evidenceTab} evidence unavailable`},null,2);}
function renderTree(layout) {
  lastLayout = layout;
  const query = $("filter").value.toLowerCase();
  $("tree").replaceChildren(...(layout?.nodes ?? []).filter((node) => !query || `${nodePath(node)} ${node.qualified ?? ""} ${sourcePointer(node)}`.toLowerCase().includes(query)).map((node) => {
    const path = nodePath(node), element = document.createElement("div"); element.className = "node"; element.dataset.path = path;
    element.style.paddingLeft = `${6 + (path.match(/\//g)?.length ?? 0) * 8}px`; element.textContent = path; element.title = sourcePointer(node);
    element.onclick = () => selectNode(node); return element;
  }));
}
function showLayer(id, path) {
  const image = $(id); image.src = `/api/artifact?path=${encodeURIComponent(path)}&t=${Date.now()}`;
  $("stage").querySelector("p")?.remove();
}

async function action(name) {
  try {
    if (name === "renderScreen" || name === "validateLayout") {
      const resolved = await api("resolveScreen", request("resolveScreen"));
      if (resolved.layout) renderTree(resolved.layout);
    }
    const data = await api(name, request(name));
    if (name === "openProject" && data.projectId) { projectId = data.projectId; projectRevision = data.projectRevision; $("status").textContent = `인덱싱 완료 · ${projectRevision.slice(0, 8)}`; }
    if (data.layout) renderTree(data.layout);
    if (["renderScreen","resolveScreen","validateLayout"].includes(name)) lastRender = data;
    renderEvidence();
    if (data.outputPath) showLayer("renderLayer", data.outputPath);
    if (selectedNode) selectNode(selectedNode);
    $("issues").textContent = JSON.stringify({ schemaVersion: data.schemaVersion, projectRevision: data.projectRevision, evidenceId: data.evidenceId, calibrationId: data.calibrationId, fontEvidence: data.fontEvidence, sourceAttribution: data.sourceAttribution, issues: data.validation ?? data.issues ?? data.unresolved ?? data.diagnostics ?? data.error ?? null }, null, 2);
  } catch (error) { $("status").textContent = "실패"; $("issues").textContent = error.stack ?? error.message; }
}

async function importEvidence(kind) {
  try {
    const path = $(kind === "reference" ? "referencePath" : "screenshotPath").value.trim(), data = await api("evidence/import", { path, kind });
    showLayer(kind === "reference" ? "referenceLayer" : "screenshotLayer", data.artifactPath);
    $(kind === "reference" ? "referenceOpacity" : "screenshotOpacity").value = ".5";
    $(kind === "reference" ? "referenceLayer" : "screenshotLayer").style.opacity = ".5";
    $("issues").textContent = JSON.stringify(data, null, 2);
  } catch (error) { $("issues").textContent = error.stack ?? error.message; }
}
async function loadFixture() {
  try {
    const path = $("fixturePath").value.trim(), data = await api("fixture/read", { path }); fixtureData = data.fixture ?? {};
    if (fixtureData.title) $("title").value = fixtureData.title;
    $("issues").textContent = JSON.stringify({ readOnly:data.readOnly, sourcePath:data.sourcePath, sha256:data.sha256, buttonCount:Array.isArray(fixtureData.buttons)?fixtureData.buttons.length:0 }, null, 2);
  } catch (error) { $("issues").textContent = error.stack ?? error.message; }
}
async function nudge(axis, delta) {
  if (!selectedNode || !projectId) return void ($("issues").textContent = "먼저 프로젝트와 컨트롤을 선택하세요.");
  const data = await api("nudge-proposal", { projectId, control: $("control").value.trim() || undefined, controlId: nodePath(selectedNode), fixture: request("resolveScreen").fixture, axis, delta });
  $("issues").textContent = JSON.stringify(data, null, 2);
}

document.querySelectorAll("[data-action]").forEach((button) => button.onclick = () => action(button.dataset.action));
document.querySelectorAll("[data-import]").forEach((button) => button.onclick = () => importEvidence(button.dataset.import));
$("loadFixture").onclick = loadFixture;
document.querySelectorAll("[data-nudge]").forEach((button) => button.onclick = () => { const [axis, delta] = button.dataset.nudge.split(":"); nudge(axis, Number(delta)); });
document.querySelectorAll(".state").forEach((button) => button.onclick = () => { document.querySelectorAll(".state").forEach((item) => item.classList.remove("active")); button.classList.add("active"); state = button.dataset.state; action("renderScreen"); });
document.querySelectorAll(".evidence-tab").forEach((button)=>button.onclick=()=>{document.querySelectorAll(".evidence-tab").forEach(item=>item.classList.remove("active"));button.classList.add("active");evidenceTab=button.dataset.evidence;renderEvidence();});
for (const [input, layer] of [["renderOpacity", "renderLayer"], ["referenceOpacity", "referenceLayer"], ["screenshotOpacity", "screenshotLayer"]]) $(input).oninput = () => $(layer).style.opacity = $(input).value;
$("filter").oninput = () => renderTree(lastLayout);
$("pointer").oninput = () => { const value = $("pointer").value.trim(), node = lastLayout?.nodes?.find((item) => sourcePointer(item) === value); if (node) selectNode(node); };
fetch("/api/capabilities").then((response) => response.json()).then((data) => $("status").textContent = `로컬 연결 · ${data.tools.length} MCP tools`).catch(() => $("status").textContent = "연결 실패");
