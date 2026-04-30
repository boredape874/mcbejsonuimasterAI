// tools/_lib/compiler.mjs
// Convert solved IR rects back into Bedrock JSON UI structure.
// Supports preset extension via element.extends (e.g. "common_dialogs.main_panel_no_buttons").

import { offsetFrom } from "./layout.mjs";

const KIND_TYPE = {
  panel: "panel",
  image: "image",
  label: "label",
  button: "button",
  stack_h: "stack_panel",
  stack_v: "stack_panel",
  stack_panel: "stack_panel",
  grid: "grid",
  scroll_view: "scroll_view",
  scroll: "scroll_view",
  toggle: "toggle",
  edit_box: "edit_box",
  dropdown: "dropdown",
  custom: "custom",
};

function localEntryName(id, ns) {
  return `${id}@${ns}.${id}`;
}

function extendedEntryName(id, ext) {
  return `${id}@${ext}`;
}

function buildLayoutProps(el, rects) {
  const r = rects[el.id];
  const parentId = el.parent || "__root__";
  const pr = rects[parentId];
  return {
    size: [r.w, r.h],
    anchor_from: el.anchor,
    anchor_to: el.anchor,
    offset: offsetFrom(pr, el.anchor, r),
  };
}

function buildRootLayout(solved) {
  const rects = solved.rects || {};
  const root = solved.root || {};
  const base = solved.base_resolution || [1920, 1080];
  const screenRect = rects.__screen__ || { x: 0, y: 0, w: base[0], h: base[1] };
  const rootRect = rects.__root__ || screenRect;
  if (
    rootRect.x === 0 && rootRect.y === 0 &&
    rootRect.w === screenRect.w && rootRect.h === screenRect.h
  ) {
    return { size: ["100%", "100%"] };
  }
  const anchor = root.anchor || "top_left";
  return {
    size: [rootRect.w, rootRect.h],
    anchor_from: anchor,
    anchor_to: anchor,
    offset: offsetFrom(screenRect, anchor, rootRect),
  };
}

function commonExtras(el) {
  const extras = {};
  if (el.variables && Object.keys(el.variables).length) extras.variables = el.variables;
  if (Array.isArray(el.bindings) && el.bindings.length) extras.bindings = el.bindings;
  if (el.props && typeof el.props === "object") Object.assign(extras, el.props);
  return extras;
}

export function compile(solved) {
  const ns = solved.namespace;
  const rects = solved.rects;
  const elements = solved.elements;

  const childrenOf = new Map();
  childrenOf.set("__root__", []);
  for (const el of elements) {
    const p = el.parent || "__root__";
    if (!childrenOf.has(p)) childrenOf.set(p, []);
    childrenOf.get(p).push(el);
  }
  for (const arr of childrenOf.values()) arr.sort((a, b) => a.z - b.z);

  const out = { namespace: ns };

  function childRef(c) {
    const layout = buildLayoutProps(c, rects);
    const extras = commonExtras(c);
    if (c.extends) {
      // Inline preset usage: "id@vanilla.preset": { layout + variables + bindings + props (+ inline children if any) }
      const block = { ...layout, ...extras };
      const grandKids = childrenOf.get(c.id);
      if (grandKids && grandKids.length) {
        block.controls = grandKids.map(childRef);
      }
      return { [extendedEntryName(c.id, c.extends)]: block };
    }
    // Standalone control defined at the top level of this file.
    return { [localEntryName(c.id, ns)]: {} };
  }

  out.root_panel = {
    type: "panel",
    ...buildRootLayout(solved),
    controls: (childrenOf.get("__root__") || []).map(childRef),
  };

  for (const el of elements) {
    if (el.extends) continue; // emitted inline above; no top-level definition needed
    const layout = buildLayoutProps(el, rects);
    const baseType = KIND_TYPE[el.kind] || "panel";
    const node = {
      type: baseType,
      ...layout,
      ...commonExtras(el),
    };
    if (el.kind === "stack_h") node.orientation = "horizontal";
    if (el.kind === "stack_v") node.orientation = "vertical";
    const kids = childrenOf.get(el.id);
    if (kids && kids.length) node.controls = kids.map(childRef);
    out[el.id] = node;
  }

  return out;
}
