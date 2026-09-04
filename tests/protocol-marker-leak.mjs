import assert from "node:assert/strict";
import { detectProtocolMarkerLeaks } from "../tools/_lib/final-rp-v2/validator.mjs";

const leaked = detectProtocolMarkerLeaks([{ id: "balance", visible: true, text: "[BALANCE] 소지금 100" }]);
assert.equal(leaked.ok, false); assert.equal(leaked.issues[0].kind, "PROTOCOL_MARKER_LEAK");
assert.equal(detectProtocolMarkerLeaks([{ id: "balance", visible: true, text: "소지금 100" }]).ok, true);
assert.equal(detectProtocolMarkerLeaks([{ id: "debug", visible: false, text: "route:shop" }]).ok, true);
assert.equal(detectProtocolMarkerLeaks([{ id: "custom", visible: true, text: "@@100" }], { markers: ["@@"] }).ok, false);
console.log("protocol-marker-leak: ok");
