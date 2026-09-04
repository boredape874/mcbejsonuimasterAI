import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { traceUiRoute } from "../tools/_lib/ui-route-graph.mjs";

const root = await mkdtemp(resolve(tmpdir(), "jsonui-route-"));
try {
  await mkdir(resolve(root, "ui"));
  await writeFile(resolve(root, "ui/_ui_defs.json"), JSON.stringify({ ui_defs: ["ui/a.json", "ui/b.json"] }));
  await writeFile(resolve(root, "ui/_global_variables.json"), JSON.stringify({ "$known": 1 }));
  await writeFile(resolve(root, "ui/a.json"), JSON.stringify({ namespace: "demo", "base@demo.parent": { text: "$known" }, parent: { type: "panel" } }));
  await writeFile(resolve(root, "ui/b.json"), JSON.stringify({ namespace: "other", lone: { type: "label", text: "$missing" } }));
  let report = await traceUiRoute(root, "demo.base");
  assert.equal(report.ok, true); assert.deepEqual(report.route.map((item) => item.qualified), ["demo.base", "demo.parent"]);
  report = await traceUiRoute(root, "other.lone"); assert(report.issues.some((item) => item.code === "VARIABLE_REFERENCE_UNRESOLVED"));
  report = await traceUiRoute(root, "demo.absent"); assert(report.issues.some((item) => item.code === "CONTROL_MISSING"));
  await writeFile(resolve(root, "ui/a.json"), JSON.stringify({ namespace: "demo", "one@demo.two": {}, "two@demo.one": {} }));
  report = await traceUiRoute(root, "demo.one"); assert(report.issues.some((item) => item.code === "INHERITANCE_CYCLE"));
} finally { await rm(root, { recursive: true, force: true }); }
console.log("route graph OK");
