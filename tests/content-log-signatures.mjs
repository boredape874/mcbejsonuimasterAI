import assert from "node:assert/strict";
import { parseContentLog } from "../tools/_lib/content-log.mjs";

const log = [
  "[2026-09-04][UI][error] Unknown property at control path: shop.root/button",
  "[2026-09-04][Sound][error] missing sound unrelated",
  "[2026-09-04][Scripting][warning] slow callback",
  "malformed informational line",
].join("\r\n");
const report = parseContentLog(log, { targetControl: "shop.root" });
assert.equal(report.ok, false);
assert.equal(report.targetUiErrors[0].signature, "UI_UNKNOWN_PROPERTY");
assert.equal(report.targetUiErrors[0].controlPath, "shop.root/button");
assert.equal(report.externalNoise[0].category, "sound");
assert.equal(report.counts.script, 1);
const packWide = parseContentLog("[UI][error] JSON parse failed", { targetControl: "shop.root" });
assert.equal(packWide.ok, false); assert.equal(packWide.targetUiErrors[0].signature, "UI_JSON_PARSE_FAILURE");
console.log("content log signatures OK");
