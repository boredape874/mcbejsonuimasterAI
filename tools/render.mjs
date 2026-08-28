// Backward-compatible entry point for the internal preview engine.
import { runPreviewCli } from "./_lib/preview-cli.mjs";

runPreviewCli(process.argv.slice(2), { command: "render" }).catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error && error.message || error) }));
  process.exit(1);
});
