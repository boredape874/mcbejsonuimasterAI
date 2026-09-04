import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { writeJsonAtomic } from "./fsx.mjs";

export const REPORT_SCHEMA = "mcbe-jsonui-ai-kit/report-artifact@1";

export async function writeReportArtifact(path, report, { kind = "details" } = {}) {
  if (!path) return null;
  const target = resolve(path);
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  await writeJsonAtomic(target, report);
  return {
    kind: "report",
    path: target,
    sha256: createHash("sha256").update(serialized).digest("hex"),
  };
}
