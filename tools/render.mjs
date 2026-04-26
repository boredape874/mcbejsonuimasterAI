// tools/render.mjs
// Optional: render workspace/<name>/ui.json into preview.png + coords.json
// using @napi-rs/canvas. If the canvas module is unavailable the tool emits
// coords.json only (deterministic, no native deps required) and exits 0.
//
// Usage: node tools/render.mjs <ui.json> [<solved.json>] [--no-image]

import { dirname, resolve } from "node:path";
import { log } from "./_lib/log.mjs";
import { readJson, writeJson } from "./_lib/fsx.mjs";

function flattenSolvedRects(solved) {
  if (!solved || !solved.rects) return [];
  const baseW = (solved.base_resolution && solved.base_resolution[0]) || 1920;
  const baseH = (solved.base_resolution && solved.base_resolution[1]) || 1080;
  const out = [];
  for (const [id, r] of Object.entries(solved.rects)) {
    if (id === "__root__") continue;
    out.push({ id, x: r.x, y: r.y, w: r.w, h: r.h });
  }
  return { baseW, baseH, rects: out };
}

async function tryLoadCanvas() {
  try {
    const mod = await import("@napi-rs/canvas");
    return mod;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length) {
    log.error("usage: node tools/render.mjs <ui.json> [<solved.json>] [--no-image]");
    process.exit(64);
  }
  const noImage = args.includes("--no-image");
  const positional = args.filter((a) => !a.startsWith("--"));
  const uiFile = positional[0];
  const solvedFile = positional[1] || uiFile.replace(/ui\.json$/, "solved.json");

  const solved = await readJson(solvedFile);
  const ui = await readJson(uiFile).catch(() => null);
  const flat = flattenSolvedRects(solved);
  const outDir = dirname(uiFile);
  const coordsPath = resolve(outDir, "coords.json");
  await writeJson(coordsPath, {
    schema: "mcbe-jsonui-ai-kit/coords@1",
    base_resolution: [flat.baseW, flat.baseH],
    namespace: ui && ui.namespace,
    rects: flat.rects,
  });
  log.ok("coords written", { path: coordsPath, count: flat.rects.length });

  if (noImage) return;
  const canvasMod = await tryLoadCanvas();
  if (!canvasMod) {
    log.warn("@napi-rs/canvas not installed; skipping preview.png", {
      hint: "npm install --no-fund --no-audit @napi-rs/canvas",
    });
    return;
  }
  const { createCanvas } = canvasMod;
  const cv = createCanvas(flat.baseW, flat.baseH);
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#101418";
  ctx.fillRect(0, 0, flat.baseW, flat.baseH);
  const palette = ["#5fb3ff", "#ff7676", "#7bd88f", "#f7c873", "#c693f0", "#73d8ce"];
  let i = 0;
  for (const r of flat.rects) {
    const color = palette[i++ % palette.length];
    ctx.fillStyle = color + "55";
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`${r.id} ${r.w}x${r.h}`, r.x + 6, r.y + 18);
  }
  const pngPath = resolve(outDir, "preview.png");
  const buf = await cv.encode("png");
  const { writeFile } = await import("node:fs/promises");
  await writeFile(pngPath, buf);
  log.ok("preview written", { path: pngPath });
}

main().catch((e) => {
  log.error("render crashed", { error: String(e && e.message || e) });
  process.exit(1);
});
