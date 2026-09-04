import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, relative, resolve } from "node:path";
import { PATHS } from "./_lib/paths.mjs";

async function files(root, base = root) {
  const result = [];
  let entries;
  try { entries = await readdir(root, { withFileTypes: true }); } catch { return result; }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) result.push(...await files(path, base));
    else if (entry.isFile()) result.push(relative(base, path).replaceAll("\\", "/"));
  }
  return result;
}

async function digest(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function skillNames(root) {
  try { return (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory() && entry.name.startsWith("mcbe-json-ui-")).map((entry) => entry.name).sort(); }
  catch { return []; }
}

const topology = JSON.parse(await readFile(resolve(PATHS.data, "skill-topology.json"), "utf8"));
const sourceRoot = resolve(PATHS.root, "skills");
let installedRoot = resolve(homedir(), ".codex", "skills");
const index = process.argv.indexOf("--installed");
if (index >= 0 && process.argv[index + 1]) installedRoot = resolve(process.argv[index + 1]);
if (process.argv.includes("--help")) {
  process.stdout.write("Usage: node tools/skill-sync-check.mjs [--installed <directory>]\n");
  process.exit(0);
}
const source = await skillNames(sourceRoot);
const installed = await skillNames(installedRoot);
const sourceOnly = source.filter((name) => !installed.includes(name));
const installedOnly = installed.filter((name) => !source.includes(name));
const drift = [];
for (const name of source.filter((value) => installed.includes(value))) {
  const sourceFiles = await files(resolve(sourceRoot, name));
  const installedFiles = await files(resolve(installedRoot, name));
  const all = [...new Set([...sourceFiles, ...installedFiles])].sort();
  const differentFiles = [];
  for (const file of all) {
    const a = resolve(sourceRoot, name, file);
    const b = resolve(installedRoot, name, file);
    let same = false;
    try { same = (await stat(a)).isFile() && (await stat(b)).isFile() && await digest(a) === await digest(b); } catch {}
    if (!same) differentFiles.push(file);
  }
  if (differentFiles.length) drift.push({ skill: name, differentFiles });
}
const expected = [...topology.sourceSkills].sort();
const sourceSetEqual = source.length === expected.length && source.every((name, i) => name === expected[i]);
const parity = sourceSetEqual && sourceOnly.length === 0 && installedOnly.length === 0 && drift.length === 0;
process.stdout.write(`${JSON.stringify({ schema: "mcbe-jsonui-ai-kit/skill-sync@1", ok: parity, readOnly: true, sourceRoot, installedRoot, sourceSetEqual, sourceOnly, installedOnly, drift, counts: { source: source.length, installed: installed.length, driftSkills: drift.length, driftFiles: drift.reduce((n, item) => n + item.differentFiles.length, 0) } })}\n`);
if (!parity) process.exit(9);
