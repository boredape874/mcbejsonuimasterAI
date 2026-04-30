// tools/_lib/solver.mjs
// Constraint solver. Iterates declared constraints to a fixed point.

import { placeFrom, edgeValue, setEdge } from "./layout.mjs";

const MAX_ITER = 32;

function buildParents(ird) {
  const map = new Map();
  map.set("__root__", null);
  for (const e of ird.elements) map.set(e.id, e.parent || "__root__");
  return map;
}

function numericSize(size, id) {
  if (!Array.isArray(size) || size.length !== 2) {
    throw new Error(`element "${id}" must define size as [w, h]`);
  }
  const [w, h] = size;
  if (typeof w !== "number" || typeof h !== "number") {
    throw new Error(`element "${id}" uses non-pixel size ${JSON.stringify(size)}; solve layout with numeric pixel sizes first`);
  }
  return [w, h];
}

function initialRects(ird) {
  // Compute absolute rects for elements in topological order (parents first).
  const rects = new Map();
  const [bw, bh] = ird.base_resolution;
  const screenRect = { x: 0, y: 0, w: bw, h: bh };
  const rootSize = numericSize(ird.root.size, "__root__");
  rects.set("__screen__", screenRect);
  rects.set("__root__", placeFrom(screenRect, ird.root.anchor || "top_left", ird.root.pos || [0, 0], rootSize));

  const byId = new Map(ird.elements.map((e) => [e.id, e]));
  const visited = new Set(["__screen__", "__root__"]);

  function visit(id) {
    if (visited.has(id)) return;
    const el = byId.get(id);
    if (!el) throw new Error(`unknown element id ${id}`);
    visit(el.parent || "__root__");
    const parentRect = rects.get(el.parent || "__root__");
    const [w, h] = numericSize(el.size, el.id);
    const r = placeFrom(parentRect, el.anchor, el.pos, [w, h]);
    rects.set(id, r);
    visited.add(id);
  }

  for (const e of ird.elements) visit(e.id);
  return rects;
}

function applyConstraint(c, rects, parents, log) {
  let changed = false;
  const eq = (a, b) => Math.round(a) === Math.round(b);

  if (c.op === "same_size" || c.op === "same_width" || c.op === "same_height") {
    const [first, ...rest] = c.ids;
    const r0 = rects.get(first);
    for (const id of rest) {
      const r = rects.get(id);
      if ((c.op !== "same_height") && r.w !== r0.w) { r.w = r0.w; changed = true; }
      if ((c.op !== "same_width")  && r.h !== r0.h) { r.h = r0.h; changed = true; }
    }
    if (changed) log.push({ op: c.op, ids: c.ids });
    return changed;
  }

  if (c.op === "align_x" || c.op === "align_y") {
    const edge = c.op === "align_x"
      ? (c.edge === "center" ? "center_x" : c.edge === "end" ? "right" : "left")
      : (c.edge === "center" ? "center_y" : c.edge === "end" ? "bottom" : "top");
    const [first, ...rest] = c.ids;
    const target = edgeValue(rects.get(first), edge);
    for (const id of rest) {
      const r = rects.get(id);
      if (!eq(edgeValue(r, edge), target)) { setEdge(r, edge, target); changed = true; }
    }
    if (changed) log.push({ op: c.op, edge, ids: c.ids });
    return changed;
  }

  if (c.op === "center_group_x" || c.op === "center_group_y") {
    const group = c.ids.map((id) => ({ id, r: rects.get(id), p: parents.get(id) }));
    const parentId = group[0] && group[0].p;
    if (!parentId || group.some((g) => g.p !== parentId)) {
      log.push({ op: c.op, ids: c.ids, error: "elements have different parents" });
      return false;
    }
    const parent = rects.get(parentId);
    if (!parent) {
      log.push({ op: c.op, ids: c.ids, error: "unknown parent" });
      return false;
    }
    if (c.op === "center_group_x") {
      const left = Math.min(...group.map((g) => g.r.x));
      const right = Math.max(...group.map((g) => g.r.x + g.r.w));
      const delta = Math.round((parent.x + parent.w / 2) - ((left + right) / 2));
      if (delta !== 0) {
        for (const g of group) g.r.x += delta;
        changed = true;
      }
    } else {
      const top = Math.min(...group.map((g) => g.r.y));
      const bottom = Math.max(...group.map((g) => g.r.y + g.r.h));
      const delta = Math.round((parent.y + parent.h / 2) - ((top + bottom) / 2));
      if (delta !== 0) {
        for (const g of group) g.r.y += delta;
        changed = true;
      }
    }
    if (changed) log.push({ op: c.op, ids: c.ids });
    return changed;
  }

  if (c.op === "symmetric_x" || c.op === "symmetric_y") {
    const [aId, bId] = c.ids;
    const a = rects.get(aId), b = rects.get(bId);
    const pA = rects.get(parents.get(aId));
    const pB = rects.get(parents.get(bId));
    if (pA !== pB) {
      log.push({ op: c.op, ids: c.ids, error: "elements have different parents" });
      return false;
    }
    if (c.op === "symmetric_x") {
      const cx = pA.x + pA.w / 2;
      const da = (a.x + a.w / 2) - cx;
      const db = (b.x + b.w / 2) - cx;
      // Average absolute distance, sign preserved.
      const dist = (Math.abs(da) + Math.abs(db)) / 2;
      const aSign = da <= 0 ? -1 : 1;
      const bSign = aSign * -1; // mirror
      const newAcx = cx + aSign * dist;
      const newBcx = cx + bSign * dist;
      if (!eq(a.x + a.w / 2, newAcx)) { a.x = Math.round(newAcx - a.w / 2); changed = true; }
      if (!eq(b.x + b.w / 2, newBcx)) { b.x = Math.round(newBcx - b.w / 2); changed = true; }
    } else {
      const cy = pA.y + pA.h / 2;
      const da = (a.y + a.h / 2) - cy;
      const db = (b.y + b.h / 2) - cy;
      const dist = (Math.abs(da) + Math.abs(db)) / 2;
      const aSign = da <= 0 ? -1 : 1;
      const bSign = aSign * -1;
      const newAcy = cy + aSign * dist;
      const newBcy = cy + bSign * dist;
      if (!eq(a.y + a.h / 2, newAcy)) { a.y = Math.round(newAcy - a.h / 2); changed = true; }
      if (!eq(b.y + b.h / 2, newBcy)) { b.y = Math.round(newBcy - b.h / 2); changed = true; }
    }
    if (changed) log.push({ op: c.op, ids: c.ids });
    return changed;
  }

  if (c.op === "equal_gap_x" || c.op === "equal_gap_y") {
    const sorted = [...c.ids]
      .map((id) => ({ id, r: rects.get(id) }))
      .sort((u, v) => (c.op === "equal_gap_x" ? u.r.x - v.r.x : u.r.y - v.r.y));
    const n = sorted.length;
    if (n < 2) return false;
    let gap = c.gap;
    if (gap == null) {
      // average existing gaps
      let sum = 0, count = 0;
      for (let i = 1; i < n; i++) {
        const prev = sorted[i - 1].r, cur = sorted[i].r;
        const g = c.op === "equal_gap_x"
          ? cur.x - (prev.x + prev.w)
          : cur.y - (prev.y + prev.h);
        sum += g; count++;
      }
      gap = Math.round(sum / count);
    }
    // Keep first; place subsequent.
    let cursor = c.op === "equal_gap_x"
      ? sorted[0].r.x + sorted[0].r.w
      : sorted[0].r.y + sorted[0].r.h;
    for (let i = 1; i < n; i++) {
      const r = sorted[i].r;
      const newPos = cursor + gap;
      if (c.op === "equal_gap_x") {
        if (r.x !== newPos) { r.x = newPos; changed = true; }
        cursor = r.x + r.w;
      } else {
        if (r.y !== newPos) { r.y = newPos; changed = true; }
        cursor = r.y + r.h;
      }
    }
    if (changed) log.push({ op: c.op, ids: c.ids, gap });
    return changed;
  }

  if (c.op === "edge_eq" || c.op === "edge_offset") {
    const [aId, aEdge] = c.a.split(".");
    const [bId, bEdge] = c.b.split(".");
    const target = edgeValue(rects.get(bId), bEdge) + (c.delta || 0);
    const a = rects.get(aId);
    if (!eq(edgeValue(a, aEdge), target)) {
      setEdge(a, aEdge, target);
      changed = true;
      log.push({ op: c.op, a: c.a, b: c.b, delta: c.delta || 0 });
    }
    return changed;
  }

  log.push({ op: c.op, error: "unknown constraint op" });
  return false;
}

export function solve(ird) {
  const parents = buildParents(ird);
  const rects = initialRects(ird);
  const log = [];
  let iter = 0;
  let changed = true;
  while (changed && iter < MAX_ITER) {
    changed = false;
    for (const c of ird.constraints) {
      if (applyConstraint(c, rects, parents, log)) changed = true;
    }
    iter++;
  }
  const converged = !changed;
  return {
    converged,
    iterations: iter,
    rects: Object.fromEntries(rects),
    log,
  };
}
