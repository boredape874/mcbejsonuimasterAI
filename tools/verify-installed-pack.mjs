import { resolve } from "node:path";
import { verifyInstalledPack } from "./_lib/pack-fingerprint.mjs";

const args = process.argv.slice(2), json = args.includes("--json"), paths = args.filter((item) => item !== "--json");
if (paths.length < 2) { console.error("usage: node tools/verify-installed-pack.mjs <source-pack> <installed-pack> [more-installed-packs...] [--json]"); process.exit(64); }
try {
  const report = await verifyInstalledPack(resolve(paths[0]), paths.slice(1).map(resolve));
  console.log(json ? JSON.stringify(report) : `${report.ok ? "OK" : "FAIL"} installed pack verification; issues=${report.issues.length}`);
  if (!report.ok) process.exitCode = 9;
} catch (error) { console.error(`${error.code || "PACK_VERIFY_FAILED"}: ${error.message}`); process.exitCode = 1; }
