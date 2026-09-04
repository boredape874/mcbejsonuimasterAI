import {
  buildPrompt,
  loadRegistry,
  loadStructured,
  parseCli,
  printIssues,
  printJson,
  resolveInsideRepo,
  validateEnvelope,
  writeReport,
} from "./_lib/ai-contracts.mjs";
import { writeText } from "./_lib/fsx.mjs";

const USAGE = `Usage: node tools/prompt-build.mjs <task-envelope.yaml|json> [options]

Build the canonical Markdown task prompt from a validated envelope.

Options:
  --output <path>   Write the generated Markdown inside the repository
  --json            Emit a JSON result containing the prompt
  --report <path>   Write validation/build evidence as JSON
  --help            Show this help
`;

async function main() {
  const parsed = parseCli(process.argv.slice(2), { valueOptions: ["--output"] });
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
    const result = { schema: "mcbe-jsonui-ai-kit/prompt-build@1", ok: false, errors: registryValidation.errors, warnings: [] };
    await writeReport(parsed.options.report, result);
    if (parsed.options.json) printJson(result);
    else printIssues(result.errors, "ERROR ");
    process.exit(5);
  }

  const loaded = await loadStructured(input);
  const validation = await validateEnvelope(loaded.value, registry);
  const report = {
    schema: "mcbe-jsonui-ai-kit/prompt-build@1",
    ok: validation.ok,
    input: input.replace(/\\/g, "/"),
    envelopeId: loaded.value?.id || null,
    output: parsed.options.output ? parsed.options.output.replace(/\\/g, "/") : null,
    errors: validation.errors,
    warnings: validation.warnings,
    toolStatuses: validation.toolStatuses,
  };
  if (!validation.ok) {
    await writeReport(parsed.options.report, report);
    if (parsed.options.json) printJson(report);
    else printIssues(report.errors, "ERROR ");
    process.exit(5);
  }

  const prompt = buildPrompt(loaded.value, validation.toolStatuses);
  if (parsed.options.output) await writeText(resolveInsideRepo(parsed.options.output), prompt);
  await writeReport(parsed.options.report, report);
  if (parsed.options.json) printJson({ ...report, prompt });
  else process.stdout.write(prompt);
}

main().catch((error) => {
  process.stderr.write(`prompt-build crashed: ${error.message || error}\n`);
  process.exit(1);
});
