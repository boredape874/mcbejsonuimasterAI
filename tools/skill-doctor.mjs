import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { exists } from "./_lib/fsx.mjs";
import { PATHS } from "./_lib/paths.mjs";
import {
  loadProfiles,
  loadRegistry,
  parseCli,
  printIssues,
  printJson,
  profileMap,
  toolAvailability,
  validateProfiles,
  writeReport,
} from "./_lib/ai-contracts.mjs";

const USAGE = `Usage: node tools/skill-doctor.mjs [<skill>|--all] [options]

Validate tool contracts, profile references, and implemented/planned boundaries.
Missing planned scripts are informational; missing implemented scripts are errors.

Options:
  --all             Check every skill profile
  --probe           Run --help for implemented tools that declare help support
  --json            Emit one JSON document
  --report <path>   Write the JSON result inside the repository
  --help            Show this help
`;

async function main() {
  const parsed = parseCli(process.argv.slice(2), { flags: ["--all", "--probe"] });
  if (!parsed.ok || parsed.positionals.length > 1 || (parsed.options.all && parsed.positionals.length)) {
    process.stderr.write(`${parsed.error || "choose one skill or --all"}\n${USAGE}`);
    process.exit(64);
  }
  if (parsed.options.help) {
    process.stdout.write(USAGE);
    return;
  }
  if (!parsed.options.all && !parsed.positionals.length) {
    process.stderr.write(USAGE);
    process.exit(64);
  }

  const { registry, validation } = await loadRegistry();
  const profiles = await loadProfiles();
  const profileValidation = validation.ok ? await validateProfiles(profiles, registry) : { ok: false, errors: [], warnings: [] };
  const errors = [...validation.errors, ...profileValidation.errors];
  const warnings = [...profileValidation.warnings];
  const requested = parsed.positionals[0];
  const bySkill = profileMap(profiles);
  if (requested && !bySkill.has(requested)) {
    const result = { ok: false, error: `unknown skill profile ${requested}` };
    if (parsed.options.json) printJson(result);
    else process.stderr.write(`${result.error}\n`);
    process.exit(4);
  }

  const profilesToCheck = requested ? [bySkill.get(requested)] : profiles.profiles;
  const selectedToolIds = new Set(profilesToCheck.flatMap((profile) => profile.toolSelections.map((selection) => selection.id)));
  const toolChecks = [];
  const promotionCandidates = [];
  const probeHelp = (script) => new Promise((done) => {
    const child = spawn(process.execPath, [script, "--help"], { cwd: PATHS.root });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (code) => done({ code, stdout, stderr }));
  });
  for (const tool of registry.tools.filter((entry) => parsed.options.all || selectedToolIds.has(entry.id))) {
    const availability = await toolAvailability(tool);
    const check = { id: tool.id, ...availability };
    if (tool.status === "implemented" && !availability.scriptExists) {
      errors.push({ path: `tool:${tool.id}`, message: `implemented script is missing: ${tool.command.script}` });
    }
    if (tool.status === "planned" && availability.scriptExists) {
      const finding = {
        path: `tool:${tool.id}`,
        message: `planned script now exists and is a promotion candidate: ${tool.command.script}; verify its contract and tests before changing status`,
      };
      warnings.push(finding);
      promotionCandidates.push(tool.id);
    }
    if (parsed.options.probe && availability.available && tool.supports.help) {
      const probe = await probeHelp(tool.command.script);
      check.helpProbe = { ok: probe.code === 0 && /usage:/i.test(probe.stdout + probe.stderr), code: probe.code };
      if (!check.helpProbe.ok) errors.push({ path: `tool:${tool.id}`, message: `declared --help support failed (exit ${probe.code})` });
    }
    toolChecks.push(check);
  }

  const skillChecks = [];
  for (const profile of profilesToCheck) {
    const path = resolve(PATHS.root, "skills", profile.skill, "SKILL.md");
    const present = await exists(path);
    skillChecks.push({ skill: profile.skill, status: profile.skillStatus, present });
    if (profile.skillStatus === "implemented" && !present) {
      errors.push({ path: `skill:${profile.skill}`, message: "implemented skill is missing SKILL.md" });
    }
    if (profile.skillStatus === "planned" && present) {
      warnings.push({ path: `skill:${profile.skill}`, message: "planned skill now exists; review and promote skillStatus" });
    }
    const requiredUnavailable = profile.toolSelections
      .filter((selection) => selection.required)
      .map((selection) => toolChecks.find((tool) => tool.id === selection.id))
      .filter((tool) => tool && !tool.available);
    if (profile.skillStatus === "implemented" && requiredUnavailable.length) {
      for (const tool of requiredUnavailable) {
        errors.push({ path: `skill:${profile.skill}`, message: `required tool ${tool.id} is unavailable: ${tool.reason}` });
      }
    }
  }

  const report = {
    schema: "mcbe-jsonui-ai-kit/skill-doctor@1",
    ok: errors.length === 0,
    scope: requested || "all",
    probed: Boolean(parsed.options.probe),
    errors,
    warnings,
    promotionCandidates,
    tools: toolChecks,
    skills: skillChecks,
  };
  await writeReport(parsed.options.report, report);
  if (parsed.options.json) printJson(report);
  else {
    for (const tool of toolChecks) process.stdout.write(`${tool.available ? "OK  " : tool.status === "planned" ? "PLAN" : "ERR "} tool ${tool.id}: ${tool.reason}\n`);
    for (const skill of skillChecks) process.stdout.write(`${skill.present ? "OK  " : skill.status === "planned" ? "PLAN" : "ERR "} skill ${skill.skill}: ${skill.status}\n`);
    printIssues(warnings, "WARN ");
    printIssues(errors, "ERROR ");
    process.stdout.write(`${report.ok ? "PASS" : "FAIL"}: ${toolChecks.length} tools, ${skillChecks.length} skills, ${errors.length} errors, ${warnings.length} warnings\n`);
  }
  if (!report.ok) process.exit(5);
}

main().catch((error) => {
  process.stderr.write(`skill-doctor crashed: ${error.message || error}\n`);
  process.exit(1);
});
