import assert from "node:assert/strict";
import { parseSidecarMetadata, stressNineSlice } from "../tools/_lib/final-rp-v2/texture-engine.mjs";

const decoded = { width: 12, height: 10 }, source = { x: 0, y: 0, w: 12, h: 10 };
const result = stressNineSlice(decoded, source, parseSidecarMetadata({ nineslice_size: [2, 3, 4, 1], base_size: [12, 10] }));
assert.equal(result.ok, true); assert.deepEqual(result.cases.map((entry) => entry.name), ["small", "base", "large"]);
assert(result.cases.every((entry) => entry.sourceCornersInBounds && entry.destinationCornersInBounds));
assert.equal(result.evidenceLevel, "final-pack-static-visual"); assert.equal(result.runtimeVerified, false);
const bad = stressNineSlice(decoded, source, parseSidecarMetadata({ nineslice_size: [2, 3, 4, 1], base_size: [12, 10] }), { sizes: { tooSmall: [5, 3] } });
assert.equal(bad.ok, false); assert.equal(bad.cases[0].result.reason, "destination_smaller_than_borders");
console.log("assets-nine-slice-stress: ok");
