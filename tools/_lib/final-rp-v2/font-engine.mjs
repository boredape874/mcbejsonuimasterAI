import { readFile, readdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { PNG } from "pngjs";

export const FONT_UNAVAILABLE = "FONT_UNAVAILABLE";
export const GLYPH_MISSING = "GLYPH_MISSING";
const FONT_SIZE_SCALE = Object.freeze({ small: 5 / 6, normal: 1, large: 4 / 3, extra_large: 5 / 3 });

export class FontUnavailableError extends Error {
  constructor(message = "Minecraft font assets are unavailable", details = {}) { super(message); this.name = "FontUnavailableError"; this.code = FONT_UNAVAILABLE; this.details = details; }
}
export class GlyphMissingError extends FontUnavailableError {
  constructor(message, details = {}) { super(message, details); this.name = "GlyphMissingError"; this.code = GLYPH_MISSING; }
}

async function exists(path) { try { await readFile(path); return true; } catch { return false; } }
function pngSize(buffer) {
  if (buffer.length < 24 || buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a") throw new Error("Invalid PNG font atlas");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function atlasMetrics(buffer) {
  const png = PNG.sync.read(buffer), cellW = png.width / 16, cellH = png.height / 16;
  if (!Number.isInteger(cellW) || !Number.isInteger(cellH)) throw new FontUnavailableError("Minecraft font atlas dimensions must form a 16x16 grid", { size: [png.width, png.height] });
  const glyphs = [];
  for (let index = 0; index < 256; index++) {
    const ox = (index % 16) * cellW, oy = Math.floor(index / 16) * cellH; let minX = cellW, minY = cellH, maxX = -1, maxY = -1;
    for (let y = 0; y < cellH; y++) for (let x = 0; x < cellW; x++) if (png.data[((oy + y) * png.width + ox + x) * 4 + 3] !== 0) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
    glyphs.push({ uv: [ox, oy], uv_size: [cellW, cellH], alpha: maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } });
  }
  return { size: [png.width, png.height], cell: [cellW, cellH], glyphs };
}

function collectAliases(metadata) {
  const aliases = {};
  for (const key of ["font_aliases", "fontAliases", "aliases"]) {
    const value = metadata?.[key];
    if (Array.isArray(value)) {
      for (const item of value) if (item?.alias) aliases[item.alias] = item;
    } else if (value && typeof value === "object") Object.assign(aliases, value);
  }
  const types = metadata?.font_types ?? metadata?.fontTypes ?? metadata?.fonts ?? {};
  if (Array.isArray(types)) {
    const mapped = {};
    for (const item of types) if (item?.font_name) mapped[item.font_name] = item;
    return { aliases, types: mapped };
  }
  if (types && typeof types === "object") for (const [name, value] of Object.entries(types)) {
    if (typeof value === "string") aliases[name] = value;
    else if (value && typeof value === "object" && (value.alias || value.font)) aliases[name] = value.alias ?? value.font;
  }
  return { aliases, types };
}

export async function inspectMinecraftFonts(fontRoot, { metadataName = "font_metadata.json" } = {}) {
  const metadataPath = join(fontRoot, metadataName), defaultPath = join(fontRoot, "default8.png");
  if (!(await exists(metadataPath)) || !(await exists(defaultPath))) throw new FontUnavailableError("Required Minecraft font_metadata.json or default8.png is missing", { missing: [!(await exists(metadataPath)) && metadataName, !(await exists(defaultPath)) && "default8.png"].filter(Boolean) });
  let metadata;
  try { metadata = JSON.parse(await readFile(metadataPath, "utf8")); } catch (error) { throw new FontUnavailableError("Minecraft font_metadata.json is invalid", { cause: error.message }); }
  const names = await readdir(fontRoot), glyphNames = names.filter((name) => /^glyph_[0-9a-f]+\.png$/i.test(name)).sort();
  const defaultData = await readFile(defaultPath), defaultAtlasMetrics = atlasMetrics(defaultData), glyphAtlases = [];
  for (const name of glyphNames) { const metrics = atlasMetrics(await readFile(join(fontRoot, name))); glyphAtlases.push({ name, texture: `font/${name.slice(0, -4)}`, page: Number.parseInt(name.slice(6, -4), 16), ...metrics }); }
  const { aliases, types } = collectAliases(metadata);
  const result = { status: "available", metadata, aliases, types, defaultAtlas: { name: basename(defaultPath), texture: "font/default8", ...defaultAtlasMetrics }, glyphAtlases };
  Object.defineProperty(result, "fontRoot", { value: fontRoot, enumerable: false });
  return result;
}

export function resolveFontType(font, requested = "default") {
  if (!font || font.status !== "available") throw new FontUnavailableError();
  let current = requested || "default"; const chain = [];
  if (["default", "unicode", "UnicodeFont"].includes(current)) return { requested, resolved: current === "default" ? "default8" : "UnicodeFont", chain: [current], definition: { font_format: "bitmap" } };
  for (let i = 0; i < 16; i++) {
    chain.push(current); const next = font.aliases?.[current];
    if (!next || next === current) return { requested, resolved: current, chain, definition: font.types?.[current] ?? null };
    if (typeof next === "object" && Array.isArray(next.fonts)) return { requested, resolved: current, chain, definition: next };
    current = typeof next === "string" ? next : String(next.alias ?? next.font);
  }
  throw new Error(`Font alias cycle: ${chain.join(" -> ")}`);
}

export class MinecraftFontEngine {
  constructor(fontProfile) { if (!fontProfile || fontProfile.status !== "available") throw new FontUnavailableError(); this.profile = fontProfile; }
  resolve(type) { return resolveFontType(this.profile, type); }
  requireGlyphPage(codePoint) {
    const page = Math.floor(Number(codePoint) / 256), found = this.profile.glyphAtlases.find((atlas) => atlas.page === page);
    if (!found) throw new FontUnavailableError(`Minecraft glyph page ${page.toString(16).padStart(2, "0")} is unavailable`, { codePoint, page });
    return found;
  }

  #atlasFor(codePoint, resolution) {
    if (resolution.resolved === "default8" && codePoint < 256) return { atlas: this.profile.defaultAtlas, index: codePoint };
    let definition = resolution.definition;
    if (Array.isArray(definition?.fonts)) {
      const matches = definition.fonts.filter((candidate) => candidate.font_ranges?.some((range) => codePoint >= range.first && codePoint <= range.last));
      const candidate = matches[0] ?? definition.fonts.find((item) => !item.font_ranges);
      if (!candidate) throw new FontUnavailableError(`Font alias ${resolution.requested} has no font for this code point`, { fontType: resolution.requested, codePoint });
      const reference = candidate.font_reference;
      if (["unicode", "UnicodeFont"].includes(reference)) definition = { font_format: "bitmap" };
      else definition = this.profile.types?.[reference] ?? null;
    }
    if (definition?.font_format && definition.font_format !== "bitmap") throw new FontUnavailableError(`Font type ${resolution.requested} is not a bitmap glyph atlas`, { fontType: resolution.requested, format: definition.font_format });
    if (!definition) throw new FontUnavailableError(`Font type ${resolution.requested} cannot be resolved to a Minecraft bitmap atlas`, { fontType: resolution.requested, codePoint });
    return { atlas: this.requireGlyphPage(codePoint), index: codePoint & 255 };
  }
  layoutText({ text, fontType = "default", fontSize = "normal", fontScale = 1, rect, alignment = "left", shadow = false }) {
    if (!rect || ![rect.x, rect.y, rect.w, rect.h].every(Number.isFinite)) throw new TypeError("rect must contain finite x, y, w, h");
    const scale = Number(fontScale) * (FONT_SIZE_SCALE[fontSize] ?? 1); if (!(scale > 0)) throw new RangeError("fontScale must be positive");
    const resolution = this.resolve(fontType), lineHeight = 9 * scale, baselineOffset = 7 * scale;
    const sourceLines = String(text ?? "").split("\n"), lines = []; let clipped = false;
    for (let lineIndex = 0; lineIndex < sourceLines.length; lineIndex++) {
      const entries = []; let width = 0;
      for (const char of sourceLines[lineIndex]) {
        const codePoint = char.codePointAt(0), { atlas, index } = this.#atlasFor(codePoint, resolution), metric = atlas.glyphs[index];
        if (char !== " " && !metric?.alpha) throw new GlyphMissingError(`Minecraft glyph U+${codePoint.toString(16).toUpperCase().padStart(4, "0")} is missing from its bitmap atlas`, { codePoint, atlas: atlas.name });
        const natural = metric.alpha ? metric.alpha.w / atlas.cell[0] * 8 : 3;
        const advance = (char === " " ? 4 : Math.max(2, Math.min(8, Math.ceil(natural) + 1))) * scale;
        entries.push({ char, codePoint, atlas, metric, advance }); width += advance;
      }
      lines.push({ entries, width, lineIndex });
    }
    const glyphs = [], bboxes = [];
    const textBlockHeight = lines.length * lineHeight;
    const originY = rect.y + Math.max(0, (rect.h - textBlockHeight) / 2);
    for (const line of lines) {
      const y = originY + line.lineIndex * lineHeight, startX = alignment === "center" ? rect.x + (rect.w - line.width) / 2 : alignment === "right" ? rect.x + rect.w - line.width : rect.x; let x = startX;
      if (y + lineHeight > rect.y + rect.h) { clipped ||= line.entries.length > 0; continue; }
      for (const entry of line.entries) {
        const drawRect = { x, y, w: 8 * scale, h: 8 * scale }, visible = x < rect.x + rect.w && x + entry.advance > rect.x;
        if (entry.char !== " " && entry.metric.alpha && visible) {
          const glyph = { id: `U+${entry.codePoint.toString(16).toUpperCase().padStart(4, "0")}`, char: entry.char, codePoint: entry.codePoint, texture: entry.atlas.texture, uv: entry.metric.uv, uv_size: entry.metric.uv_size, rect: drawRect, baseline: y + baselineOffset, bbox: { x: x + entry.metric.alpha.x / entry.atlas.cell[0] * drawRect.w, y: y + entry.metric.alpha.y / entry.atlas.cell[1] * drawRect.h, w: entry.metric.alpha.w / entry.atlas.cell[0] * drawRect.w, h: entry.metric.alpha.h / entry.atlas.cell[1] * drawRect.h } };
          glyphs.push(glyph); bboxes.push(glyph.bbox);
          if (shadow) glyph.shadow = { offset: [scale, scale], alpha: 0.25 };
        }
        if (!visible || x + entry.advance > rect.x + rect.w) clipped = true;
        x += entry.advance;
      }
    }
    const bbox = bboxes.length ? { x: Math.min(...bboxes.map(v=>v.x)), y: Math.min(...bboxes.map(v=>v.y)), w: Math.max(...bboxes.map(v=>v.x+v.w))-Math.min(...bboxes.map(v=>v.x)), h: Math.max(...bboxes.map(v=>v.y+v.h))-Math.min(...bboxes.map(v=>v.y)) } : null;
    return { type: "glyphRun", font: resolution, glyphs, rect: { ...rect }, baseline: originY + baselineOffset, bbox, lineHeight, contentSize: { w: Math.max(0, ...lines.map(line => line.width)), h: textBlockHeight }, clipped };
  }
  attachGlyphRun(node, options = {}) {
    const props = node.props ?? node;
    const glyphRun = this.layoutText({ text: props.text ?? "", fontType: props.font_type ?? props.fontType ?? "default", fontSize: props.font_size ?? props.fontSize ?? "normal", fontScale: props.font_scale_factor ?? props.fontScale ?? 1, rect: options.rect ?? node.rect ?? props.rect, alignment: props.text_alignment ?? props.alignment ?? "left", shadow: props.shadow ?? false });
    node.glyphRun = glyphRun; return node;
  }
}

export function attachGlyphRun(node, engine, options) { return engine.attachGlyphRun(node, options); }
