// tools/_lib/fsx.mjs
// Tiny fs helpers (read/write JSON, ensure dir).

import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { dirname } from "node:path";

export async function exists(path) {
  try { await stat(path); return true; } catch { return false; }
}

export async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

export async function readJson(path) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

export async function writeJson(path, obj) {
  await ensureDir(dirname(path));
  await writeFile(path, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

export async function writeText(path, text) {
  await ensureDir(dirname(path));
  await writeFile(path, text, "utf8");
}
