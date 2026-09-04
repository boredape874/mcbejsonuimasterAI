import assert from "node:assert/strict";
import { compareVanillaVersionProfiles, createVanillaVersionProfiles, VANILLA_PROFILE_MISMATCH } from "../tools/_lib/final-rp-v2/vanilla-profile.mjs";

const profile = (version, fingerprint) => ({ status: "available", version, fingerprint });
const same = compareVanillaVersionProfiles({ main: profile("1.21.1", "a"), preview: profile("1.21.1", "a"), installed: profile("1.21.1", "a") });
assert.equal(same.ok, true);
const mismatch = compareVanillaVersionProfiles({ main: profile("1.21.1", "a"), preview: profile("1.22.0", "b"), installed: profile("1.21.1", "a") });
assert.equal(mismatch.ok, false); assert.equal(mismatch.code, VANILLA_PROFILE_MISMATCH); assert.equal(mismatch.runtimeVerified, false);
const bundle = await createVanillaVersionProfiles({ main: profile("1", "a"), preview: profile("1", "a"), installed: { status: "unavailable" } });
assert.deepEqual(bundle.comparison.missing, ["installed"]); assert.equal(bundle.evidenceLevel, "integrated_static");
console.log("assets-vanilla-version-profiles: ok");
