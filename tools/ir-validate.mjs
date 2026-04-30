// tools/ir-validate.mjs
// Usage: node tools/ir-validate.mjs <path/to/ir.yaml>

import { log } from "./_lib/log.mjs";
import { loadIr, validateIr, applyDefaults } from "./_lib/ir.mjs";

async function main() {
  const file = process.argv[2];
  if (!file) {
    log.error("usage: node tools/ir-validate.mjs <ir.yaml>");
    process.exit(64);
  }
  const ir = await loadIr(file);
  const r = await validateIr(ir);
  if (!r.ok) {
    log.error("IR schema validation failed", { errors: r.errors });
    process.exit(5);
  }
  const ird = applyDefaults(ir);

  // Cross-references: every constraint id and parent must exist
  const ids = new Set(ird.elements.map((e) => e.id));
  ids.add("__root__");
  const errs = [];
  for (const e of ird.elements) {
    if (e.parent && !ids.has(e.parent)) {
      errs.push(`element "${e.id}" parent "${e.parent}" not found`);
    }
  }
  for (const c of ird.constraints) {
    const targets = c.ids
      ? c.ids
      : [c.a, c.b].filter(Boolean).map((x) => x.split(".")[0]);
    for (const t of targets) {
      if (!ids.has(t)) errs.push(`constraint references unknown id "${t}"`);
    }
  }

  // Solver-stage unit policy. The schema knows Bedrock dynamic units so the IR
  // can document intent, but the deterministic geometry solver needs numbers.
  const sizeOwners = [
    { id: "__root__", size: ird.root.size },
    ...ird.elements.map((e) => ({ id: e.id, size: e.size })),
  ];
  for (const owner of sizeOwners) {
    for (const dim of owner.size) {
      if (typeof dim === "string") {
        errs.push(
          `element "${owner.id}" uses non-pixel size "${dim}"; solve with numeric pixel sizes first, then add Bedrock dynamic units during hand-finish`,
        );
      }
    }
  }

  for (const e of ird.elements) {
    if (e.auto_size?.mode === "collection_grid") {
      if (!e.collection?.item_size) errs.push(`element "${e.id}" auto_size collection_grid requires collection.item_size`);
      if (!(e.collection?.dimensions || e.collection?.grid_dimensions)) {
        errs.push(`element "${e.id}" auto_size collection_grid requires collection.dimensions`);
      }
    }
    if ((e.kind === "collection_grid" || e.kind === "collection_panel") && !e.collection) {
      errs.push(`element "${e.id}" kind ${e.kind} requires collection settings`);
    }
  }

  if (errs.length) {
    log.error("IR cross-reference errors", { errors: errs });
    process.exit(6);
  }

  log.ok("IR valid", { elements: ird.elements.length, constraints: ird.constraints.length });
}

main().catch((e) => {
  log.error("ir-validate crashed", { error: String(e && e.message || e) });
  process.exit(1);
});
