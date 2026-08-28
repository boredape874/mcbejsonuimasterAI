import {
  loadProfiles,
  loadRegistry,
  parseCli,
  printIssues,
  printJson,
  profileMap,
  toolAvailability,
  writeReport,
} from "./_lib/ai-contracts.mjs";

const USAGE = `Usage: node tools/tool-list.mjs [options]

List versioned AI tool contracts without executing them.

Options:
  --skill <skill>                   Limit results to one skill profile
  --status <implemented|planned>    Limit results by registry status
  --json                            Emit one JSON document
  --report <path>                   Write the JSON result inside the repository
  --help                            Show this help
`;

async function main() {
  const parsed = parseCli(process.argv.slice(2), { valueOptions: ["--skill", "--status"] });
  if (!parsed.ok || parsed.positionals.length) {
    process.stderr.write(`${parsed.error || "unexpected positional argument"}\n${USAGE}`);
    process.exit(64);
  }
  const { options } = parsed;
  if (options.help) {
    process.stdout.write(USAGE);
    return;
  }
  if (options.status && !["implemented", "planned"].includes(options.status)) {
    process.stderr.write(`invalid --status ${options.status}\n${USAGE}`);
    process.exit(64);
  }

  const { registry, validation } = await loadRegistry();
  if (!validation.ok) {
    if (options.json) printJson({ ok: false, errors: validation.errors });
    else printIssues(validation.errors, "ERROR ");
    process.exit(5);
  }

  let tools = registry.tools;
  let profile = null;
  if (options.skill) {
    const profiles = await loadProfiles();
    profile = profileMap(profiles).get(options.skill);
    if (!profile) {
      const result = { ok: false, error: `unknown skill profile ${options.skill}` };
      if (options.json) printJson(result);
      else process.stderr.write(`${result.error}\n`);
      process.exit(4);
    }
    const byId = new Map(tools.map((tool) => [tool.id, tool]));
    tools = profile.workflow.map((id) => byId.get(id)).filter(Boolean);
  }
  if (options.status) tools = tools.filter((tool) => tool.status === options.status);

  const summaries = [];
  for (const tool of tools) {
    summaries.push({
      id: tool.id,
      status: tool.status,
      purpose: tool.purpose,
      command: tool.command.display,
      supports: tool.supports,
      ...(await toolAvailability(tool)),
    });
  }
  const result = {
    schema: "mcbe-jsonui-ai-kit/tool-list@1",
    ok: true,
    skill: profile?.skill || null,
    filters: { status: options.status || null },
    count: summaries.length,
    tools: summaries,
  };
  await writeReport(options.report, result);
  if (options.json) printJson(result);
  else {
    if (profile) process.stdout.write(`Skill: ${profile.skill}\n`);
    for (const tool of summaries) {
      process.stdout.write(`${tool.id}\t${tool.available ? "available" : tool.status}\t${tool.command}\n  ${tool.purpose}\n`);
    }
    process.stdout.write(`Total: ${summaries.length}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`tool-list crashed: ${error.message || error}\n`);
  process.exit(1);
});
