import {
  loadProfiles,
  loadRegistry,
  parseCli,
  printIssues,
  printJson,
  profileMap,
  registryMap,
  toolAvailability,
  validateProfiles,
  writeReport,
} from "./_lib/ai-contracts.mjs";

const USAGE = `Usage: node tools/skill-context.mjs <skill> [options]

Expand one skill into its ordered minimal tool context.

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
  const skill = parsed.positionals[0];
  if (!skill) {
    process.stderr.write(USAGE);
    process.exit(64);
  }

  const { registry, validation } = await loadRegistry();
  const profiles = await loadProfiles();
  const profileValidation = validation.ok ? await validateProfiles(profiles, registry) : { ok: false, errors: [], warnings: [] };
  const errors = [...validation.errors, ...profileValidation.errors];
  if (errors.length) {
    if (parsed.options.json) printJson({ ok: false, errors });
    else printIssues(errors, "ERROR ");
    process.exit(5);
  }
  const profile = profileMap(profiles).get(skill);
  if (!profile) {
    const result = { ok: false, error: `unknown skill profile ${skill}` };
    if (parsed.options.json) printJson(result);
    else process.stderr.write(`${result.error}\n`);
    process.exit(4);
  }

  const byId = registryMap(registry);
  const selectionById = new Map(profile.toolSelections.map((selection) => [selection.id, selection]));
  const tools = [];
  for (const id of profile.workflow) {
    const contract = byId.get(id);
    tools.push({ selection: selectionById.get(id), contract, availability: await toolAvailability(contract) });
  }
  const result = {
    schema: "mcbe-jsonui-ai-kit/skill-context@1",
    ok: true,
    skill: profile.skill,
    skillStatus: profile.skillStatus,
    purpose: profile.purpose,
    workflow: profile.workflow,
    tools,
    successCriteria: profile.successCriteria,
    boundaries: profile.boundaries,
    warnings: profileValidation.warnings,
  };
  await writeReport(parsed.options.report, result);
  if (parsed.options.json) printJson(result);
  else {
    process.stdout.write(`${profile.skill} [${profile.skillStatus}]\n${profile.purpose}\n\nWorkflow:\n`);
    for (const [index, entry] of tools.entries()) {
      const state = entry.availability.available ? "available" : entry.contract.status;
      process.stdout.write(`${index + 1}. ${entry.contract.id} [${state}]${entry.selection.required ? " required" : " optional"}\n   ${entry.selection.reason}\n`);
    }
    process.stdout.write("\nSuccess criteria:\n");
    for (const item of profile.successCriteria) process.stdout.write(`- ${item}\n`);
    process.stdout.write("\nBoundaries:\n");
    for (const item of profile.boundaries) process.stdout.write(`- ${item}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`skill-context crashed: ${error.message || error}\n`);
  process.exit(1);
});
