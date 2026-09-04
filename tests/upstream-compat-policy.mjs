import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { sha256, verifyUpstreamCheckout } from "../tools/_lib/upstream-policy.mjs";

const temp = await mkdtemp(resolve(tmpdir(), "mcbe-upstream-policy-"));
try {
  spawnSync("git", ["init", "-q"], { cwd: temp });
  spawnSync("git", ["config", "user.email", "fixture@example.invalid"], { cwd: temp });
  spawnSync("git", ["config", "user.name", "Fixture"], { cwd: temp });
  await mkdir(resolve(temp, "src"));
  await writeFile(resolve(temp, "LICENSE"), "MIT fixture\n");
  await writeFile(resolve(temp, "src", "allowed.js"), "export const fixture = true;\n");
  spawnSync("git", ["add", "LICENSE", "src/allowed.js"], { cwd: temp });
  spawnSync("git", ["commit", "-qm", "fixture"], { cwd: temp });
  const commit = spawnSync("git", ["rev-parse", "HEAD"], { cwd: temp, encoding: "utf8" }).stdout.trim();
  const source = { id: "fixture", commit, policy: "selected-port-with-notice", license: { path: "LICENSE", sha256: sha256("MIT fixture\n") }, allowlist: [{ path: "src/allowed.js", sha256: sha256("export const fixture = true;\n") }] };
  const result = await verifyUpstreamCheckout(source, temp);
  assert.deepEqual(result.verifiedFiles, ["LICENSE", "src/allowed.js"]);
  await writeFile(resolve(temp, "src", "allowed.js"), "tampered\n");
  await assert.rejects(() => verifyUpstreamCheckout(source, temp), /file hash mismatch/);
  await assert.rejects(() => verifyUpstreamCheckout({ ...source, policy: "fixture-only" }, temp), /does not permit/);
  console.log("PASS upstream-compat-policy: checkout commit, license, allowlist hashes, and fixture-only refusal");
} finally {
  await rm(temp, { recursive: true, force: true });
}
