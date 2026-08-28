import {
  loadRegistry,
  parseCli,
  printIssues,
  printJson,
  registryMap,
  toolAvailability,
  writeReport,
} from "./_lib/ai-contracts.mjs";

const USAGE = `Usage: node tools/tool-describe.mjs <tool-id> [options]

Show one complete AI tool contract. This command never executes the tool.

Options:
  --json            Emit one JSON document
  --report <path>   Write the JSON result inside the repository
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
  const id = parsed.positionals[0];
  if (!id) {
    process.stderr.write(USAGE);
    process.exit(64);
  }

  const { registry, validation } = await loadRegistry();
  if (!validation.ok) {
    if (parsed.options.json) printJson({ ok: false, errors: validation.errors });
    else printIssues(validation.errors, "ERROR ");
    process.exit(5);
  }
  const tool = registryMap(registry).get(id);
  if (!tool) {
    const result = { ok: false, error: `unknown tool id ${id}` };
    if (parsed.options.json) printJson(result);
    else process.stderr.write(`${result.error}\n`);
    process.exit(4);
  }
  const result = {
    schema: "mcbe-jsonui-ai-kit/tool-description@1",
    ok: true,
    tool,
    availability: await toolAvailability(tool),
  };
  await writeReport(parsed.options.report, result);
  if (parsed.options.json) printJson(result);
  else {
    process.stdout.write(`${tool.id} [${tool.status}; ${result.availability.available ? "available" : "unavailable"}]\n`);
    process.stdout.write(`${tool.purpose}\n\nCommand: ${tool.command.display}\n`);
    process.stdout.write(`Mutates: ${tool.mutates.mode} — ${tool.mutates.description}\n`);
    process.stdout.write("\nInputs:\n");
    for (const input of tool.inputs) process.stdout.write(`- ${input.name}${input.required ? " (required)" : ""}: ${input.description}\n`);
    process.stdout.write("\nOutputs:\n");
    for (const output of tool.outputs) process.stdout.write(`- ${output.name}${output.required ? " (required)" : ""}: ${output.description}\n`);
    process.stdout.write("\nFailures:\n");
    for (const failure of tool.failures) process.stdout.write(`- ${failure.exitCode}: ${failure.meaning} Recovery: ${failure.recovery}\n`);
    process.stdout.write("\nEvidence:\n");
    for (const evidence of tool.evidenceProduced) process.stdout.write(`- ${evidence}\n`);
    process.stdout.write("\nUnsupported:\n");
    for (const unsupported of tool.unsupportedBehavior) process.stdout.write(`- ${unsupported}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`tool-describe crashed: ${error.message || error}\n`);
  process.exit(1);
});
