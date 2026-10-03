import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { validatePack } from "../tools/_lib/pack-validator.mjs";

const root = await mkdtemp(resolve(tmpdir(), "jsonui-pack-dialect-"));
try {
  await mkdir(resolve(root, "ui"));
  await writeFile(resolve(root, "ui/_ui_defs.json"), '{"ui_defs":["ui/custom.json"]}');
  await writeFile(resolve(root, "ui/custom.json"), '{"namespace":"custom","root":{"type":"panel"}}');
  await writeFile(resolve(root, "ui/server_form.json"), '{"namespace":"server_form","screen":{"type":"panel"}}');
  await writeFile(resolve(root, "ui/npc_interact_screen.json"), '{"namespace":"npc_interact","npc_screen":{"$screen_content":"custom.root"}}');
  await writeFile(resolve(root, "ui/orphan.json"), '{"namespace":"orphan","root":{"type":"panel"}}');
  await writeFile(resolve(root, "ui/realmsPlus_screen.json"), '{"namespace":"realmsPlus","root":{"type":"panel"}}');
  let report = await validatePack(root, { allowMissingTextures: true });
  assert(report.warnings.some((item) => item.code === "VANILLA_OVERRIDE_REMOVED" && item.path === "ui/realmsPlus_screen.json" && /v1\.26\.10\.4/.test(item.message)));
  assert(!report.warnings.some((item) => item.code === "UI_DEFS_ORPHAN" && item.path === "ui/realmsPlus_screen.json"));
  assert(report.infos.some((item) => item.code === "VANILLA_OVERRIDE"));
  assert(report.infos.some((item) => item.code === "VANILLA_OVERRIDE" && item.path === "ui/npc_interact_screen.json"));
  assert(!report.warnings.some((item) => item.code === "UI_DEFS_ORPHAN" && item.path === "ui/npc_interact_screen.json"));
  assert(report.warnings.some((item) => item.code === "UI_DEFS_ORPHAN" && item.path === "ui/orphan.json"));
  report = await validatePack(root, { dialect: "bedrock-json@9.99", allowMissingTextures: true });
  assert(report.errors.some((item) => item.code === "DIALECT_UNVERIFIED"));

  const emit = (file, value) => writeFile(resolve(root, "ui", file), JSON.stringify(value));
  const cases = [
    { name: "registered typed", target: "custom.root", warning: false },
    { name: "unregistered typed", target: "orphan.root", warning: true },
    { name: "missing", target: "missing.root", warning: true },
    { name: "duplicate", target: "custom.root", duplicate: true, warning: true },
    { name: "untyped", target: "custom.root", control: {}, warning: true },
    { name: "variable type", target: "custom.root", control: { type: "$type" }, warning: true },
    { name: "native override typed", target: "server_form.screen", warning: false },
    { name: "unverified override profile", target: "server_form.screen", profile: "unknown", warning: true },
    { name: "same namespace typed", target: "npc_interact.helper", warning: false },
  ];
  for (const test of cases) {
    await emit("_ui_defs.json", { ui_defs: ["ui/custom.json", ...(test.duplicate ? ["ui/duplicate.json"] : [])] });
    await emit("custom.json", { namespace: "custom", root: test.control ?? { type: "panel" } });
    await emit("duplicate.json", { namespace: "custom", "root@custom.base": { type: "panel" } });
    await emit("npc_interact_screen.json", { namespace: "npc_interact", helper: { type: "panel" }, npc_screen: {
      type: "screen", modifications: [{ array_name: "controls", operation: "insert_back", value: [{ [`child@${test.target}`]: {} }] }],
    } });
    report = await validatePack(root, { allowMissingTextures: true, ...(test.profile ? { vanillaProfile: test.profile } : {}) });
    const warnings = report.warnings.filter((item) => item.code === "MODIFICATION_TYPE_UNVERIFIED");
    assert.equal(warnings.length, test.warning ? 1 : 0, test.name);
  }
} finally { await rm(root, { recursive: true, force: true }); }
console.log("dialect pack registration OK");
