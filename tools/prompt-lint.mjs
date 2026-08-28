import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import {
  lintMarkdownPrompt,
  loadRegistry,
  loadStructured,
  parseCli,
  printIssues,
  printJson,
  resolveInsideRepo,
  validateEnvelope,
  writeReport,
} from "./_lib/ai-contracts.mjs";

const USAGE = `Usage: node tools/prompt-lint.mjs <prompt.md|task-envelope.yaml|json> [options]

Lint canonical prompt sections or validate a structured task envelope.

Options:
  --json            Emit one JSON document
  --report <path>   Write the lint report inside the repository
  --help            Show this help
`;

async function main() {
  const parsed = parseCli(process.argv.slice(2));
  if (!parsed.ok || parsed.positionals.length > 1) {
    process.stderr.write(`${parsed.error || "too many positional arguments"}\n${USAGE}`);
    process.exit(64);
  }
  if (parsed.options.help) {
    process.stdout.write(USAGE);
    return;
  }
  const input = parsed.positionals[0];
  if (!input) {
    process.stderr.write(USAGE);
    process.exit(64);
  }

  const { registry, validation: registryValidation } = await loadRegistry();
  if (!registryValidation.ok) {
    const result = { schema: "mcbe-jsonui-ai-kit/prompt-lint@1", ok: false, kind: "registry", errors: registryValidation.errors, warnings: [] };
    await writeReport(parsed.options.report, result);
    if (parsed.options.json) printJson(result);
    else printIssues(result.errors, "ERROR ");
    process.exit(5);
  }

  const extension = extname(input).toLowerCase();
  let lint;
  if ([".yaml", ".yml", ".json"].includes(extension)) {
    const loaded = await loadStructured(input);
    const validation = await validateEnvelope(loaded.value, registry);
    lint = { ...validation, kind: "task-envelope" };
  } else if ([".md", ".txt"].includes(extension)) {
    const text = await readFile(resolveInsideRepo(input), "utf8");
    lint = lintMarkdownPrompt(text, registry);
  } else {
    process.stderr.write(`unsupported input extension ${extension || "<none>"}\n${USAGE}`);
    process.exit(64);
  }

  const report = {
    schema: "mcbe-jsonui-ai-kit/prompt-lint@1",
    input: input.replace(/\\/g, "/"),
    ...lint,
  };
  await writeReport(parsed.options.report, report);
  if (parsed.options.json) printJson(report);
  else {
    printIssues(report.warnings || [], "WARN ");
    printIssues(report.errors || [], "ERROR ");
    process.stdout.write(`${report.ok ? "PASS" : "FAIL"}: ${report.kind}, ${(report.errors || []).length} errors, ${(report.warnings || []).length} warnings\n`);
  }
  if (!report.ok) process.exit(5);
}

main().catch((error) => {
  process.stderr.write(`prompt-lint crashed: ${error.message || error}\n`);
  process.exit(1);
});
