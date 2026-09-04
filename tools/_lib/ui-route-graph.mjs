import { indexResourcePack } from "./final-rp-v2/rp-index.mjs";

const variablePattern = /\$[A-Za-z_][A-Za-z0-9_]*/g;

function collectVariables(value, out = new Set()) {
  if (typeof value === "string") for (const match of value.matchAll(variablePattern)) out.add(match[0]);
  else if (Array.isArray(value)) value.forEach((item) => collectVariables(item, out));
  else if (value && typeof value === "object") Object.entries(value).forEach(([key, child]) => { collectVariables(key, out); collectVariables(child, out); });
  return out;
}

function normalizeRef(reference, namespace) {
  if (!reference) return null;
  if (reference.includes(".")) return reference;
  return namespace ? `${namespace}.${reference}` : reference;
}

export async function traceUiRoute(packRoot, reference, options = {}) {
  const index = await indexResourcePack(packRoot, options);
  const issues = [...index.unresolved.map((item) => ({ code: item.code || String(item.kind || "ROUTE_UNRESOLVED").toUpperCase(), ...item }))];
  const start = normalizeRef(reference, options.namespace);
  const candidates = index.controlCandidates.get(start) || [];
  if (!candidates.length) issues.push({ code: "CONTROL_MISSING", reference: start });
  if (candidates.length > 1) issues.push({ code: "CONTROL_AMBIGUOUS", reference: start, candidates: candidates.map((item) => item.relative) });
  const route = [], visiting = new Set(), visited = new Set();
  function visit(qualified) {
    if (visiting.has(qualified)) { issues.push({ code: "INHERITANCE_CYCLE", reference: qualified, route: [...route.map((item) => item.qualified), qualified] }); return; }
    if (visited.has(qualified)) return;
    const optionsForControl = index.controlCandidates.get(qualified) || [];
    if (optionsForControl.length !== 1) {
      if (!optionsForControl.length) issues.push({ code: "CONTROL_MISSING", reference: qualified });
      return;
    }
    const control = optionsForControl[0]; visiting.add(qualified); route.push({ qualified, file: control.relative, declaration: control.declaration, baseRef: control.baseRef });
    for (const variable of collectVariables(control.value)) {
      if (!(variable in index.globals) && !(variable.slice(1) in index.globals) && !(variable in (control.value || {}))) issues.push({ code: "VARIABLE_REFERENCE_UNRESOLVED", reference: variable, control: qualified });
    }
    const base = normalizeRef(control.baseRef, control.namespace);
    if (base) visit(base);
    visiting.delete(qualified); visited.add(qualified);
  }
  if (candidates.length === 1) visit(start);
  const blocking = issues.filter((item) => ["CONTROL_MISSING", "CONTROL_AMBIGUOUS", "INHERITANCE_CYCLE", "VARIABLE_REFERENCE_UNRESOLVED", "UNREADABLE_UI_DEFS", "UNREADABLE_UI_FILE"].includes(item.code));
  return { schema: "mcbe-jsonui-ai-kit/ui-route-trace@1", ok: blocking.length === 0, pack: index.targetRoot, reference: start, route, issues, blocking };
}
