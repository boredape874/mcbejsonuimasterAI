import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { PNG } from "pngjs";
import { designRecipesFromInventory, discoverSources, inventorySource } from "../tools/_lib/corpus-inventory.mjs";
import { validateWithSchema } from "../tools/_lib/source-corpus.mjs";

const temp = await mkdtemp(resolve(tmpdir(), "mcbe-corpus-inventory-"));
const exec = promisify(execFile);
try {
  await mkdir(resolve(temp, "mcbejsonuimasterAI", "ui"), { recursive: true });
  await mkdir(resolve(temp, "archives", "skip"), { recursive: true });
  await mkdir(resolve(temp, "Pack A", "ui"), { recursive: true });
  await mkdir(resolve(temp, "Pack A", "node_modules", "bad"), { recursive: true });
  await writeFile(resolve(temp, "Pack A", "ui", "hud_screen.json"), JSON.stringify({ namespace: "fixture", root: { type: "panel", size: [100, 50], controls: [{ button: { type: "button", default_control: "d", hover_control: "h", texture: "textures/ui/a" } }] } }));
  await writeFile(resolve(temp, "Pack A", "node_modules", "bad", "x.json"), "{}");
  const png = new PNG({ width: 2, height: 3 }); await writeFile(resolve(temp, "Pack A", "ui", "a.png"), PNG.sync.write(png));
  const sources = await discoverSources(temp); assert.equal(sources.length, 1); assert.equal(sources[0].id, "local-source-001");
  const first = await inventorySource(sources[0], null, { concurrency: 2 });
  assert.equal(first.stats.uiFiles, 1); assert.equal(first.stats.controls, 2); assert.equal(first.stats.textures, 1); assert.equal(first.files.some((item) => item.path.includes("node_modules")), false);
  assert.equal(JSON.stringify(first).includes("Pack A"), false);
  assert.equal(first.recipeCandidates.length, 1); assert.deepEqual(first.unresolved, []);
  const recipes = designRecipesFromInventory([first]); assert.equal(recipes.length, 1);
  assert.equal(recipes[0].evidence[0].sourceId, "local-source-001"); assert.equal(recipes[0].rootSize[0], 100); assert.ok(recipes[0].controls.length >= 2); assert.ok(recipes[0].states.includes("hover"));
  const catalog = { schemaVersion: 1, generatedAt: null, contentHash: "a".repeat(64), recipes };
  assert.equal((await validateWithSchema(catalog, resolve(process.cwd(), "schemas/design-recipe.schema.json"))).ok, true);
  const catalogPath = resolve(temp, "design-recipes.local.json"); await writeFile(catalogPath, JSON.stringify(catalog));
  const searched = await exec(process.execPath, ["tools/design-search.mjs", "fixture", "--catalog", catalogPath, "--json"], { cwd: process.cwd() });
  assert.equal(JSON.parse(searched.stdout).count, 1);
  const second = await inventorySource(sources[0], first, { concurrency: 2 }); assert.equal(second.files[0].sha256, first.files[0].sha256);
  console.log("PASS corpus-inventory: neutral discovery, recursive exclusions, UI geometry, texture metadata, incremental reuse");
} finally { await rm(temp, { recursive: true, force: true }); }
