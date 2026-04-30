// tools/validate.mjs
// Validate the compiled JSON UI: structural sanity + spec-driven rule checks.
// Usage: node tools/validate.mjs <ui.json> [<solved.json>] [--strict-root] [--report <path>]
//
//   --strict-root      require ui.namespace + ui.root_panel (compiler output mode).
//                      Default mode is permissive: handcrafted Bedrock UI files
//                      often use 'main_screen_content' / 'hud_content' / a
//                      modification entry instead of root_panel. In permissive
//                      mode the namespace+root_panel checks are downgraded to
//                      warnings, never errors.
//
//   --report <path>    write the JSON report to <path>. If omitted, only a
//                      one-line stdout summary is printed (no file litter).
//                      tools/run.mjs uses --report explicitly.

import { log } from "./_lib/log.mjs";
import { readJson, writeJson } from "./_lib/fsx.mjs";
import { validateUiFile, partition } from "./_lib/ui-validator.mjs";

function structural(ui, strict) {
  const issues = [];
  if (!ui || typeof ui !== "object") {
    issues.push({ severity: "error", path: "<root>", message: "ui is not an object" });
    return issues;
  }
  const sev = strict ? "error" : "warning";
  if (!ui.namespace || typeof ui.namespace !== "string") {
    issues.push({ severity: sev, path: "<root>", message: "missing namespace" });
  }
  // A handcrafted screen file does not need root_panel — Bedrock vanilla
  // hud_screen.json, server_form.json, chat_screen.json all use other names.
  // Only flag when strict mode is on (i.e. validating compiler output).
  if (strict && (!ui.root_panel || typeof ui.root_panel !== "object")) {
    issues.push({ severity: "error", path: "<root>", message: "missing root_panel" });
  }
  return issues;
}

function reportPathFromArgs(argv) {
  const i = argv.indexOf("--report");
  if (i === -1) return null;
  const v = argv[i + 1];
  if (!v || v.startsWith("--")) return null;
  return v;
}

function isStaticText(value) {
  return typeof value === "string" && !value.startsWith("#") && !value.startsWith("$");
}

function estimateTextWidth(text, fontSize = "normal", scale = 1) {
  const base = fontSize === "small" ? 8 : fontSize === "large" ? 14 : 10;
  let width = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (ch === "\n") continue;
    width += code > 0x2e80 ? base : base * 0.62;
  }
  return Math.ceil(width * scale);
}

function estimateTextHeight(text, fontSize = "normal", scale = 1) {
  const base = fontSize === "small" ? 8 : fontSize === "large" ? 14 : 10;
  const lines = String(text).split("\n").length;
  return Math.ceil(lines * base * scale * 1.25);
}

function expectedCollectionSize(el) {
  const c = el.collection;
  if (!c || !c.item_size) return null;
  const dims = c.dimensions || c.grid_dimensions;
  if (!dims) return null;
  const gap = c.gap || [0, 0];
  return [
    dims[0] * c.item_size[0] + Math.max(0, dims[0] - 1) * gap[0],
    dims[1] * c.item_size[1] + Math.max(0, dims[1] - 1) * gap[1],
  ];
}

function geometryIssues(solved) {
  const issues = [];
  if (!solved || !solved.rects || !Array.isArray(solved.elements)) return issues;
  const rects = solved.rects;
  const elements = solved.elements;
  const tolerance = 0;

  for (const el of elements) {
    const r = rects[el.id];
    const p = rects[el.parent || "__root__"];
    if (!r || !p) continue;
    const path = `${solved.screen || "solved"} > ${el.id}`;
    if (r.w <= 0 || r.h <= 0) {
      issues.push({
        severity: "error",
        path,
        message: `non-positive solved size ${r.w}x${r.h}`,
        suggestion: "Use explicit positive pixel size in IR; avoid percent/default sizes in the layout solver stage.",
      });
      continue;
    }
    const overflow = {
      left: p.x - r.x,
      top: p.y - r.y,
      right: (r.x + r.w) - (p.x + p.w),
      bottom: (r.y + r.h) - (p.y + p.h),
    };
    const clipped = Object.values(overflow).some((v) => v > tolerance);
    if (clipped) {
      issues.push({
        severity: "warning",
        path,
        message: `element extends outside parent "${el.parent || "__root__"}"`,
        suggestion: `Overflow px: left=${Math.max(0, overflow.left)}, top=${Math.max(0, overflow.top)}, right=${Math.max(0, overflow.right)}, bottom=${Math.max(0, overflow.bottom)}. Fix pos/size or declare the parent as an intentional clipped viewport.`,
      });
    }
    if (el.kind === "label" && el.props && isStaticText(el.props.text)) {
      const scale = Number(el.props.font_scale_factor ?? 1);
      const fontSize = el.props.font_size || "normal";
      const needH = estimateTextHeight(el.props.text, fontSize, scale);
      const needW = estimateTextWidth(el.props.text, fontSize, scale);
      if (r.h < needH + 2) {
        issues.push({
          severity: "warning",
          path,
          message: `label height ${r.h}px may clip static text`,
          suggestion: `Estimated minimum height is ${needH + 2}px for font_size=${fontSize}, font_scale_factor=${scale}.`,
        });
      }
      if (r.w < needW) {
        issues.push({
          severity: "info",
          path,
          message: `label width ${r.w}px may be too narrow for static text`,
          suggestion: `Estimated single-line width is ${needW}px. Increase size or intentionally truncate/wrap the text.`,
        });
      }
    }
    const collectionSize = expectedCollectionSize(el);
    if (collectionSize && (r.w < collectionSize[0] || r.h < collectionSize[1])) {
      issues.push({
        severity: "warning",
        path,
        message: `collection grid ${r.w}x${r.h}px may clip its declared items`,
        suggestion: `Expected at least ${collectionSize[0]}x${collectionSize[1]}px from dimensions/item_size/gap.`,
      });
    }
  }

  for (const c of solved.log || []) {
    if (c.error) {
      issues.push({
        severity: "warning",
        path: `${solved.screen || "solved"} > constraint:${c.op}`,
        message: c.error,
        suggestion: "Fix the IR constraint so all referenced elements share the required parent or edge relationship.",
      });
    }
  }

  return issues;
}

async function main() {
  const argv = process.argv.slice(2);
  const strict = argv.includes("--strict-root");
  const reportPath = reportPathFromArgs(argv);
  const positional = argv.filter((a, i) => {
    if (a.startsWith("--")) return false;
    // skip the value of --report
    if (i > 0 && argv[i - 1] === "--report") return false;
    return true;
  });
  const [uiFile, solvedFile] = positional;
  if (!uiFile) {
    log.error("usage: node tools/validate.mjs <ui.json> [<solved.json>] [--strict-root] [--report <path>]");
    process.exit(64);
  }
  const ui = await readJson(uiFile);
  const solved = solvedFile ? await readJson(solvedFile).catch(() => null) : null;
  const issues = [
    ...structural(ui, strict),
    ...(await validateUiFile(ui, uiFile)),
    ...geometryIssues(solved),
  ];
  const { errors, warnings, infos } = partition(issues);
  const report = {
    schema: "mcbe-jsonui-ai-kit/report@1",
    ok: errors.length === 0,
    strict,
    errors,
    warnings,
    infos,
    ui: uiFile,
    solved: solvedFile || null,
    checkedAt: new Date().toISOString(),
  };
  if (reportPath) await writeJson(reportPath, report);
  if (!report.ok) {
    log.error("validate FAIL", { errors: errors.length, warnings: warnings.length, ...(reportPath ? { report: reportPath } : {}) });
    process.exit(9);
  }
  log.ok("validate OK", { warnings: warnings.length, infos: infos.length, ...(reportPath ? { report: reportPath } : {}) });
}

main().catch((e) => {
  log.error("validate crashed", { error: String(e && e.message || e) });
  process.exit(1);
});
