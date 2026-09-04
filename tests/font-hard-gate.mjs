import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { GLYPH_MISSING, inspectMinecraftFonts, MinecraftFontEngine } from "../tools/_lib/final-rp-v2/font-engine.mjs";

const root = await mkdtemp(join(tmpdir(), "font-hard-gate-")), atlas = new PNG({ width: 128, height: 128 });
await writeFile(join(root, "font_metadata.json"), JSON.stringify({})); await writeFile(join(root, "default8.png"), PNG.sync.write(atlas));
const engine = new MinecraftFontEngine(await inspectMinecraftFonts(root));
assert.throws(() => engine.layoutText({ text: "A", rect: { x: 0, y: 0, w: 20, h: 9 } }), (error) => error.code === GLYPH_MISSING);
assert.doesNotThrow(() => engine.layoutText({ text: " ", rect: { x: 0, y: 0, w: 20, h: 9 } }));
console.log("font-hard-gate: ok");
