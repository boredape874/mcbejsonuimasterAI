// Public entry point for PC/touch JSON UI previews.
import { runPreviewCli } from "./_lib/preview-cli.mjs";

runPreviewCli(process.argv.slice(2), { command: "preview" }).catch((error) => {
  console.error(JSON.stringify({ ok: false, error: String(error && error.message || error) }));
  process.exit(1);
});
