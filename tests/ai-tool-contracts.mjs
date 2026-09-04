import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";

const here = fileURLToPath(new URL(".", import.meta.url));
const REPO = resolve(here, "..");
const NODE = process.execPath;
const OUT = resolve(process.env.MCBEKIT_REPO_TEST_ROOT || resolve(REPO, "workspace"), "ai-tool-contracts");
const failures = [];
let passed = 0;

function run(args) {
  return new Promise((done) => {
    const child = spawn(NODE, args, { cwd: REPO });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("close", (code) => done({ code, stdout, stderr }));
  });
}

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    process.stdout.write(`PASS ${name}${detail ? ` ${detail}` : ""}\n`);
  } else {
    failures.push({ name, detail });
    process.stdout.write(`FAIL ${name}${detail ? ` ${detail}` : ""}\n`);
  }
}

function json(text) {
  try { return JSON.parse(text); }
  catch { return null; }
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}

function semanticHash(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

async function main() {
  await rm(OUT, { recursive: true, force: true });

  for (const script of ["tool-list", "tool-describe", "skill-context", "skill-doctor", "prompt-build", "prompt-lint"]) {
    const result = await run([`tools/${script}.mjs`, "--help"]);
    check(`${script}:help`, result.code === 0 && /Usage:/.test(result.stdout), `code=${result.code}`);
  }

  const listed = await run(["tools/tool-list.mjs", "--status", "implemented", "--json"]);
  const listResult = json(listed.stdout);
  check("tool-list:json", listed.code === 0 && listResult?.ok === true && listResult.tools.every((tool) => tool.status === "implemented"));
  check("tool-list:availability", listResult?.tools.find((tool) => tool.id === "prompt.build")?.available === true);

  const described = await run(["tools/tool-describe.mjs", "preview.texture", "--json"]);
  const description = json(described.stdout);
  check("tool-describe:contract", described.code === 0 && description?.tool?.inputs?.length && description?.tool?.outputs?.length && description?.tool?.failures?.length && description?.tool?.evidenceProduced?.length);
  const unknown = await run(["tools/tool-describe.mjs", "missing.tool", "--json"]);
  check("tool-describe:unknown", unknown.code === 4);

  const context = await run(["tools/skill-context.mjs", "mcbe-json-ui-visual-design", "--json"]);
  const contextResult = json(context.stdout);
  check("skill-context:workflow", context.code === 0 && contextResult?.tools?.[0]?.selection?.id === "design.search");
  check("skill-context:legacy-semantic-hash", semanticHash(contextResult) === "50439350f115a5f6f787880ac5744964ae170e11d4d804819502759446005e51");

  const doctor = await run(["tools/skill-doctor.mjs", "mcbe-json-ui-visual-design", "--probe", "--json"]);
  const doctorResult = json(doctor.stdout);
  check("skill-doctor:profile", doctor.code === 0 && doctorResult?.ok === true && doctorResult.skills?.[0]?.present === true && doctorResult.probed === true, doctor.stderr.trim());

  const asset = await run(["tools/tool-describe.mjs", "asset.search", "--json"]);
  const assetResult = json(asset.stdout);
  check("asset-search:safe-contract", asset.code === 0
    && assetResult?.availability?.available === true
    && assetResult.tool.unsupportedBehavior.some((item) => item.includes("--absolute"))
    && assetResult.tool.unsupportedBehavior.some((item) => item.includes("redistribution")));

  const finalRp = await run(["tools/tool-describe.mjs", "final-rp.mcp", "--json"]);
  const finalRpResult = json(finalRp.stdout);
  check("final-rp:mcp-contract", finalRp.code === 0
    && finalRpResult?.availability?.available === true
    && finalRpResult.tool.preconditions.some((item) => item.includes("vanilla/font"))
    && finalRpResult.tool.unsupportedBehavior.some((item) => item.includes("CAPABILITY_UNAVAILABLE"))
    && finalRpResult.tool.unsupportedBehavior.some((item) => item.includes("pixel-accuracy")));

  const finalContext = await run(["tools/skill-context.mjs", "mcbe-json-ui-final-rp-inspection", "--json"]);
  const finalContextResult = json(finalContext.stdout);
  check("final-rp:skill-profile", finalContext.code === 0
    && finalContextResult?.tools?.some((item) => item.selection?.id === "final-rp.mcp")
    && finalContextResult?.tools?.some((item) => item.selection?.id === "upstream.compat" && item.selection.required === true)
    && finalContextResult?.boundaries?.some((item) => item.includes("External editor")));

  const upstream = await run(["tools/tool-describe.mjs", "upstream.compat", "--json"]);
  const upstreamResult = json(upstream.stdout);
  check("upstream:fixture-boundary", upstream.code === 0
    && upstreamResult?.availability?.available === true
    && upstreamResult.tool.preconditions.some((item) => item.includes("pending-local"))
    && upstreamResult.tool.unsupportedBehavior.some((item) => item.includes("not a pass")));

  const valid = "tests/fixtures/ai-tools/task-envelope.valid.yaml";
  const built = await run([
    "tools/prompt-build.mjs", valid,
    "--output", resolve(OUT, "prompt.md"),
    "--report", resolve(OUT, "build-report.json"),
    "--json",
  ]);
  const buildResult = json(built.stdout);
  check("prompt-build:valid", built.code === 0 && buildResult?.ok === true && /## Measured evidence/.test(buildResult?.prompt || ""), built.stderr.trim());
  const report = json(await readFile(resolve(OUT, "build-report.json"), "utf8"));
  check("prompt-build:report", report?.schema === "mcbe-jsonui-ai-kit/prompt-build@1" && report?.envelopeId === "compact_form_grid");

  const lintEnvelope = await run(["tools/prompt-lint.mjs", valid, "--json"]);
  check("prompt-lint:envelope", lintEnvelope.code === 0 && json(lintEnvelope.stdout)?.kind === "task-envelope");
  const lintPrompt = await run(["tools/prompt-lint.mjs", resolve(OUT, "prompt.md"), "--json"]);
  check("prompt-lint:markdown", lintPrompt.code === 0 && json(lintPrompt.stdout)?.kind === "markdown");

  const invalidEnvelope = await run(["tools/prompt-lint.mjs", "tests/fixtures/ai-tools/task-envelope.invalid.yaml", "--json"]);
  const invalidResult = json(invalidEnvelope.stdout);
  check("prompt-lint:invalid-envelope", invalidEnvelope.code === 5 && invalidResult?.errors?.length >= 3);
  const invalidPrompt = await run(["tools/prompt-lint.mjs", "tests/fixtures/ai-tools/prompt.invalid.md", "--json"]);
  check("prompt-lint:invalid-markdown", invalidPrompt.code === 5 && json(invalidPrompt.stdout)?.errors?.length >= 3);

  await rm(OUT, { recursive: true, force: true });
  process.stdout.write(`\nTotal: ${passed} passed, ${failures.length} failed\n`);
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exit(1);
});
