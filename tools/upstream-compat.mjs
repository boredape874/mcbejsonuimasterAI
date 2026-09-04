#!/usr/bin/env node
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadResearchLock } from "./_lib/upstream-policy.mjs";
import { compatibilityReport, loadFixtureCatalog } from "./_lib/upstream-fixtures.mjs";
import { loadBlackBoxCaptures } from "./_lib/upstream-blackbox.mjs";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const option = (name) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : null; };
const lockPath = resolve(option("--lock") ?? join(repoRoot, "config", "research-lock.json"));
const lock = await loadResearchLock(lockPath);
const fixturesPath = resolve(option("--fixtures") ?? join(repoRoot, lock.policy.offlineFixture));
const catalog = await loadFixtureCatalog(fixturesPath, lock);
const capturesPath = option("--captures");
const captures = capturesPath ? await loadBlackBoxCaptures(resolve(capturesPath), catalog) : new Map();
const report = compatibilityReport(catalog, captures);
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes("--strict") && !report.ready) process.exitCode = 9;
