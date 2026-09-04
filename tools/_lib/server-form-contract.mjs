import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { readJsonc } from "./jsonc.mjs";

const VALID_COLLECTION_OWNERS = new Set(["collection_panel", "stack_panel", "grid"]);
const FORM_CLASSES = { ActionFormData: "action", ModalFormData: "modal", MessageFormData: "message" };

function diagnostic(code, message, path = "/") { return { code, message, path }; }
function literal(value) {
  const match = String(value).trim().match(/^(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|`([^$`]*)`)$/s);
  if (!match) return null;
  return (match[1] ?? match[2] ?? match[3]).replace(/\\(['"\\])/g, "$1");
}
function walk(value, visit, path = "/", ancestors = []) {
  if (!value || typeof value !== "object") return;
  visit(value, path, ancestors);
  if (Array.isArray(value)) value.forEach((item, index) => walk(item, visit, `${path}${index}/`, [...ancestors, value]));
  else Object.entries(value).forEach(([key, child]) => walk(child, visit, `${path}${key}/`, [...ancestors, value]));
}
function unique(values) { return [...new Set(values)]; }
function controlType(node) { return typeof node?.type === "string" ? node.type : null; }
function allStrings(node) {
  const found = [];
  walk(node, (value) => Object.values(value).forEach((item) => { if (typeof item === "string") found.push(item); }));
  return found;
}
function semanticSurface(node) {
  const result = [];
  walk(node, (value, path) => {
    const role = value.type === "label" ? "label" : value.type === "image" ? "icon" : null;
    if (!role) return;
    const bindings = JSON.stringify(value.bindings || []);
    result.push(`${role}:${value.text ?? value.texture ?? ""}:${bindings.replace(/\s/g, "")}:${path.replace(/(?:default|hover|pressed)[^/]*\//gi, "STATE/")}`);
  });
  return result.sort();
}

export function validateServerFormContractShape(contract) {
  const errors = [];
  if (contract?.schema !== "mcbe-jsonui-ai-kit/server-form-contract@1") errors.push(diagnostic("CONTRACT_SCHEMA_INVALID", "schema must be mcbe-jsonui-ai-kit/server-form-contract@1", "/schema"));
  for (const key of ["sender", "receiver", "search", "inputs", "diagnostics", "unresolved"]) if (!Object.hasOwn(contract || {}, key)) errors.push(diagnostic("CONTRACT_REQUIRED_FIELD_MISSING", `Missing required field ${key}`, `/${key}`));
  if (contract?.sender && !["action", "modal", "message"].includes(contract.sender.formKind)) errors.push(diagnostic("CONTRACT_FORM_KIND_INVALID", "sender.formKind must be action, modal, or message", "/sender/formKind"));
  if (contract?.search && !["current", "all", "unknown"].includes(contract.search.scope)) errors.push(diagnostic("CONTRACT_SEARCH_SCOPE_INVALID", "search.scope must be current, all, or unknown", "/search/scope"));
  if (contract?.inputs && !Array.isArray(contract.inputs)) errors.push(diagnostic("CONTRACT_INPUTS_INVALID", "inputs must be an array", "/inputs"));
  return { ok: errors.length === 0, errors };
}

export async function extractRpContract(path) {
  const document = await readJsonc(path);
  const namespace = typeof document.namespace === "string" ? document.namespace : null;
  const routeTokens = [];
  const factories = [];
  const collections = [];
  const events = [];
  const inputs = [];
  const diagnostics = [];
  const unresolved = [];
  const controls = new Set(Object.keys(document).filter((key) => key !== "namespace").map((key) => key.split("@")[0]));
  let searchPresent = false;
  let normalizedSearch = false;
  const filteredPaths = [];
  const indexPaths = [];
  let explicitScope = null;

  walk(document, (node, nodePath) => {
    for (const [key, value] of Object.entries(node)) {
      if (/title.*(?:contain|prefix|token)/i.test(key) && typeof value === "string") routeTokens.push(value);
      if (key === "$search_scope" && ["current", "all", "unknown"].includes(value)) explicitScope = value;
      if (typeof value === "string") {
        const titleExpression = value.includes("#title_text");
        if (titleExpression) for (const match of value.matchAll(/['"]([^'"]+?)['"]/g)) routeTokens.push(match[1]);
        if (/button\.[a-z0-9_.-]+/i.test(value)) events.push(...value.match(/button\.[a-z0-9_.-]+/gi));
        if (/\$(?:search|query)|#(?:search|query)/i.test(value)) searchPresent = true;
        if (/lower|upper|normalize/i.test(value) && /search|query/i.test(value)) normalizedSearch = true;
        if (value.startsWith("@")) {
          const reference = value.slice(1).split(".");
          if ((!namespace || reference[0] === namespace) && !controls.has(reference.slice(1).join("."))) {
            diagnostics.push(diagnostic("CONTROL_REFERENCE_NOT_FOUND", `Referenced control ${value} was not found`, nodePath + key));
          }
        }
      }
    }
    if (node.factory && typeof node.factory === "object") {
      factories.push({ path: nodePath, name: node.factory.name ?? null, controlIds: node.factory.control_ids ?? {} });
    }
    if (Object.hasOwn(node, "collection_name")) {
      const ownerType = controlType(node);
      collections.push({ path: nodePath, name: node.collection_name, ownerType, semanticIds: Array.isArray(node.$semantic_ids) ? node.$semantic_ids : [] });
      if (!VALID_COLLECTION_OWNERS.has(ownerType)) diagnostics.push(diagnostic("COLLECTION_OWNER_TYPE_INVALID", `collection_name is not valid on ${ownerType || "untyped control"}`, nodePath + "collection_name"));
    }
    if (Object.hasOwn(node, "collection_index")) {
      const inCollection = collections.some((collection) => VALID_COLLECTION_OWNERS.has(collection.ownerType) && nodePath.startsWith(collection.path));
      if (!inCollection) diagnostics.push(diagnostic("COLLECTION_INDEX_CONTEXT_INVALID", "collection_index is outside a valid collection owner", nodePath + "collection_index"));
      indexPaths.push(nodePath);
    }
    const strings = allStrings(node.bindings || []);
    if (strings.some((value) => /#visible/.test(value)) && strings.some((value) => /search|query/i.test(value))) filteredPaths.push(nodePath);
    if (node.type === "edit_box" || node.$text_box_name) {
      inputs.push({ path: nodePath, type: node.type ?? null, collection: node.collection_name ?? null, sourceProperty: strings.find((value) => /^#/.test(value)) ?? null, focusable: node.focus_enabled !== false });
    }
    if (Object.hasOwn(node, "hover_text")) diagnostics.push(diagnostic("INVALID_HOVER_PROPERTY", "hover_text is not a supported generic control property", nodePath + "hover_text"));
    if (node.type === "label" && typeof node.text === "string" && routeTokens.some((token) => node.text.includes(token)) && node.$allow_route_token !== true) diagnostics.push(diagnostic("PROTOCOL_MARKER_LEAK", "A route/sentinel token remains in visible label text", nodePath + "text"));
    const stateKeys = Object.keys(node).filter((key) => /^(default|hover|pressed)(?:_control|_state)?$/i.test(key));
    if (stateKeys.length >= 2) {
      const surfaces = stateKeys.map((key) => {
        const state = node[key];
        if (typeof state !== "string" || !state.startsWith("@")) return semanticSurface(state);
        const [stateNamespace, ...controlParts] = state.slice(1).split(".");
        return stateNamespace === namespace ? semanticSurface(document[controlParts.join(".")]) : [];
      });
      if (surfaces.some((surface) => JSON.stringify(surface) !== JSON.stringify(surfaces[0]))) diagnostics.push(diagnostic("HOVER_STATE_CONTENT_LOSS", "default/hover/pressed states do not preserve the same label/icon binding semantics", nodePath));
    }
  });

  const declaredVariables = new Set();
  walk(document, (node) => Object.keys(node).filter((key) => key.startsWith("$")).forEach((key) => declaredVariables.add(key)));
  walk(document, (node, nodePath) => Object.entries(node).forEach(([key, value]) => {
    const candidates = [];
    for (const match of key.matchAll(/@\$[A-Za-z_][\w.]*/g)) candidates.push(match[0].slice(1));
    if (/template/i.test(key) && typeof value === "string") for (const match of value.matchAll(/\$[A-Za-z_][\w.]*/g)) candidates.push(match[0]);
    for (const candidate of candidates) if (!declaredVariables.has(candidate)) diagnostics.push(diagnostic("UNRESOLVED_TEMPLATE_VARIABLE", `${candidate} has no declaration/default`, nodePath + key));
  }));

  const submitEvent = unique(events).find((event) => event === "button.submit_custom_form") ?? null;
  if (inputs.length && submitEvent !== "button.submit_custom_form") diagnostics.push(diagnostic("DIRECT_INPUT_SUBMIT_EVENT_MISSING", "custom input requires button.submit_custom_form", "/"));
  const scope = !searchPresent ? "unknown" : explicitScope || (collections.length === 1 ? "current" : "unknown");
  const filteredCollection = filteredPaths.length > 0;
  const preservesFilteredIndex = filteredPaths.some((filteredPath) => indexPaths.some((indexPath) => indexPath.startsWith(filteredPath) || filteredPath.startsWith(indexPath)));
  const indexSafety = !searchPresent ? "not-applicable" : filteredCollection && preservesFilteredIndex ? "safe" : filteredCollection ? "unsafe" : "unresolved";
  if (scope === "current") diagnostics.push(diagnostic("SEARCH_SCOPE_CURRENT_COLLECTION", "Search is limited to the current collection and is not global", "/search"));
  if (indexSafety === "unsafe") diagnostics.push(diagnostic("FILTERED_CLICK_INDEX_UNSAFE", "Filtered controls do not preserve collection_index for the response", "/search"));
  if (searchPresent && normalizedSearch) unresolved.push(diagnostic("SEARCH_NORMALIZATION_UNSUPPORTED", "Case/Korean normalization has no verified runtime semantics", "/search"));

  return {
    source: path, namespace, routeTokens: unique(routeTokens), factories, collections, events: unique(events), inputs,
    search: { present: searchPresent, scope, caseSensitivity: searchPresent ? (normalizedSearch ? "unsupported-unresolved" : "case-sensitive") : "not-applicable", indexSafety },
    diagnostics, unresolved,
  };
}

export async function extractBpSenders(path) {
  const source = await readFile(path, "utf8");
  const senders = [];
  const declaration = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*new\s+(ActionFormData|ModalFormData|MessageFormData)\s*\(\s*\)/g;
  const declarations = [...source.matchAll(declaration)];
  for (let declarationIndex = 0; declarationIndex < declarations.length; declarationIndex++) {
    const match = declarations[declarationIndex];
    const variable = match[1];
    const formKind = FORM_CLASSES[match[2]];
    const nextOffset = declarations[declarationIndex + 1]?.index ?? source.length;
    const scopedSource = source.slice(match.index, nextOffset);
    const calls = [];
    const initializerEnd = source.indexOf(";", match.index);
    const initializer = source.slice(match.index, initializerEnd < 0 ? nextOffset : initializerEnd);
    for (const call of initializer.matchAll(/\.(title|button|button1|button2|textField|toggle|slider|dropdown)\s*\(([^)]*)\)/gs)) calls.push({ method: call[1], argument: call[2], value: literal(call[2].split(",")[0]) });
    const callPattern = new RegExp(`\\b${variable.replace(/\$/g, "\\$")}\\s*\\.\\s*(title|button|button1|button2|textField|toggle|slider|dropdown)\\s*\\(([^;]*?)\\)`, "gs");
    for (const call of scopedSource.matchAll(callPattern)) calls.push({ method: call[1], argument: call[2], value: literal(call[2].split(",")[0]) });
    const title = calls.find((call) => call.method === "title")?.value ?? null;
    const buttonCalls = calls.filter((call) => /^button/.test(call.method));
    const inputCalls = calls.filter((call) => /^(textField|toggle|slider|dropdown)$/.test(call.method));
    const buttons = buttonCalls.map((call, index) => ({ index, semanticId: call.value, method: call.method }));
    const inputs = inputCalls.map((call, index) => ({ index, semanticId: call.value, method: call.method }));
    const cancelHandled = /(?:response|result|res)\s*\.\s*(?:canceled|cancelationReason)|\.canceled/.test(scopedSource);
    senders.push({ source: path, variable, formKind, title, buttons, inputs, cancelHandled });
  }
  return senders;
}

export function compareServerFormContract(receiver, senders, { bpSource = null } = {}) {
  const diagnostics = [...receiver.diagnostics];
  const unresolved = [...receiver.unresolved];
  let sender = null;
  if (!senders?.length) unresolved.push(diagnostic("SENDER_NOT_FOUND", `No ActionFormData, ModalFormData, or MessageFormData sender found${bpSource ? ` in ${basename(bpSource)}` : ""}`, "/sender"));
  else {
    sender = senders.find((candidate) => receiver.routeTokens.some((token) => candidate.title?.includes(token))) ?? senders[0];
    if (senders.length > 1 && !receiver.routeTokens.some((token) => sender.title?.includes(token))) unresolved.push(diagnostic("SENDER_ROUTE_AMBIGUOUS", "Multiple senders exist and no title token selects one", "/sender"));
    if (!sender.cancelHandled) diagnostics.push(diagnostic("CANCEL_HANDLER_MISSING", "Sender does not inspect the canceled response", "/sender/cancelHandled"));
    if (receiver.routeTokens.length && !receiver.routeTokens.some((token) => sender.title?.includes(token))) diagnostics.push(diagnostic("TITLE_ROUTE_MISMATCH", "Sender title does not contain any RP route token", "/sender/title"));
    const declaredOrder = receiver.collections.flatMap((collection) => collection.semanticIds || []);
    if (declaredOrder.length && JSON.stringify(declaredOrder) !== JSON.stringify(sender.buttons.map((button) => button.semanticId))) diagnostics.push(diagnostic("BUTTON_ORDER_MISMATCH", "RP semantic button order differs from BP sender order", "/sender/buttons"));
    if (sender.formKind === "modal" && receiver.inputs.length !== sender.inputs.length) diagnostics.push(diagnostic("INPUT_FIELD_ORDER_MISMATCH", `RP custom_input count ${receiver.inputs.length} differs from BP modal field count ${sender.inputs.length}`, "/inputs"));
    if (receiver.inputs.length && !sender.cancelHandled) diagnostics.push(diagnostic("DIRECT_INPUT_CANCEL_MISMATCH", "Direct input contract requires explicit cancel handling", "/inputs"));
  }
  const contract = {
    schema: "mcbe-jsonui-ai-kit/server-form-contract@1", sender,
    receiver: { source: receiver.source, namespace: receiver.namespace, routeTokens: receiver.routeTokens, factories: receiver.factories, collections: receiver.collections, events: receiver.events },
    search: receiver.search, inputs: receiver.inputs, diagnostics, unresolved,
    ok: diagnostics.length === 0 && unresolved.length === 0,
    evidenceLevel: "integrated-static",
    runtimeVerified: false,
  };
  const shape = validateServerFormContractShape(contract);
  if (!shape.ok) {
    contract.diagnostics.push(...shape.errors);
    contract.ok = false;
  }
  return contract;
}

export async function analyzeServerFormContract({ rpPath, bpPath }) {
  const receiver = await extractRpContract(rpPath);
  const senders = bpPath ? await extractBpSenders(bpPath) : [];
  return compareServerFormContract(receiver, senders, { bpSource: bpPath });
}
