import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";

export const PREVIEW_PROFILES = {
  pc: { id: "pc", viewport: [1920, 1080], guiScale: 3, input: "mouse" },
  touch: { id: "touch", viewport: [1280, 720], guiScale: 2, input: "touch" },
};
export const PREVIEW_STATES = ["default", "hover", "pressed"];

const COMMON = new Set(["type", "size", "anchor_from", "anchor_to", "offset", "controls", "visible", "alpha", "layer", "z_order", "bindings", "variables"]);
const BY_TYPE = {
  panel: new Set([]),
  image: new Set(["texture", "color", "uv", "uv_size", "nineslice_size", "fill", "keep_ratio"]),
  label: new Set(["text", "color", "font_size", "font_scale_factor", "font_type", "text_alignment", "localize", "shadow", "max_size", "line_padding"]),
  stack_panel: new Set(["orientation", "padding", "spacing"]),
  grid: new Set(["grid_dimensions", "grid_item_template", "grid_fill_direction", "grid_rescaling_type", "maximum_grid_items", "collection_name"]),
  button: new Set(["default_control", "hover_control", "pressed_control", "locked_control", "button_mappings", "enabled", "text"]),
};

function refId(name) { const text = String(name); return (text.includes("@") ? text.split("@").at(-1) : text).split(".").pop(); }

function flattenUi(ui) {
  const controls = new Map();
  function add(name, value) {
    if (!value || typeof value !== "object") return;
    controls.set(refId(name), value);
    for (const entry of value.controls || []) for (const [childName, child] of Object.entries(entry)) add(childName, child);
  }
  for (const [id, value] of Object.entries(ui || {})) if (id !== "namespace") add(id, value);
  return controls;
}

export function controlIndex(ui) { return flattenUi(ui); }

function walkReferences(node, controls, visit, ancestry = new Set()) {
  if (!node || typeof node !== "object" || ancestry.has(node)) return;
  visit(node);
  const next = new Set(ancestry).add(node);
  for (const entry of node.controls || []) for (const [name, inline] of Object.entries(entry)) {
    const base = controls.get(refId(name));
    walkReferences(base ? { ...base, ...inline } : inline, controls, visit, next);
  }
}

export function inspectUnsupported(ui) {
  const controls = flattenUi(ui), items = [], seen = new Set();
  for (const [id, node] of controls) walkReferences(node, controls, (current) => {
    const type = current.type || "panel";
    if (!BY_TYPE[type]) {
      const key = `${id}:type:${type}`;
      if (!seen.has(key)) items.push({ control: id, kind: "type", value: type });
      seen.add(key); return;
    }
    for (const property of Object.keys(current)) {
      if (property.startsWith("$") || COMMON.has(property) || BY_TYPE[type].has(property)) continue;
      const key = `${id}:property:${property}`;
      if (!seen.has(key)) items.push({ control: id, kind: "property", value: property, type });
      seen.add(key);
    }
  });
  return items;
}

async function exists(path) { try { await access(path); return true; } catch { return false; } }

async function resolveTexture(uiFile, texture) {
  if (typeof texture !== "string" || texture.startsWith("#") || texture.includes("$")) return null;
  const rel = texture.replaceAll("/", "\\") + (extname(texture) ? "" : ".png");
  let base = dirname(resolve(uiFile));
  for (let i = 0; i < 5; i += 1) {
    const candidate = resolve(base, rel);
    if (await exists(candidate)) return candidate;
    base = dirname(base);
  }
  return null;
}

function normalizeInsets(value) {
  if (Number.isFinite(value)) return [value, value, value, value];
  if (Array.isArray(value) && value.length === 2) return [value[0], value[1], value[0], value[1]];
  return Array.isArray(value) && value.length === 4 ? value : null;
}

async function sidecarInsets(texturePath) {
  try { return normalizeInsets(JSON.parse(await readFile(texturePath.replace(/\.[^.]+$/, ".json"), "utf8")).nineslice_size); }
  catch { return null; }
}

function drawNineSlice(ctx, image, x, y, w, h, insets, destinationScale = 1) {
  const [left, top, right, bottom] = insets;
  const sx = [0, left, image.width - right, image.width], sy = [0, top, image.height - bottom, image.height];
  const dx = [x, x + left * destinationScale, x + w - right * destinationScale, x + w];
  const dy = [y, y + top * destinationScale, y + h - bottom * destinationScale, y + h];
  for (let row = 0; row < 3; row += 1) for (let col = 0; col < 3; col += 1) {
    const sw = sx[col + 1] - sx[col], sh = sy[row + 1] - sy[row], dw = dx[col + 1] - dx[col], dh = dy[row + 1] - dy[row];
    if (sw > 0 && sh > 0 && dw > 0 && dh > 0) ctx.drawImage(image, sx[col], sy[row], sw, sh, dx[col], dy[row], dw, dh);
  }
}

function transformRect(rect, base, viewport) {
  const scale = Math.min(viewport[0] / base[0], viewport[1] / base[1]);
  return { x: (viewport[0] - base[0] * scale) / 2 + rect.x * scale, y: (viewport[1] - base[1] * scale) / 2 + rect.y * scale, w: rect.w * scale, h: rect.h * scale, scale };
}

function buttonColor(state) { return state === "pressed" ? "#4a6070" : state === "hover" ? "#6f9abb" : "#526d82"; }

export async function renderProfile({ canvasMod, ui, uiFile, flat, profile, state, outputPath }) {
  const { createCanvas, loadImage } = canvasMod;
  const cv = createCanvas(...profile.viewport), ctx = cv.getContext("2d"), diagnostics = [];
  ctx.fillStyle = "#101418"; ctx.fillRect(0, 0, cv.width, cv.height);
  const controls = flattenUi(ui);
  const ordered = [...flat.rects].sort((a, b) => ((controls.get(a.id)?.layer ?? controls.get(a.id)?.z_order ?? 0) - (controls.get(b.id)?.layer ?? controls.get(b.id)?.z_order ?? 0)));
  for (const sourceRect of ordered) {
    const rect = transformRect(sourceRect, [flat.baseW, flat.baseH], profile.viewport), node = controls.get(sourceRect.id) || {}, type = node.type || "panel";
    if (node.visible === false) continue;
    ctx.save();
    if (Number.isFinite(node.alpha)) ctx.globalAlpha = Math.max(0, Math.min(1, node.alpha));
    if (type === "image" && node.texture) {
      const texturePath = await resolveTexture(uiFile, node.texture);
      if (!texturePath) { diagnostics.push({ control: sourceRect.id, kind: "unresolved_texture", value: node.texture }); ctx.fillStyle = "#ff3d7155"; ctx.fillRect(rect.x, rect.y, rect.w, rect.h); }
      else {
        const image = await loadImage(texturePath), insets = normalizeInsets(node.nineslice_size) || await sidecarInsets(texturePath);
        if (insets) drawNineSlice(ctx, image, rect.x, rect.y, rect.w, rect.h, insets, rect.scale); else ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
      }
    } else if (type === "label") {
      const scaleFactor = Number(node.font_scale_factor) || 1, baseFont = node.font_size === "large" ? 12 : node.font_size === "small" ? 8 : 10;
      const px = Math.max(8, baseFont * scaleFactor * rect.scale), text = String(node.text ?? sourceRect.id), color = Array.isArray(node.color) ? node.color : [1, 1, 1];
      ctx.fillStyle = `rgba(${color.slice(0, 3).map((v) => Math.round(v * 255)).join(",")},${color[3] ?? 1})`; ctx.font = `${px}px sans-serif`; ctx.textBaseline = "middle";
      const measured = ctx.measureText(text).width, align = node.text_alignment || "left", maxWidth = Math.max(1, rect.w - 8), words = text.split(/\s+/), lines = [];
      let line = "";
      for (const word of words) { const candidate = line ? `${line} ${word}` : word; if (line && ctx.measureText(candidate).width > maxWidth) { lines.push(line); line = word; } else line = candidate; }
      if (line) lines.push(line);
      ctx.textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
      const tx = align === "center" ? rect.x + rect.w / 2 : align === "right" ? rect.x + rect.w - 4 : rect.x + 4;
      const lineHeight = px * 1.2, requiredHeight = lines.length * lineHeight;
      if (requiredHeight > rect.h) diagnostics.push({ control: sourceRect.id, kind: "text_overflow", measuredWidth: Math.round(measured), lines: lines.length, requiredHeight: Math.round(requiredHeight), available: [Math.round(maxWidth), Math.round(rect.h)], text });
      ctx.save(); ctx.beginPath(); ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
      const firstY = rect.y + (rect.h - requiredHeight) / 2 + lineHeight / 2; lines.forEach((part, index) => ctx.fillText(part, tx, firstY + index * lineHeight, maxWidth)); ctx.restore();
    } else {
      ctx.fillStyle = type === "button" ? buttonColor(state) : type === "grid" ? "#7bd88f25" : type === "stack_panel" ? "#c693f025" : "#5fb3ff20";
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      if (type === "button") {
        const selectedName = state === "hover" ? node.hover_control : state === "pressed" ? node.pressed_control : node.enabled === false ? node.locked_control : node.default_control;
        const selected = controls.get(refId(selectedName || ""));
        if (selected) {
          const imageChild = (selected.controls || []).flatMap((entry) => Object.values(entry)).find((child) => child.type === "image");
          const labelChild = (selected.controls || []).flatMap((entry) => Object.values(entry)).find((child) => child.type === "label");
          if (imageChild?.texture) {
            const texturePath = await resolveTexture(uiFile, imageChild.texture);
            if (!texturePath) diagnostics.push({ control: sourceRect.id, kind: "unresolved_texture", value: imageChild.texture, state });
            else { const image = await loadImage(texturePath), insets = normalizeInsets(imageChild.nineslice_size) || await sidecarInsets(texturePath); if (insets) drawNineSlice(ctx, image, rect.x, rect.y, rect.w, rect.h, insets, rect.scale); else ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h); }
          }
          const label = labelChild?.text ?? node.text;
          if (label) { ctx.fillStyle = "#fff"; ctx.font = `${Math.max(8, 16 * rect.scale)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(label), rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w - 8); }
        } else if (node.text) { ctx.fillStyle = "#fff"; ctx.font = `${Math.max(8, 16 * rect.scale)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(node.text), rect.x + rect.w / 2, rect.y + rect.h / 2, rect.w - 8); }
      }
    }
    ctx.strokeStyle = type === "button" ? "#d9edf7" : "#5fb3ff88"; ctx.lineWidth = Math.max(1, rect.scale);
    ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, Math.max(0, rect.w - 1), Math.max(0, rect.h - 1)); ctx.restore();
  }
  await writeFile(outputPath, await cv.encode("png"));
  return diagnostics;
}

export async function renderGeometryDebugger({ canvasMod, flat, outputPath }) {
  const cv = canvasMod.createCanvas(flat.baseW, flat.baseH), ctx = cv.getContext("2d");
  ctx.fillStyle = "#101418"; ctx.fillRect(0, 0, cv.width, cv.height);
  const palette = ["#5fb3ff", "#ff7676", "#7bd88f", "#f7c873", "#c693f0", "#73d8ce"];
  flat.rects.forEach((rect, index) => {
    const color = palette[index % palette.length];
    ctx.fillStyle = `${color}55`; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, Math.max(0, rect.w - 1), Math.max(0, rect.h - 1));
    ctx.fillStyle = "#fff"; ctx.font = "bold 16px sans-serif"; ctx.fillText(`${rect.id} ${rect.w}x${rect.h}`, rect.x + 6, rect.y + 18);
  });
  await writeFile(outputPath, await cv.encode("png"));
}

export async function writeContactSheet({ canvasMod, imagePaths, outputPath }) {
  const { createCanvas, loadImage } = canvasMod, images = [];
  for (const item of imagePaths) images.push({ ...item, image: await loadImage(item.path) });
  const cv = createCanvas(480, Math.max(300, images.length * 300)), ctx = cv.getContext("2d");
  ctx.fillStyle = "#0b0e11"; ctx.fillRect(0, 0, cv.width, cv.height);
  images.forEach((item, index) => { const y = index * 300, scale = Math.min(480 / item.image.width, 276 / item.image.height); ctx.drawImage(item.image, 0, y + 24, item.image.width * scale, item.image.height * scale); ctx.fillStyle = "#fff"; ctx.font = "16px sans-serif"; ctx.fillText(item.label, 8, y + 18); });
  await writeFile(outputPath, await cv.encode("png"));
}
