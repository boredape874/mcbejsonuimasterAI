import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { PNG } from "pngjs";

export const UI_TEXTURE_PREFIX = "textures/";

function tokens(value) {
  return String(value || "").toLowerCase().replace(/\\/g, "/").split(/[^a-z0-9]+/).filter(Boolean);
}

export function classifyAsset(asset, taxonomy) {
  const words = new Set(tokens(`${asset.sourceRelativePath} ${asset.category}`));
  const match = (table) => Object.entries(table).filter(([, hints]) => hints.some((hint) => words.has(hint)));
  const roleMatches = match(taxonomy.roles || {}).map(([role]) => role);
  const categoryRole = taxonomy.categoryRole?.[asset.category];
  if (categoryRole && !roleMatches.includes(categoryRole)) roleMatches.unshift(categoryRole);
  const stateMatches = match(taxonomy.states || {}).map(([state]) => state);
  return {
    roles: roleMatches.length ? roleMatches : ["unclassified"],
    state: stateMatches[0] || "default",
    evidence: [
      ...(categoryRole ? [{ kind: "category", value: asset.category, inferredRole: categoryRole }] : []),
      ...(roleMatches.length ? [{ kind: "path-tokens", value: asset.sourceRelativePath }] : []),
    ],
  };
}

export function collectTextureRefs(value, jsonPath = "$", output = [], owner = {}) {
  if (Array.isArray(value)) value.forEach((item, index) => collectTextureRefs(item, `${jsonPath}[${index}]`, output, owner));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${jsonPath}.${key}`;
      const nextOwner = child && typeof child === "object" && !Array.isArray(child) && (child.type || key.includes("@") || key === "controls")
        ? { controlId: key === "controls" ? owner.controlId ?? null : key, controlType: child.type ?? (key.includes("@") ? "inherited" : owner.controlType ?? null) }
        : owner;
      if ((key === "texture" || key.endsWith("_texture")) && typeof child === "string" && !child.startsWith("$") && !child.startsWith("#")) {
        output.push({ texture: normalizeTextureRef(child), jsonPath: childPath, propertyPath: childPath, controlId: owner.controlId ?? null, controlType: owner.controlType ?? null });
      }
      collectTextureRefs(child, childPath, output, nextOwner);
    }
  }
  return output;
}

export function normalizeTextureRef(value) {
  return String(value).replace(/\\/g, "/").replace(/^\/+/, "").replace(/\.png$/i, "").toLowerCase();
}

export function buildTextureLookup(assets) {
  const lookup = new Map();
  for (const asset of assets) {
    if (asset.extension !== ".png") continue;
    const normalized = normalizeTextureRef(asset.sourceRelativePath);
    const textureIndex = normalized.lastIndexOf(UI_TEXTURE_PREFIX);
    if (textureIndex < 0) continue;
    const key = normalized.slice(textureIndex);
    const sourceKey = `${asset.sourceId}\0${key}`;
    for (const candidate of [sourceKey, key]) {
      const values = lookup.get(candidate) || [];
      values.push(asset.id);
      lookup.set(candidate, values);
    }
  }
  return lookup;
}

export function resolveTextureRef(sourceId, texture, lookup) {
  const key = normalizeTextureRef(texture);
  return lookup.get(`${sourceId}\0${key}`) || lookup.get(key) || [];
}

export async function analyzePalette(filePath, maxSamples = 4096) {
  const png = PNG.sync.read(await readFile(filePath));
  const stride = Math.max(1, Math.floor((png.width * png.height) / maxSamples));
  const buckets = new Map();
  let minX = png.width, minY = png.height, maxX = -1, maxY = -1, transitions = 0, neighbors = 0, edgeVisible = 0, edgeTotal = 0;
  let visible = 0;
  let alphaPixels = 0;
  for (let pixel = 0; pixel < png.width * png.height; pixel += stride) {
    const offset = pixel * 4;
    const alpha = png.data[offset + 3];
    if (alpha < 255) alphaPixels++;
    if (alpha < 16) continue;
    const x = pixel % png.width, y = Math.floor(pixel / png.width);
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    visible++;
    const r = png.data[offset] >> 4, g = png.data[offset + 1] >> 4, b = png.data[offset + 2] >> 4;
    const key = `${r},${g},${b}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    const o = (y * png.width + x) * 4, a = png.data[o + 3] >= 16;
    if (x === 0 || y === 0 || x === png.width - 1 || y === png.height - 1) { edgeTotal++; if (a) edgeVisible++; }
    if (x + 1 < png.width) { neighbors++; const n = o + 4; if (Math.abs(png.data[o] - png.data[n]) + Math.abs(png.data[o+1] - png.data[n+1]) + Math.abs(png.data[o+2] - png.data[n+2]) + Math.abs(png.data[o+3] - png.data[n+3]) > 48) transitions++; }
    if (y + 1 < png.height) { neighbors++; const n = o + png.width * 4; if (Math.abs(png.data[o] - png.data[n]) + Math.abs(png.data[o+1] - png.data[n+1]) + Math.abs(png.data[o+2] - png.data[n+2]) + Math.abs(png.data[o+3] - png.data[n+3]) > 48) transitions++; }
  }
  const palette = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key, count]) => {
    const [r, g, b] = key.split(",").map((part) => Number(part) * 16 + 8);
    return { hex: `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`, ratio: visible ? Number((count / visible).toFixed(4)) : 0 };
  });
  const bbox = maxX < 0 ? null : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  const cornerAlpha = [[0,0],[png.width-1,0],[0,png.height-1],[png.width-1,png.height-1]].map(([x,y]) => png.data[(y*png.width+x)*4+3]);
  const rgba = (x, y) => [...png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4)];
  const similar = (a, b) => a.reduce((sum, value, index) => sum + Math.abs(value - b[index]), 0) <= 64;
  const run = (points) => { const base = rgba(...points[0]); let count = 0; for (const point of points) { if (!similar(base, rgba(...point))) break; count++; } return count; };
  const borderRunEstimate = {
    top: run(Array.from({ length: Math.ceil(png.height / 2) }, (_, i) => [Math.floor(png.width / 2), i])),
    right: run(Array.from({ length: Math.ceil(png.width / 2) }, (_, i) => [png.width - 1 - i, Math.floor(png.height / 2)])),
    bottom: run(Array.from({ length: Math.ceil(png.height / 2) }, (_, i) => [Math.floor(png.width / 2), png.height - 1 - i])),
    left: run(Array.from({ length: Math.ceil(png.width / 2) }, (_, i) => [i, Math.floor(png.height / 2)])),
  };
  return { palette, sampledPixels: Math.ceil((png.width * png.height) / stride), transparentRatio: Number((alphaPixels / Math.ceil((png.width * png.height) / stride)).toFixed(4)), opaqueBounds: bbox, opaqueDensity: bbox ? Number((visible / (bbox.width * bbox.height)).toFixed(4)) : 0, colorTransitionDensity: neighbors ? Number((transitions / neighbors).toFixed(4)) : 0, edgeCoverage: edgeTotal ? Number((edgeVisible / edgeTotal).toFixed(4)) : 0, cornerAlpha, borderRunEstimate };
}

export function assetDiskPath(root, asset) {
  return resolve(root, "library", asset.libraryPath);
}

export function isUiTexture(asset) {
  const category = String(asset.category || "");
  const path = String(asset.sourceRelativePath || "").replace(/\\/g, "/").toLowerCase();
  const allowed = ["textures/bars", "textures/buttons", "textures/feature-icons", "textures/focus-selection", "textures/font-glyphs", "textures/forms-features", "textures/hud-overlays", "textures/icons", "textures/panels-frames", "textures/sliders-scrollbars", "textures/slots-containers", "textures/tabs-navigation", "textures/toggles"];
  return asset.extension === ".png" && allowed.some((prefix) => category === prefix || category.startsWith(`${prefix}/`)) && !/(^|\/)(blocks?|terrain|flipbook_textures)(\/|\.|$)/.test(path);
}

export function isJsonCandidate(asset) {
  return [".json", ".jsonc"].includes(extname(asset.sourceRelativePath || "").toLowerCase()) && ["json-ui", "supporting-json", "texture-metadata"].includes(asset.category);
}
