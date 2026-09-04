import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createVanillaProfile, discoverMinecraftUwp } from "../tools/_lib/final-rp-v2/vanilla-profile.mjs";
import { FONT_UNAVAILABLE } from "../tools/_lib/final-rp-v2/font-engine.mjs";
import { PNG } from "pngjs";

function png() { return PNG.sync.write(new PNG({ width: 128, height: 128 })); }
const search = await mkdtemp(join(tmpdir(), "mcbe-uwp-v2-")), packageRoot = join(search, "Microsoft.MinecraftUWP_1.21.9301.0_x64__8wekyb3d8bbwe"), vanilla = join(packageRoot, "data", "resource_packs", "vanilla"), font = join(vanilla, "font");
await mkdir(font, { recursive: true }); await writeFile(join(font, "font_metadata.json"), JSON.stringify({ aliases: { default: "bitmap" }, fonts: { bitmap: { type: "bitmap" } } })); await writeFile(join(font, "default8.png"), png()); await writeFile(join(font, "glyph_00.png"), png());
const discovered = await discoverMinecraftUwp({ searchRoots: [search] }); assert.equal(discovered.version, "1.21.9301.0");
const profile = await createVanillaProfile({ searchRoots: [search] });
assert.equal(profile.font.status, "available"); assert.match(profile.fingerprint, /^[0-9a-f]{64}$/); assert.ok(profile.files.every((file) => !file.path.includes(search)));
assert.equal(JSON.stringify(profile).includes(packageRoot), false, "public profile must not contain an absolute installation path");
const unavailable = await createVanillaProfile({ searchRoots: [join(search, "missing")], useAppx: false }); assert.equal(unavailable.font.code, FONT_UNAVAILABLE);
console.log("final-rp-v2-vanilla-profile: ok");
