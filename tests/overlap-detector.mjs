import assert from "node:assert/strict";
import { detectIconTextOverlaps } from "../tools/_lib/final-rp-v2/validator.mjs";

const mask = (x, width = 3) => ({ origin: { x, y: 0 }, width, height: 3, data: new Uint8Array(width * 3).fill(255) });
const report = { controls: { item_icon: { id: "item_icon", type: "image", rect: { x: 0, y: 0, w: 3, h: 3 }, alphaBBox: { x: 0, y: 0, w: 3, h: 3 }, mask: mask(0) }, amount_label: { id: "amount_label", type: "glyphRun", rect: { x: 2, y: 0, w: 3, h: 3 }, alphaBBox: { x: 2, y: 0, w: 3, h: 3 }, mask: mask(2) } } };
for (const profileId of ["pc", "touch"]) { const result = detectIconTextOverlaps(report, { profileId, minimumPadding: 2 }); assert.equal(result.ok, false); assert.equal(result.issues[0].kind, "ICON_TEXT_OVERLAP"); assert.equal(result.issues[0].profileId, profileId); assert(result.issues[0].suggestion.delta >= 2); }
report.controls.amount_label.mask = mask(4); assert.equal(detectIconTextOverlaps(report).ok, true);
console.log("overlap-detector: ok");
