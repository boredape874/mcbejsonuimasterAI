export const RESULT_SCHEMA = "mcbe-jsonui-ai-kit/result@1";

export function createResultEnvelope({
  ok,
  status,
  evidenceLevel = "static",
  blocking = [],
  exitCodeReason = ok ? "SUCCESS" : "BLOCKING_FAILURE",
  optIn = null,
  artifacts = [],
  summary = {},
} = {}) {
  if (typeof ok !== "boolean") throw new TypeError("result envelope requires boolean ok");
  const normalizedBlocking = Array.isArray(blocking) ? blocking : [blocking];
  return {
    schema: RESULT_SCHEMA,
    ok,
    status: status || (ok ? "passed" : "failed"),
    evidenceLevel,
    blocking: normalizedBlocking,
    exitCodeReason,
    optIn,
    artifacts,
    summary,
  };
}

export function resultExitCode(result, { failureCode = 9 } = {}) {
  if (result.ok) return 0;
  if (result.status === "incomplete" && result.optIn?.diagnosticOk === true) return 0;
  if (result.status === "degraded" && result.blocking.length === 0) return 0;
  return failureCode;
}

export function printResultJson(result) {
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
