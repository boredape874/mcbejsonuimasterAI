// tools/solve.mjs
// Usage: node tools/solve.mjs <ir.yaml> <solved.json>

import { log } from "./_lib/log.mjs";
import { loadIr, validateIr, applyDefaults } from "./_lib/ir.mjs";
import { solve as solveNode } from "./_lib/solver.mjs";
import { solveWithGo } from "./_lib/go-solver.mjs";
import { writeJson } from "./_lib/fsx.mjs";

function solveSelected(ird) {
  const mode = (process.env.MCBEKIT_SOLVER || "auto").toLowerCase();
  if (mode === "node") return { result: solveNode(ird), solver: "node" };
  try {
    return { result: solveWithGo(ird), solver: "go" };
  } catch (e) {
    if (mode === "go") throw e;
    log.warn("go solver unavailable; falling back to node", { error: String(e && e.message || e) });
    return { result: solveNode(ird), solver: "node" };
  }
}

async function main() {
  const [, , inFile, outFile] = process.argv;
  if (!inFile || !outFile) {
    log.error("usage: node tools/solve.mjs <ir.yaml> <solved.json>");
    process.exit(64);
  }
  const ir = await loadIr(inFile);
  const v = await validateIr(ir);
  if (!v.ok) {
    log.error("IR invalid; run tools/ir-validate.mjs", { errors: v.errors });
    process.exit(5);
  }
  const ird = applyDefaults(ir);
  const { result, solver } = solveSelected(ird);
  await writeJson(outFile, {
    schema: "mcbe-jsonui-ai-kit/solved@1",
    namespace: ird.namespace,
    screen: ird.screen,
    base_resolution: ird.base_resolution,
    solver,
    converged: result.converged,
    iterations: result.iterations,
    rects: result.rects,
    log: result.log,
    elements: ird.elements,
    root: ird.root,
  });
  if (!result.converged) {
    log.warn("solver did not converge", { iterations: result.iterations });
    process.exit(7);
  }
  log.ok("solved", { elements: ird.elements.length, iterations: result.iterations, solver });
}

main().catch((e) => {
  log.error("solve crashed", { error: String(e && e.message || e) });
  process.exit(1);
});
