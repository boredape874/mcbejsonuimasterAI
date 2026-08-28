import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { PATHS } from "./paths.mjs";

export function solveWithGo(ird) {
  mkdirSync(PATHS.goCache, { recursive: true });
  const res = spawnSync("go", ["run", "./tools/go/solver"], {
    cwd: PATHS.root,
    env: { ...process.env, GOCACHE: PATHS.goCache },
    input: JSON.stringify(ird),
    encoding: "utf8",
    timeout: 30000,
    windowsHide: true,
  });
  if (res.error) {
    throw new Error(res.error.message);
  }
  if (res.status !== 0) {
    throw new Error((res.stderr || res.stdout || `go solver exited ${res.status}`).trim());
  }
  try {
    return JSON.parse(res.stdout);
  } catch (e) {
    throw new Error(`go solver returned invalid JSON: ${String(e && e.message || e)}`);
  }
}
