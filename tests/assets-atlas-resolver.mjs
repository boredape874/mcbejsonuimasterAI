import assert from "node:assert/strict";
import { ASSET_REFERENCE_KINDS, buildTextureLookup, resolveAssetReference } from "../tools/_lib/asset-semantics.mjs";

const lookup = buildTextureLookup([
  { id: "raw", sourceId: "pack", sourceRelativePath: "RP/textures/ui/button.png", extension: ".png" },
  { id: "apple-png", sourceId: "pack", sourceRelativePath: "RP/textures/items/apple.png", extension: ".png" },
  { id: "stone-png", sourceId: "pack", sourceRelativePath: "RP/textures/blocks/stone.png", extension: ".png" },
]);
assert.deepEqual(resolveAssetReference("textures/ui/button", { sourceId: "pack", textureLookup: lookup }).assetIds, ["raw"]);
const itemAtlas = { texture_data: { apple: { textures: "textures/items/apple" }, shared: { textures: "textures/items/shared" }, empty: {} } };
const blockAtlas = { texture_data: { stone: { textures: { path: "textures/blocks/stone" } }, shared: { textures: "textures/blocks/shared" } } };
const item = resolveAssetReference("apple", { sourceId: "pack", textureLookup: lookup, itemAtlas, blockAtlas }); assert.equal(item.kind, ASSET_REFERENCE_KINDS.ITEM_ATLAS); assert.deepEqual(item.paths, ["textures/items/apple"]); assert.equal(item.ok, true);
assert.equal(resolveAssetReference("stone", { sourceId: "pack", textureLookup: lookup, itemAtlas, blockAtlas }).kind, ASSET_REFERENCE_KINDS.BLOCK_ATLAS);
assert.equal(resolveAssetReference("shared", { itemAtlas, blockAtlas }).code, "ATLAS_KEY_AMBIGUOUS");
const missing = resolveAssetReference("not_real", { itemAtlas, blockAtlas }); assert.equal(missing.ok, false); assert.deepEqual(missing.paths, []);
assert.equal(resolveAssetReference("empty", { itemAtlas, blockAtlas }).code, "ATLAS_ENTRY_HAS_NO_TEXTURE");
assert.equal(resolveAssetReference("apple", { itemAtlas, blockAtlas }).code, "ATLAS_TEXTURE_NOT_FOUND");
console.log("assets-atlas-resolver: ok");
