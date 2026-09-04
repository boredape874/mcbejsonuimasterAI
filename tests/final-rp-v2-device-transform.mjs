import assert from "node:assert/strict";
import { DeviceTransform, LOGICAL_VIEWPORT } from "../tools/_lib/final-rp-v2/device-transform.mjs";

assert.deepEqual(LOGICAL_VIEWPORT, [480, 270]);
const fitted = DeviceTransform.fit({ screenshotSize: [1920, 1080], guiScale: 3, safeArea: [48, 27, 48, 27] });
for (const point of [[0, 0], [240, 135], [480, 270], [37.25, 249.75]]) {
  const roundTrip = fitted.pixelToLogical(fitted.logicalToPixel(point));
  assert.ok(Math.abs(roundTrip[0] - point[0]) < 1e-9 && Math.abs(roundTrip[1] - point[1]) < 1e-9);
}
assert.deepEqual(fitted.guiToPixel(fitted.pixelToGui([300, 210])), [300, 210]);
assert.equal(fitted.toJSON().guiScale, 3);

const samples = [[0, 0], [480, 0], [0, 270], [480, 270], [200, 100]].map(([x, y]) => ({ logical: [x, y], pixel: [2 * x + 0.1 * y + 10, -0.05 * x + 2.1 * y + 20] }));
const calibrated = DeviceTransform.calibrate({ screenshotSize: [1100, 700], guiScale: 2, samples });
assert.ok(calibrated.residual < 1e-9);
assert.ok(calibrated.confidence > 0.999999);
assert.deepEqual(calibrated.logicalToPixel([50, 30]).map((n) => Math.round(n * 1000) / 1000), [113, 80.5]);
console.log("final-rp-v2-device-transform: ok");
