import { resolve } from "node:path";
import { traceUiRoute } from "./_lib/ui-route-graph.mjs";

const args = process.argv.slice(2), pack = args[0], reference = args[1];
if (!pack || !reference || args.slice(2).some((arg) => arg.startsWith("--") && arg !== "--json")) {
  console.error("usage: node tools/trace-ui-route.mjs <rp-root> <namespace.control> [--json]"); process.exit(64);
}
try {
  const report = await traceUiRoute(resolve(pack), reference);
  console.log(args.includes("--json") ? JSON.stringify(report) : `${report.ok ? "OK" : "FAIL"} ${report.reference}: ${report.route.map((item) => item.qualified).join(" -> ") || "unresolved"}`);
  if (!report.ok) process.exitCode = 9;
} catch (error) { console.error(String(error?.stack || error)); process.exitCode = 1; }
