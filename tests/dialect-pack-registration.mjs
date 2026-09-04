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
  await writeFile(resolve(root, "ui/orphan.json"), '{"namespace":"orphan","root":{"type":"panel"}}');
  let report = await validatePack(root, { allowMissingTextures: true });
  assert(report.infos.some((item) => item.code === "VANILLA_OVERRIDE"));
  assert(report.warnings.some((item) => item.code === "UI_DEFS_ORPHAN" && item.path === "ui/orphan.json"));
  report = await validatePack(root, { dialect: "bedrock-json@9.99", allowMissingTextures: true });
  assert(report.errors.some((item) => item.code === "DIALECT_UNVERIFIED"));
} finally { await rm(root, { recursive: true, force: true }); }
console.log("dialect pack registration OK");
