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
  --compact         Emit the additive compact-v1 contract
  --full            Explicit alias for the legacy full contract
  --tool <id>       Expand one selected tool's full contract
  --needs <csv>     Select optional stages whose when conditions match
  --report <path>   Write the JSON result inside the repository
  --help            Show this help
`;

async function main() {
  const parsed = parseCli(process.argv.slice(2), { flags: ["--compact", "--full"], valueOptions: ["--tool", "--needs"] });
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
  if (parsed.options.compact && parsed.options.full) {
    process.stderr.write("choose --compact or --full\n");
    process.exit(64);
  }
  const needs = new Set((parsed.options.needs || "").split(",").map((value) => value.trim()).filter(Boolean));
  const activeWorkflow = profile.workflow.filter((id) => {
    const selection = selectionById.get(id);
    if (!parsed.options.needs) return true;
    if (!selection?.when?.length) return true;
    return selection.when.some((condition) => needs.has(condition));
  });
  if (parsed.options.tool && !selectionById.has(parsed.options.tool)) {
    const result = { ok: false, error: `tool ${parsed.options.tool} is not selected by ${profile.skill}` };
    if (parsed.options.json) printJson(result); else process.stderr.write(`${result.error}\n`);
    process.exit(4);
  }
  const tools = [];
  for (const id of activeWorkflow) {
    const contract = byId.get(id);
    tools.push({ selection: selectionById.get(id), contract, availability: await toolAvailability(contract) });
  }
  if (parsed.options.tool) {
    const contract = byId.get(parsed.options.tool);
    const result = { schema: "mcbe-jsonui-ai-kit/skill-context-tool@1", ok: true, skill: profile.skill, tool: { selection: selectionById.get(parsed.options.tool), contract, availability: await toolAvailability(contract) } };
    await writeReport(parsed.options.report, result);
    if (parsed.options.json) printJson(result); else process.stdout.write(`${contract.id}\n${contract.purpose}\n`);
    return;
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
  if (parsed.options.compact) {
    const compact = {
      schema: "mcbe-jsonui-ai-kit/skill-context-compact@1",
      ok: true,
      skill: result.skill,
      skillStatus: result.skillStatus,
      workflow: tools.map((entry) => entry.selection.id),
      tools: tools.map((entry) => ({
        id: entry.selection.id,
        phase: entry.selection.phase,
        required: entry.selection.required,
        reason: entry.selection.reason,
        availability: entry.availability,
        blocking: entry.selection.required && !entry.availability.available,
        command: entry.contract.command.display,
        failureCodes: entry.contract.failures.map((failure) => failure.exitCode),
      })),
      successCriteria: result.successCriteria,
      boundaries: result.boundaries,
      warnings: result.warnings,
    };
    await writeReport(parsed.options.report, compact);
    if (parsed.options.json) printJson(compact); else process.stdout.write(`${compact.skill}: ${compact.tools.length} active tools\n`);
    return;
  }
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
