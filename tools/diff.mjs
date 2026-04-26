// tools/diff.mjs
// Optional: compare a target image (mock or screenshot) against the rendered preview.
// Requires `pngjs` and `pixelmatch` (optional deps). When unavailable, falls back to
// JSON-only rect-vs-rect diff between two coords.json files (path B can be a coords.json).
//
// Usage:
//   node tools/diff.mjs <target.png> <preview.png> [--out diff.png]
//   node tools/diff.mjs <target_coords.json> <preview_coords.json>

import { resolve, dirname, extname } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { log } from "./_lib/log.mjs";
import { readJson, writeJson } from "./_lib/fsx.mjs";

function isJson(p) { return extname(p).toLowerCase() === ".json"; }

async function tryLoad(name) {
  try { return await import(name); } catch { return null; }
}

function diffRects(a, b) {
  const byId = new Map(b.rects.map((r) => [r.id, r]));
  const issues = [];
  for (const ra of a.rects) {
    const rb = byId.get(ra.id);
    if (!rb) { issues.push({ id: ra.id, kind: "missing_in_b" }); continue; }
    const dx = rb.x - ra.x, dy = rb.y - ra.y;
    const dw = rb.w - ra.w, dh = rb.h - ra.h;
    if (dx || dy || dw || dh) {
      issues.push({ id: ra.id, dx, dy, dw, dh });
    }
    byId.delete(ra.id);
  }
  for (const ra of byId.values()) issues.push({ id: ra.id, kind: "missing_in_a" });
  return issues;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    log.error("usage: node tools/diff.mjs <target> <preview> [--out diff.png]");
    process.exit(64);
  }
  const targetPath = args[0];
  const previewPath = args[1];
  const outIdx = args.indexOf("--out");
  const outPath = outIdx >= 0 ? args[outIdx + 1] : resolve(dirname(previewPath), "diff.png");

  if (isJson(targetPath) && isJson(previewPath)) {
    const a = await readJson(targetPath);
    const b = await readJson(previewPath);
    const issues = diffRects(a, b);
    const reportPath = resolve(dirname(previewPath), "diff-coords.json");
    await writeJson(reportPath, {
      schema: "mcbe-jsonui-ai-kit/diff@1",
      target: targetPath,
      preview: previewPath,
      ok: issues.length === 0,
      issues,
    });
    log[issues.length ? "warn" : "ok"]("coords diff", { issues: issues.length, report: reportPath });
    process.exit(issues.length ? 8 : 0);
  }

  const PNGmod = await tryLoad("pngjs");
  const pixelmatchMod = await tryLoad("pixelmatch");
  if (!PNGmod || !pixelmatchMod) {
    log.error("pngjs / pixelmatch not installed; install them or pass two coords.json files instead", {
      hint: "npm install --no-fund --no-audit pngjs pixelmatch",
    });
    process.exit(2);
  }
  const PNG = PNGmod.PNG || PNGmod.default?.PNG || PNGmod.default;
  const pixelmatch = pixelmatchMod.default || pixelmatchMod;
  const a = PNG.sync.read(await readFile(targetPath));
  const b = PNG.sync.read(await readFile(previewPath));
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  const diff = new PNG({ width: w, height: h });
  const mismatched = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.1 });
  await writeFile(outPath, PNG.sync.write(diff));
  const reportPath = resolve(dirname(previewPath), "diff-image.json");
  await writeJson(reportPath, {
    schema: "mcbe-jsonui-ai-kit/diff@1",
    target: targetPath,
    preview: previewPath,
    width: w, height: h,
    mismatched_pixels: mismatched,
    diff_image: outPath,
  });
  log[mismatched ? "warn" : "ok"]("image diff", { mismatched, diff: outPath, report: reportPath });
  process.exit(mismatched ? 8 : 0);
}

main().catch((e) => {
  log.error("diff crashed", { error: String(e && e.message || e) });
  process.exit(1);
});
