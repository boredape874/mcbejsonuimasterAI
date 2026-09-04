// tools/_lib/fsx.mjs
// Tiny fs helpers (read/write JSON, ensure dir).

import { mkdir, readFile, writeFile, stat, rename, rm } from "node:fs/promises";
import { dirname, basename, resolve } from "node:path";
import { randomUUID } from "node:crypto";

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

export async function readText(path) {
  return readFile(path, "utf8");
}

export async function writeJson(path, obj) {
  await ensureDir(dirname(path));
  await writeFile(path, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

export async function writeJsonAtomic(path, obj) {
  const target = resolve(path);
  await ensureDir(dirname(target));
  const temp = resolve(dirname(target), `.${basename(target)}.${process.pid}.${randomUUID()}.tmp`);
  try {
    await writeFile(temp, JSON.stringify(obj, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
    await rename(temp, target);
  } catch (error) {
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}

export async function writeText(path, text) {
  await ensureDir(dirname(path));
  await writeFile(path, text, "utf8");
}
