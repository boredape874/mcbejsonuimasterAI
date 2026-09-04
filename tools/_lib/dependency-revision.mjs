import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function fileSha256(path) {
  try {
    return sha256Bytes(await readFile(path));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export function packageLockSha256(root) {
  return fileSha256(resolve(root, "package-lock.json"));
}
