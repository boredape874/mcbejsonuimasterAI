#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadResearchLock, verifyUpstreamCheckout } from "./_lib/upstream-policy.mjs";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const option = (name) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };
const configPath = resolve(option("--config") ?? join(repoRoot, "config", "research-lock.json"));
const dryRun = process.argv.includes("--dry-run"), refresh = process.argv.includes("--refresh"), selected = option("--id");
const lock = await loadResearchLock(configPath);
const destination = resolve(repoRoot, lock.destination);
const sources = selected ? lock.sources.filter((source) => source.id === selected) : lock.sources;
if (selected && sources.length === 0) throw new Error(`Unknown research source: ${selected}`);
function git(args, cwd) { if (dryRun) return { stdout: "", status: 0 }; const result = spawnSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); if (result.status !== 0) throw new Error(`git ${args[0]} failed in ${cwd}: ${result.stderr.trim()}`); return result; }
if (!dryRun) await mkdir(destination, { recursive: true });
const results = [];
for (const source of sources) {
  if (source.sync !== true) {
    results.push({ id: source.id, status: "skipped-by-policy", policy: source.policy });
    continue;
  }
  const target = join(destination, source.id);
  if (!existsSync(target)) { console.log(`[clone] ${source.id} -> ${target}`); git(["clone", "--filter=blob:none", "--no-checkout", source.url, target], repoRoot); }
  else if (!existsSync(join(target, ".git"))) throw new Error(`Refusing to overwrite non-git directory: ${target}`);
  if (refresh) { console.log(`[fetch] ${source.id} ${source.commit}`); git(["fetch", "--depth=1", "origin", source.commit], target); }
  console.log(`[checkout] ${source.id}@${source.commit}`); git(["checkout", "--detach", "--force", source.commit], target);
  const verification = dryRun
    ? { id: source.id, commit: source.commit, verifiedFiles: [source.license.path, ...source.allowlist.map((entry) => entry.path)] }
    : await verifyUpstreamCheckout(source, target);
  results.push({ ...verification, directory: target, status: dryRun ? "planned" : "verified", policy: source.policy });
}
const report = { schemaVersion: 2, config: configPath, destination, dryRun, results };
if (!dryRun) await writeFile(join(destination, "sync-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
