import assert from "node:assert/strict";
import profiles from "../data/device-profiles.json" with { type: "json" };
import { transformFromDeviceProfile, validateDeviceProfile } from "../tools/_lib/final-rp-v2/device-transform.mjs";

assert.deepEqual(profiles.profiles.map((profile) => profile.device).sort(), ["pc", "touch"]);
for (const profile of profiles.profiles) { const checked = validateDeviceProfile(profile); assert.equal(checked.ok, true); const transform = transformFromDeviceProfile(profile); const json = transform.toJSON(); assert.equal(json.profileId, profile.id); assert.equal(json.runtimeVerified, false); assert.equal(json.evidenceLevel, "final-pack-static-visual"); assert.deepEqual(json.calibration.anchors, profile.calibration.anchors); }
const incomplete = validateDeviceProfile({ id: "bad", device: "touch" }); assert.equal(incomplete.ok, false); assert.equal(incomplete.code, "DEVICE_PROFILE_PROVENANCE_MISSING");
console.log("device-profile-provenance: ok");
