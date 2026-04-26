// tools/build-vanilla-index.mjs
// Build vanilla-index/screens.json + textures.json from local mirrors.
// Best-effort; never network.
// Usage: node tools/build-vanilla-index.mjs [--force]

import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { log } from "./_lib/log.mjs";
import { PATHS } from "./_lib/paths.mjs";
import { exists, writeJson, ensureDir } from "./_lib/fsx.mjs";

async function walk(dir, filter, out = []) {
  let ents;
  try { ents = await readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const ent of ents) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) await walk(p, filter, out);
    else if (filter(p)) out.push(p);
  }
  return out;
}

async function main() {
  const force = process.argv.includes("--force");
  await ensureDir(PATHS.vanillaIndex);

  const sources = [
    { label: "ztech", path: PATHS.ztechMirror },
    { label: "bedrock-samples-ui", path: PATHS.bedrockSamplesUi },
  ].filter(async (s) => await exists(s.path));

  const screens = {};
  const textures = {};
  let scanned = 0;

  for (const src of [
    { label: "ztech", path: PATHS.ztechMirror },
    { label: "bedrock-samples-ui", path: PATHS.bedrockSamplesUi },
  ]) {
    if (!(await exists(src.path))) continue;

    const uiDir = join(src.path, "ui");
    if (await exists(uiDir)) {
      const files = await walk(uiDir, (p) => p.endsWith(".json") || p.endsWith(".jsonc"));
      for (const f of files) {
        const rel = relative(PATHS.root, f).split(sep).join("/");
        const name = f.split(sep).pop().replace(/\.(json|jsonc)$/, "");
        if (!screens[name]) screens[name] = [];
        screens[name].push({ source: src.label, path: rel });
        scanned++;
      }
    }

    const texDir = join(src.path, "textures");
    if (await exists(texDir)) {
      const files = await walk(texDir, (p) => /\.(png|tga)$/i.test(p));
      for (const f of files) {
        const rel = relative(PATHS.root, f).split(sep).join("/");
        const key = relative(src.path, f).split(sep).join("/").replace(/\.(png|tga)$/i, "");
        if (!textures[key]) textures[key] = [];
        textures[key].push({ source: src.label, path: rel });
      }
    }
  }

  if (scanned === 0) {
    log.warn("no vanilla UI screens found", { hint: "run scripts/sync-ztech-vanilla.ps1" });
  }

  await writeJson(PATHS.vanillaIndexScreens, {
    schema: "mcbe-jsonui-ai-kit/vanilla-index/screens@1",
    builtAt: new Date().toISOString(),
    count: Object.keys(screens).length,
    screens,
  });
  await writeJson(PATHS.vanillaIndexTextures, {
    schema: "mcbe-jsonui-ai-kit/vanilla-index/textures@1",
    builtAt: new Date().toISOString(),
    count: Object.keys(textures).length,
    textures,
  });
  log.ok("vanilla-index built", {
    screens: Object.keys(screens).length,
    textures: Object.keys(textures).length,
  });
}

main().catch((e) => {
  log.error("build-vanilla-index crashed", { error: String(e && e.message || e) });
  process.exit(1);
});
