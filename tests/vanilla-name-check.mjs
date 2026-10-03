// tools/vanilla-name-check.mjs must find names that the pinned official sample
// files contain, reject names that no longer exist in them, and never report a
// third-party pack name as vanilla. Runs offline against the 12 committed files.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { checkVanillaNames } from "../tools/vanilla-name-check.mjs";
import { SELECTED_FILES } from "../tools/sync-bedrock-samples-ui.mjs";
import { buildNameIndex, lookupName, collectNames } from "../tools/_lib/vanilla-names.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
function run(args) {
  return new Promise((done) => {
    const child = spawn(process.execPath, args, { cwd: ROOT });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (code) => done({ code, stdout, stderr }));
  });
}

// Pure extraction on a synthetic document.
const synthetic = collectNames('{"namespace":"demo","root@common.base":{"renderer":"paper_doll_renderer","texture":"textures/ui/demo","bindings":[{"binding_name":"#demo_binding"}],"$size|default":[1,1],"button_mappings":[{"to_button_id":"button.demo_click"}]},"$shared":1}', { namespace: "demo", "root@common.base": {}, $shared: 1 }, "demo.json");
assert.deepEqual([...synthetic.controls], ["demo.root", "demo.$shared"]);
assert.deepEqual([...synthetic.bindings], ["#demo_binding"]);
assert.deepEqual([...synthetic.buttonIds], ["button.demo_click"]);
assert.deepEqual([...synthetic.variables], ["$size", "$shared"]);
assert.deepEqual([...synthetic.renderers], ["paper_doll_renderer"]);
assert.deepEqual([...synthetic.textures], ["textures/ui/demo"]);
assert.deepEqual([...collectNames("", { ui_defs: ["ui/a.json"] }, "_ui_defs.json").screens], ["ui/a.json"]);

// Pinned-only lookups (no mirror) must agree with the 1.26.50 sample set.
const report = await checkVanillaNames([
  "common.button", "server_form.custom_multiselect", "hud.subtitle_container_content", "furnace.tab_offset_anim",
  "common_dialogs.main_panel_two_buttons", "common_buttons.light_text_button", "npc_interact.npc_screen", "$top_button_panel", "$close_button_to_button_id",
  "#hud_title_text_string", "#custom_multiselect_toggled", "$9_color_format", "button.menu_inventory_exit",
  "hotbar_renderer", "ui/hud_crosshair_overlay.json", "subtitle_container_content", "textures/ui/Black",
  // gone or never vanilla
  "crafting.tab_offset_anim", "common.creative_layout_toggle", "ui/realmsPlus_screen.json", "hotbar_slots_renderer", "menu.quest", "#not_a_vanilla_binding",
], { useMirror: false });
assert.equal(report.mirrorUsed, false);
assert.equal(report.filesIndexed, SELECTED_FILES.length);
assert.equal(report.revision?.tag, "v1.26.50.4");
const byQuery = new Map(report.results.map((entry) => [entry.query, entry]));
for (const name of ["common.button", "server_form.custom_multiselect", "hud.subtitle_container_content", "furnace.tab_offset_anim", "common_dialogs.main_panel_two_buttons", "common_buttons.light_text_button", "npc_interact.npc_screen", "$top_button_panel", "$close_button_to_button_id", "#hud_title_text_string", "#custom_multiselect_toggled", "$9_color_format", "button.menu_inventory_exit", "hotbar_renderer", "ui/hud_crosshair_overlay.json", "subtitle_container_content", "textures/ui/Black"]) {
  assert.equal(byQuery.get(name)?.found, true, `${name} must be found in the pinned samples`);
}
assert.equal(byQuery.get("subtitle_container_content").matches[0].kind, "control_any_namespace");
assert.equal(byQuery.get("hotbar_renderer").matches.some((match) => match.kind === "renderer"), true);
assert.deepEqual(report.missing, ["crafting.tab_offset_anim", "common.creative_layout_toggle", "ui/realmsPlus_screen.json", "hotbar_slots_renderer", "menu.quest", "#not_a_vanilla_binding"]);

// Index built from the pinned folder alone exposes the lock-pinned structure.
const index = await buildNameIndex([{ label: "pinned", root: resolve(ROOT, "references", "official", "bedrock-samples-ui") }]);
assert.equal(index.files.length, SELECTED_FILES.length);
assert.ok(index.files.every((file) => !file.error), JSON.stringify(index.files.filter((file) => file.error)));
assert.equal(lookupName(index, "`#form_button_text`").found, true, "backticks and quotes are stripped");
assert.equal(lookupName(index, "_ui_defs.json").matches.some((match) => match.kind === "file"), true);
// Factory names come from both vanilla shapes: "factory": {"name": ...} and a nested control of type "factory".
assert.equal(lookupName(index, "hud_title_text_factory").matches.some((match) => match.kind === "factory"), true);
assert.equal(lookupName(index, "server_form_factory").matches.some((match) => match.kind === "factory"), true);
// Collection names come from collection keys and from $...collection_name variables.
for (const name of ["form_buttons", "custom_form", "armor_items", "offhand_items", "skins_collection"]) {
  assert.equal(lookupName(index, name).matches.some((match) => match.kind === "collection"), true, `${name} must be indexed as a vanilla collection`);
}
assert.equal(lookupName(index, "crafting_items").found, false, "community-only collection names must stay unresolved");

// Documented Molang queries at the pinned version come from data/molang-queries-1.26.50.json.
const molang = JSON.parse(await readFile(resolve(ROOT, "data", "molang-queries-1.26.50.json"), "utf8"));
assert.equal(molang.documentedCount, molang.queries.length);
assert.equal(molang.source.version, "1.26.50.4");
assert.ok(molang.queries.every((query) => /^query\.[a-z0-9_]+$/.test(query.name)));
assert.deepEqual(molang.usedInVanillaButNotDocumented, [], "every query the pinned vanilla pack uses must be documented at the same version");
const molangIndex = await buildNameIndex([], { molang });
for (const name of ["query.is_in_ui", "q.item_slot_to_bone_name", "query.is_first_person", "query.get_root_locator_offset"]) {
  assert.equal(lookupName(molangIndex, name).matches.some((match) => match.kind === "molang_query"), true, `${name} must resolve as a documented Molang query`);
}
assert.equal(lookupName(molangIndex, "query.not_a_real_query").found, false);

// Pack identifiers resolve only through a resource_pack mirror; the committed sample set is UI-only.
const packIndex = await buildNameIndex([{ label: "fixture", root: resolve(ROOT, "tests", "fixtures", "vanilla-pack-mini"), kind: "pack" }]);
assert.equal(packIndex.files.filter((file) => file.error).length, 0, JSON.stringify(packIndex.files.filter((file) => file.error)));
assert.equal(lookupName(packIndex, "minecraft:test_hat.player").matches[0]?.kind, "attachable");
assert.equal(lookupName(packIndex, "minecraft:test_mob").matches[0]?.kind, "entity");
assert.equal(lookupName(packIndex, "geometry.test_hat").matches[0]?.kind, "geometry");
assert.equal(lookupName(packIndex, "geometry.legacy.base").matches[0]?.kind, "geometry", "legacy geometry.x:geometry.parent keys index the child id");
assert.equal(lookupName(packIndex, "animation.test_hat.wield").matches[0]?.kind, "animation");
assert.equal(lookupName(packIndex, "controller.animation.test_hat.wield").matches[0]?.kind, "animation_controller");
assert.equal(lookupName(packIndex, "controller.render.test_hat").matches[0]?.kind, "render_controller");
assert.equal(lookupName(packIndex, "armor_enchanted").matches[0]?.kind, "material_name");
assert.equal(lookupName(packIndex, "geometry.missing").found, false);
assert.deepEqual([...collectNames("", { namespace: "demo", panel: { factory: { name: "demo_factory", control_ids: {} } }, list: { type: "factory", control_name: "demo.item" }, grid: { collection_name: "$dynamic", "$item_collection_name|default": "demo_items" } }, "demo.json").factories], ["demo_factory", "list"]);
assert.deepEqual([...collectNames("", { namespace: "demo", grid: { "$item_collection_name|default": "demo_items", collection_name: "$dynamic" } }, "demo.json").collections], ["demo_items"]);

// CLI contract.
const ok = await run(["tools/vanilla-name-check.mjs", "common.button", "#form_button_text", "--no-mirror", "--json"]);
assert.equal(ok.code, 0, ok.stderr || ok.stdout);
assert.equal(JSON.parse(ok.stdout.trim()).ok, true);
const missing = await run(["tools/vanilla-name-check.mjs", "common.button", "crafting.tab_offset_anim", "--no-mirror", "--json"]);
assert.equal(missing.code, 3);
const missingResult = JSON.parse(missing.stdout.trim());
assert.equal(missingResult.ok, false);
assert.deepEqual(missingResult.blocking.map((item) => item.path), ["crafting.tab_offset_anim"]);
const help = await run(["tools/vanilla-name-check.mjs", "--help"]);
assert.equal(help.code, 0);
assert.match(help.stdout, /Usage:/);
const usage = await run(["tools/vanilla-name-check.mjs"]);
assert.equal(usage.code, 64);
console.log("vanilla name check OK");
