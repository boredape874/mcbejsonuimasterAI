import { access, readFile, readdir, realpath, stat } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { createHash } from "node:crypto";

async function exists(path) { try { await access(path); return true; } catch { return false; } }
function normalizeRect(rect, width, height) {
  const [x = 0, y = 0, w = width, h = height] = Array.isArray(rect) ? rect : [rect?.x, rect?.y, rect?.w, rect?.h];
  return { x, y, w, h };
}
export function normalizeInsets(value) {
  if (Number.isFinite(value)) return [value, value, value, value];
  if (Array.isArray(value) && value.length === 2) return [value[0], value[1], value[0], value[1]];
  if (Array.isArray(value) && value.length === 4) return value;
  return null;
}
function validPair(value) { return Array.isArray(value) && value.length === 2 && value.every(item => Number.isFinite(item) && item > 0); }
function versionParts(name) { return String(name).replace(/^vanilla_/, "").split(".").map(value => Number(value) || 0); }
function compareVersionPackDesc(a, b) {
  const left = versionParts(b.name), right = versionParts(a.name), length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index++) { const delta = (left[index] ?? 0) - (right[index] ?? 0); if (delta) return delta; }
  return a.name.localeCompare(b.name);
}
export async function discoverVanillaTextureRoots(vanillaRoot) {
  if (!vanillaRoot) return [];
  const explicit = resolve(vanillaRoot), parent = dirname(explicit), name = basename(explicit);
  if (name !== "vanilla") return [explicit];
  const overlays = (await readdir(parent, { withFileTypes: true }).catch(() => []))
    .filter(entry => entry.isDirectory() && /^vanilla_\d+(?:\.\d+)*$/.test(entry.name))
    .sort(compareVersionPackDesc)
    .map(entry => resolve(parent, entry.name));
  return [...overlays, explicit];
}
export function parseSidecarMetadata(value) {
  const ninesliceSize = normalizeInsets(value?.nineslice_size), baseSize = value?.base_size;
  if (!ninesliceSize || !ninesliceSize.every(item => Number.isFinite(item) && item >= 0)) return { ok: false, reason: "invalid_nineslice_size" };
  if (!validPair(baseSize)) return { ok: false, reason: "invalid_base_size" };
  if (ninesliceSize[0] + ninesliceSize[2] > baseSize[0] || ninesliceSize[1] + ninesliceSize[3] > baseSize[1]) return { ok: false, reason: "borders_exceed_base_size" };
  return { ok: true, ninesliceSize, baseSize: [...baseSize] };
}
export function computeNineSliceInsets(decoded, sourceRect, metadata, destinationRect) {
  if (!metadata?.ok) return { ok: false, reason: metadata?.reason || "invalid_metadata" };
  const xScale = decoded.width / metadata.baseSize[0], yScale = decoded.height / metadata.baseSize[1];
  const full = [metadata.ninesliceSize[0] * xScale, metadata.ninesliceSize[1] * yScale, metadata.ninesliceSize[2] * xScale, metadata.ninesliceSize[3] * yScale];
  const sourceInsets = [Math.max(0, full[0] - sourceRect.x), Math.max(0, full[1] - sourceRect.y), Math.max(0, full[2] - (decoded.width - sourceRect.x - sourceRect.w)), Math.max(0, full[3] - (decoded.height - sourceRect.y - sourceRect.h))];
  const destinationInsets = metadata.ninesliceSize.map((logical, index) => full[index] > 0 ? logical * sourceInsets[index] / full[index] : 0);
  if (sourceInsets[0] + sourceInsets[2] > sourceRect.w || sourceInsets[1] + sourceInsets[3] > sourceRect.h) return { ok: false, reason: "source_crop_smaller_than_borders", sourceInsets, destinationInsets };
  if (destinationInsets[0] + destinationInsets[2] > destinationRect.w || destinationInsets[1] + destinationInsets[3] > destinationRect.h) return { ok: false, reason: "destination_smaller_than_borders", sourceInsets, destinationInsets };
  return { ok: true, sourceInsets, destinationInsets };
}
export function stressNineSlice(decoded, sourceRect, metadata, { sizes = null } = {}) {
  const base = metadata?.baseSize ?? [sourceRect?.w ?? 0, sourceRect?.h ?? 0], borders = metadata?.ninesliceSize ?? [0, 0, 0, 0];
  const minimum = [borders[0] + borders[2], borders[1] + borders[3]];
  const matrix = sizes ?? { small: minimum, base, large: [base[0] * 2, base[1] * 2] };
  const cases = Object.entries(matrix).map(([name, size]) => {
    const destinationRect = { x: 0, y: 0, w: Number(size[0]), h: Number(size[1]) }, result = computeNineSliceInsets(decoded, sourceRect, metadata, destinationRect);
    const sourceCornersInBounds = result.ok && result.sourceInsets.every((value, index) => Number.isFinite(value) && value >= 0 && value <= (index % 2 === 0 ? sourceRect.w : sourceRect.h));
    const destinationCornersInBounds = result.ok && result.destinationInsets[0] + result.destinationInsets[2] <= destinationRect.w && result.destinationInsets[1] + result.destinationInsets[3] <= destinationRect.h;
    return { name, size: [...size], ok: result.ok && sourceCornersInBounds && destinationCornersInBounds, sourceCornersInBounds, destinationCornersInBounds, result };
  });
  return { ok: cases.every((entry) => entry.ok), cases, evidenceLevel: "final-pack-static-visual", runtimeVerified: false };
}
export function scanAlpha(imageData, threshold = 0) {
  const { data, width, height } = imageData;
  let minX = width, minY = height, maxX = -1, maxY = -1, weight = 0, weightedX = 0, weightedY = 0, pixels = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const alpha = data[(y * width + x) * 4 + 3];
    if (alpha <= threshold) continue;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    weight += alpha; weightedX += (x + 0.5) * alpha; weightedY += (y + 0.5) * alpha; pixels++;
  }
  if (maxX < minX) return { bbox: null, centroid: null, pixels: 0, alphaWeight: 0 };
  return { bbox: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }, centroid: { x: weightedX / weight, y: weightedY / weight }, pixels, alphaWeight: weight };
}

export class TextureEngine {
  constructor({ canvasMod, targetRoot, vanillaRoot = null, decodeCache = null }) {
    this.canvasMod = canvasMod; this.targetRoot = resolve(targetRoot); this.vanillaRoot = vanillaRoot ? resolve(vanillaRoot) : null;
    this.vanillaRoots = discoverVanillaTextureRoots(this.vanillaRoot);
    this.pathCache = new Map(); this.decodeCache = decodeCache ?? new Map(); this.sidecarCache = new Map(); this.realRoots = new Map();
  }
  async resolve(texture) {
    if (texture === "textures/ui/Black" || texture === "textures/ui/White") return { kind: "builtin", id: texture };
    if (typeof texture !== "string" || texture.startsWith("#") || texture.startsWith("$") || texture.startsWith("@")) return null;
    const normalized = texture.replaceAll("\\", "/"), segments = normalized.split("/");
    if (isAbsolute(texture) || /^[A-Za-z]:/.test(texture) || segments.includes("..") || segments.includes(".")) { const rejected={kind:"rejected",reason:"unsafe_texture_path",texture};this.pathCache.set(texture,rejected);return rejected; }
    const roots = [this.targetRoot, ...await this.vanillaRoots];
    for (const root of roots) for (const suffix of extname(normalized) ? [""] : [".png", ".tga", ".jpg"]) {
      const candidate = resolve(root, normalized + suffix);
      if (await exists(candidate)) {
        const realRoot = this.realRoots.get(root) || await realpath(root); this.realRoots.set(root, realRoot);
        const realCandidate = await realpath(candidate), rel = relative(realRoot, realCandidate);
        if (rel === ".." || rel.startsWith(`..\\`) || rel.startsWith("../") || isAbsolute(rel)) { const rejected={kind:"rejected",reason:"symlink_escape",texture,path:realCandidate};this.pathCache.set(texture,rejected);return rejected; }
        const result = { kind: "file", path: realCandidate, sourceRoot: root === this.targetRoot ? "target" : "vanilla" }; this.pathCache.set(texture, result); return result;
      }
    }
    this.pathCache.set(texture, null); return null;
  }
  async decode(texture) {
    const resolved = await this.resolve(texture);
    if (!resolved || resolved.kind === "rejected") return resolved;
    if (resolved.kind === "builtin") return resolved;
    const bytes=await readFile(resolved.path),stamp=createHash("sha256").update(bytes).digest("hex"),cached=this.decodeCache.get(resolved.path);
    if (cached?.stamp===stamp) return cached.promise;
    const promise = (async () => {
      const image = await this.canvasMod.loadImage(bytes), canvas = this.canvasMod.createCanvas(image.width, image.height), ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0); const alpha = scanAlpha(ctx.getImageData(0, 0, image.width, image.height));
      return { ...resolved, image, width: image.width, height: image.height, alpha, contentHash: stamp };
    })();
    this.decodeCache.set(resolved.path, {stamp,promise}); return promise;
  }
  async sidecar(texture) {
    const resolved = await this.resolve(texture);
    if (!resolved || resolved.kind !== "file") return resolved?.kind === "rejected" ? resolved : null;
    const path = resolved.path.replace(/\.[^.]+$/, ".json");
    const sidecarStamp=await stampOf(path),cached=this.sidecarCache.get(path);if(cached?.stamp===sidecarStamp)return cached.value;
    let value = null;
    try { value = parseSidecarMetadata(JSON.parse(await readFile(path, "utf8"))); } catch (error) { if (await exists(path)) value = { ok: false, reason: "invalid_sidecar_json", message: error.message }; }
    this.sidecarCache.set(path, {stamp:sidecarStamp,value}); return value;
  }
  sourceRect(decoded, uv, uvSize) {
    if (!decoded || decoded.kind === "builtin") return null;
    const origin = Array.isArray(uv) ? uv : [0, 0], size = Array.isArray(uvSize) ? uvSize : [decoded.width - origin[0], decoded.height - origin[1]];
    const rect = normalizeRect([origin[0], origin[1], size[0], size[1]], decoded.width, decoded.height);
    rect.x = Math.max(0, Math.min(decoded.width, rect.x)); rect.y = Math.max(0, Math.min(decoded.height, rect.y));
    rect.w = Math.max(0, Math.min(decoded.width - rect.x, rect.w)); rect.h = Math.max(0, Math.min(decoded.height - rect.y, rect.h));
    return rect;
  }
  alphaForSource(decoded, sourceRect) {
    if (!decoded || decoded.kind === "builtin" || !sourceRect) return null;
    const canvas = this.canvasMod.createCanvas(sourceRect.w, sourceRect.h), ctx = canvas.getContext("2d");
    ctx.drawImage(decoded.image, sourceRect.x, sourceRect.y, sourceRect.w, sourceRect.h, 0, 0, sourceRect.w, sourceRect.h);
    return scanAlpha(ctx.getImageData(0, 0, sourceRect.w, sourceRect.h));
  }
}
async function stampOf(path){try{const info=await stat(path);return`${info.size}:${info.mtimeMs}`;}catch{return"missing";}}

export function drawNineSlice(ctx, image, sourceRect, destinationRect, sourceInsets, destinationInsets) {
  const [sl, st, sr, sb] = sourceInsets, [dl, dt, dr, db] = destinationInsets;
  const sx = [sourceRect.x, sourceRect.x + sl, sourceRect.x + sourceRect.w - sr, sourceRect.x + sourceRect.w];
  const sy = [sourceRect.y, sourceRect.y + st, sourceRect.y + sourceRect.h - sb, sourceRect.y + sourceRect.h];
  const dx = [destinationRect.x, destinationRect.x + dl, destinationRect.x + destinationRect.w - dr, destinationRect.x + destinationRect.w];
  const dy = [destinationRect.y, destinationRect.y + dt, destinationRect.y + destinationRect.h - db, destinationRect.y + destinationRect.h];
  for (let row = 0; row < 3; row++) for (let column = 0; column < 3; column++) {
    const sw = sx[column + 1] - sx[column], sh = sy[row + 1] - sy[row], dw = dx[column + 1] - dx[column], dh = dy[row + 1] - dy[row];
    if (sw > 0 && sh > 0 && dw > 0 && dh > 0) ctx.drawImage(image, sx[column], sy[row], sw, sh, dx[column], dy[row], dw, dh);
  }
}
