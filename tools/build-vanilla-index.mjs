// tools/build-vanilla-index.mjs
// Build vanilla-index/screens.json + textures.json from local mirrors.
// Best-effort; never network.
// Usage: node tools/build-vanilla-index.mjs [--force]

import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { log } from "./_lib/log.mjs";
import { PATHS, VANILLA_INDEX_SCHEMAS } from "./_lib/paths.mjs";
import { exists, writeJson, ensureDir, readJson } from "./_lib/fsx.mjs";

async function walk(dir, filter, out = []) {
  let ents;
  try { ents = await readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  ents.sort((left, right) => left.name.localeCompare(right.name));
  for (const ent of ents) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) await walk(p, filter, out);
    else if (filter(p)) out.push(p);
  }
  return out;
}

function normalizeTextureKey(value) {
  if (!value.startsWith("textures/") || /[$#%]/.test(value)) return null;
  return value.replace(/\\/g, "/").replace(/\.(?:png|tga|jpe?g)$/i, "");
}

function addTexture(textures, key, source, path) {
  const normalized = normalizeTextureKey(key);
  if (!normalized) return;
  if (!textures[normalized]) textures[normalized] = [];
  if (!textures[normalized].some((entry) => entry.source === source && entry.path === path)) {
    textures[normalized].push({ source, path });
  }
}

async function indexDeclaredTextures(files, source, textures) {
  for (const file of files) {
    const path = relative(PATHS.root, file).split(sep).join("/");
    const text = await readFile(file, "utf8");
    const pattern = /["'](textures\/[A-Za-z0-9_./-]+)["']/g;
    let match;
    while ((match = pattern.exec(text))) addTexture(textures, match[1], source, path);
  }
}

async function main() {
  const force = process.argv.includes("--force");
  await ensureDir(PATHS.vanillaIndex);
  if (!force && await exists(PATHS.vanillaIndexScreens) && await exists(PATHS.vanillaIndexTextures)) {
    const screens = await readJson(PATHS.vanillaIndexScreens).catch(() => null);
    const textures = await readJson(PATHS.vanillaIndexTextures).catch(() => null);
    if (screens?.schema === VANILLA_INDEX_SCHEMAS.screens && textures?.schema === VANILLA_INDEX_SCHEMAS.textures) {
      log.info("vanilla-index already exists", { hint: "pass --force to rebuild" });
      return;
    }
  }

  const screens = {};
  const textures = {};
  let scanned = 0;

  for (const src of [
    { label: "ztech", path: PATHS.ztechMirror },
    { label: "bedrock-samples-ui", path: PATHS.bedrockSamplesUi },
  ]) {
    if (!(await exists(src.path))) continue;

    const nestedUi = join(src.path, "ui");
    const uiDir = await exists(nestedUi) ? nestedUi : src.path;
    const uiFiles = await walk(uiDir, (p) => p.endsWith(".json") || p.endsWith(".jsonc"));
    for (const f of uiFiles) {
      const rel = relative(PATHS.root, f).split(sep).join("/");
      const name = f.split(sep).pop().replace(/\.(json|jsonc)$/, "");
      if (!screens[name]) screens[name] = [];
      screens[name].push({ source: src.label, path: rel });
      scanned++;
    }

    const texDir = join(src.path, "textures");
    if (await exists(texDir)) {
      const imageFiles = await walk(texDir, (p) => /\.(png|tga|jpe?g)$/i.test(p));
      for (const f of imageFiles) {
        const rel = relative(PATHS.root, f).split(sep).join("/");
        const key = relative(src.path, f).split(sep).join("/");
        addTexture(textures, key, src.label, rel);
      }

      const textureJsonFiles = await walk(texDir, (p) => /\.jsonc?$/i.test(p));
      for (const f of textureJsonFiles) {
        const rel = relative(PATHS.root, f).split(sep).join("/");
        const key = relative(src.path, f).split(sep).join("/").replace(/\.jsonc?$/i, "");
        if (key.startsWith("textures/ui/")) addTexture(textures, key, src.label, rel);
      }
      await indexDeclaredTextures(textureJsonFiles, src.label, textures);
    }
    await indexDeclaredTextures(uiFiles, src.label, textures);
  }

  if (scanned === 0) {
    log.warn("no vanilla UI screens found", { hint: "run scripts/sync-ztech-vanilla.ps1" });
  }

  await writeJson(PATHS.vanillaIndexScreens, {
    schema: VANILLA_INDEX_SCHEMAS.screens,
    builtAt: new Date().toISOString(),
    count: Object.keys(screens).length,
    screens,
  });
  await writeJson(PATHS.vanillaIndexTextures, {
    schema: VANILLA_INDEX_SCHEMAS.textures,
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
