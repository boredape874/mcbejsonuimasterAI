import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import { packageLockSha256, sha256Bytes } from "./_lib/dependency-revision.mjs";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const scenarios = {
  "skill-context": ["tools/skill-context.mjs", "mcbe-json-ui-master", "--compact", "--json"],
  "doctor-quick": ["tools/doctor.mjs", "--quick"],
  "full-suite": ["tests/run-manifest.mjs"],
};

function parseArgs(argv) {
  const options = { scenario: "skill-context", mode: "process-cold", samples: null, warmups: null, report: null, timeoutMs: 180000 };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (["--scenario", "--mode", "--samples", "--warmups", "--report", "--timeout-ms"].includes(arg)) {
      const key = { "--scenario": "scenario", "--mode": "mode", "--samples": "samples", "--warmups": "warmups", "--report": "report", "--timeout-ms": "timeoutMs" }[arg];
      options[key] = argv[++index];
    } else if (arg === "--help") options.help = true;
    else throw new Error(`unknown option: ${arg}`);
  }
  for (const key of ["samples", "warmups", "timeoutMs"]) if (options[key] !== null) options[key] = Number(options[key]);
  if (!scenarios[options.scenario]) throw new Error(`unknown scenario: ${options.scenario}`);
  if (!["process-cold", "cache-cold", "warm-cli"].includes(options.mode)) throw new Error(`unknown mode: ${options.mode}`);
  options.samples ??= options.scenario === "full-suite" ? 5 : 20;
  options.warmups ??= options.scenario === "full-suite" ? 0 : 2;
  return options;
}

function run(argv, env, timeoutMs) {
  return new Promise((done) => {
    const started = performance.now();
    const child = spawn(process.execPath, argv, { cwd: root, env, windowsHide: true });
    let stdout = "", stderr = "", settled = false, timedOut = false;
    const finish = (value) => { if (!settled) { settled = true; clearTimeout(timer); done({ ...value, wallMs: Math.round((performance.now() - started) * 1000) / 1000, stdout, stderr, timedOut }); } };
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => finish({ exitCode: null, signal: null, spawnError: String(error.message || error) }));
    child.on("close", (exitCode, signal) => finish({ exitCode, signal, spawnError: null }));
  });
}

function percentile(sorted, fraction) {
  if (!sorted.length) return null;
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

async function revision() {
  const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8", windowsHide: true });
  const status = spawnSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: root, encoding: "utf8", windowsHide: true });
  const dirtyText = status.stdout || "";
  return { gitHead: head.stdout?.trim() || null, dirty: dirtyText.length > 0, dirtySha256: sha256Bytes(dirtyText), node: process.version, platform: process.platform, arch: process.arch, packageLockSha256: await packageLockSha256(root) };
}

function semanticOutput(parsed, stdout) {
  if (!parsed) return stdout;
  const clone = structuredClone(parsed);
  delete clone.runId;
  delete clone.resourceManifest;
  if (Array.isArray(clone.results)) for (const result of clone.results) {
    delete result.durationMs;
    delete result.stdoutBytes;
    delete result.stderrBytes;
  }
  return JSON.stringify(clone);
}

async function atomicReport(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}-${randomUUID()}`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write("Usage: node tools/benchmark-agent-path.mjs [--scenario skill-context|doctor-quick|full-suite] [--mode process-cold|cache-cold|warm-cli] [--samples N] [--warmups N] [--report path]\n");
    return;
  }
  const benchmarkRoot = await mkdtemp(join(tmpdir(), "mcbe-agent-benchmark-"));
  const cleanupErrors = [];
  const runs = [];
  const total = options.warmups + options.samples;
  try {
    for (let index = 0; index < total; index++) {
      const cacheRoot = options.mode === "warm-cli" ? resolve(benchmarkRoot, "warm-cache") : resolve(benchmarkRoot, `cache-${index}-${randomUUID()}`);
      await mkdir(cacheRoot, { recursive: true });
      const env = { ...process.env, MCBEKIT_BENCHMARK_MODE: options.mode, MCBEKIT_CACHE_ROOT: cacheRoot };
      if (options.mode === "process-cold") env.MCBEKIT_NO_CACHE = "1";
      const result = await run(scenarios[options.scenario], env, options.timeoutMs);
      let parsed = null;
      try { parsed = JSON.parse(result.stdout.trim()); } catch {}
      const parityFailure = (parsed?.ok === false && result.exitCode === 0) || (parsed?.ok === true && result.exitCode !== 0);
      if (index >= options.warmups) runs.push({
        iteration: index - options.warmups + 1,
        wallMs: result.wallMs,
        stdoutBytes: Buffer.byteLength(result.stdout, "utf8"),
        stderrBytes: Buffer.byteLength(result.stderr, "utf8"),
        exitCode: result.exitCode,
        signal: result.signal,
        timedOut: result.timedOut,
        spawnError: result.spawnError,
        parsedResult: parsed ? { ok: parsed.ok ?? null, schema: parsed.schema ?? null } : null,
        resultParity: !parityFailure,
        semanticHash: createHash("sha256").update(semanticOutput(parsed, result.stdout)).digest("hex"),
      });
    }
  } finally {
    try { await rm(benchmarkRoot, { recursive: true, force: false, maxRetries: 2, retryDelay: 50 }); }
    catch (error) { cleanupErrors.push(String(error?.stack || error)); }
  }
  const times = runs.map((run) => run.wallMs).sort((a, b) => a - b);
  const report = {
    schema: "mcbe-jsonui-ai-kit/agent-path-benchmark@1",
    scenario: options.scenario,
    mode: options.mode,
    modeDefinition: options.mode === "process-cold" ? "new process with cache disabled" : options.mode === "cache-cold" ? "new process with a fresh isolated cache root" : "new process sharing one pre-warmed isolated disk cache root",
    warmService: "unsupported",
    command: [process.execPath, ...scenarios[options.scenario]],
    commandHash: createHash("sha256").update(JSON.stringify(scenarios[options.scenario])).digest("hex"),
    revision: await revision(),
    warmups: options.warmups,
    samples: options.samples,
    runs,
    stats: { count: times.length, medianMs: percentile(times, 0.5), p90Ms: percentile(times, 0.9), p95Ms: times.length >= 20 ? percentile(times, 0.95) : null, maxMs: times.at(-1) ?? null },
    cleanupErrors,
    ok: cleanupErrors.length === 0 && runs.every((run) => run.exitCode === 0 && !run.signal && !run.timedOut && !run.spawnError && run.resultParity),
  };
  if (options.report) await atomicReport(resolve(root, options.report), report);
  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => { process.stderr.write(`${String(error?.stack || error)}\n`); process.exitCode = 1; });
