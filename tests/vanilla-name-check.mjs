// tools/vanilla-name-check.mjs must find names that the pinned official sample
// files contain, reject names that no longer exist in them, and never report a
// third-party pack name as vanilla. Runs offline against the 12 committed files.
import assert from "node:assert/strict";
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
