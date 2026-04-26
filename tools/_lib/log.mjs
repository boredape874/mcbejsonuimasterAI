// tools/_lib/log.mjs
// Minimal structured logger with both human-readable and JSON output.

const isJsonMode = process.env.MCBEKIT_LOG === "json";

function emit(level, msg, extra) {
  if (isJsonMode) {
    process.stdout.write(
      JSON.stringify({ ts: new Date().toISOString(), level, msg, ...extra }) +
        "\n",
    );
  } else {
    const tag =
      level === "error" ? "ERR " :
      level === "warn"  ? "WARN" :
      level === "ok"    ? "OK  " : "INFO";
    const tail = extra && Object.keys(extra).length
      ? "  " + JSON.stringify(extra)
      : "";
    process.stdout.write(`[${tag}] ${msg}${tail}\n`);
  }
}

export const log = {
  info: (m, x = {}) => emit("info", m, x),
  ok:   (m, x = {}) => emit("ok", m, x),
  warn: (m, x = {}) => emit("warn", m, x),
  error:(m, x = {}) => emit("error", m, x),
};
