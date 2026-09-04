import { access, mkdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { stripJsonComments, stripJsonTrailingCommas } from "./_lib/jsonc.mjs";

const REPO = resolve(fileURLToPath(new URL("..", import.meta.url)));
const HELP = `Usage: node tools/public-audit.mjs [options]

Audit tracked and non-ignored untracked public-release candidates.

Options:
  --report <path>  Write the JSON report inside this repository
  --json           Print the JSON report
  --help           Show this help`;

const TEXT_EXTENSIONS = new Set([
  "", ".bat", ".c", ".cc", ".cfg", ".cjs", ".cmd", ".conf", ".cpp", ".cs", ".css", ".csv",
  ".env", ".go", ".h", ".hpp", ".html", ".ini", ".java", ".js", ".json", ".jsonc", ".jsx",
  ".key", ".lang", ".lock", ".md", ".mcfunction", ".mcmeta", ".mjs", ".pem", ".php", ".properties",
  ".ps1", ".py", ".rb", ".rs", ".scss", ".sh", ".sql", ".svelte", ".svg", ".toml", ".ts",
  ".tsx", ".txt", ".vue", ".xml", ".yaml", ".yml",
]);
const EXCLUDED_PREFIXES = [
  "node_modules/", "workspace/", ".agent/state/", ".agent/cache/",
  "references/private/", "references/restricted/", "references/upstreams/", "references/external/",
];
const PRIVATE_SOURCE_TOKENS = [
  ["P", "D", "-", "R", "P"].join(""),
  ["P", "D", "-", "B", "P"].join(""),
  ["R", "X", "O"].join(""),
];
const WINDOWS_LOCAL_PATH_RE = /[A-Za-z]:[\\/]+(?:Users|\uAC1C\uBC1C\uBE60\uB978)(?:[\\/]+|(?=[\s"'`)]|$))/gi;
const CORE_REFERENCE_RE = /\b(?:PMMP|PocketMine(?:-MP)?)\b|25-pmmp/gi;
const DISCORD_TOKEN_RE = /\bmfa\.[A-Za-z0-9_-]{40,}|\b[A-Za-z0-9_-]{20,30}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{25,}\b/g;
const PRIVATE_KEY_RE = /-----BEGIN(?: RSA| EC| OPENSSH)? PRIVATE KEY-----/g;
const SECRET_ASSIGNMENT_RE = /["']?\b(?:discord[_ -]?(?:user[_ -]?)?token|user[_ -]?token|api[_ -]?key|client[_ -]?secret|access[_ -]?token|refresh[_ -]?token|password|passwd|secret)\b["']?\s*[:=]\s*["'`]?([^\s"'`,;}\]]{8,})/gi;
const PLACEHOLDER_RE = /^(?:<.*>|\$\{|%[A-Z0-9_]+%|process\.env\.|env\.|your[_-]|redacted|placeholder|example|dummy|test(?:ing)?|change(?:me)?|replace|x{6,}|\*{6,}|null$|undefined$)/i;
const MAX_MATCHES_PER_RULE = 100;

function slash(value) { return value.replaceAll("\\", "/"); }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function privateSourceRegex(terms) {
  return new RegExp(`(?<![A-Za-z0-9])(?:${terms.map(escapeRegExp).join("|")})(?=$|[^A-Za-z0-9])`, "gi");
}
function isInside(root, target) {
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}
function location(text, index) {
  const before = text.slice(0, index), lastBreak = before.lastIndexOf("\n");
  return { line: before.split("\n").length, column: index - lastBreak };
}
function evidence(value, max = 120) {
  const normalized = String(value).replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}
function finding(rule, path, text, index, match, description) {
  return { rule, severity: "error", path, ...location(text, index), match: evidence(match), description };
}
function collectMatches(text, regex, callback) {
  regex.lastIndex = 0;
  let count = 0, match;
  while ((match = regex.exec(text)) && count < MAX_MATCHES_PER_RULE) {
    callback(match);
    count += 1;
    if (match[0].length === 0) regex.lastIndex += 1;
  }
}

export function isExcludedPublicPath(path) {
  const normalized = slash(path).replace(/^\.\//, ""), lower = normalized.toLowerCase();
  if (lower.split("/").pop() === ".gitignore") return true;
  if (lower === "config/sources.local.json") return true;
  return EXCLUDED_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

export function isCoreReferencePath(path) {
  const lower = slash(path).toLowerCase();
  return lower === "readme.md" || lower.startsWith("docs/") || lower.startsWith("data/") || lower.startsWith("skills/") || lower.startsWith("examples/tasks/") || lower.startsWith("examples/prompts/");
}

export function isTextCandidate(path) {
  const lower = slash(path).toLowerCase(), name = lower.split("/").pop();
  return name.startsWith(".env") || TEXT_EXTENSIONS.has(extname(name));
}

export function auditText(path, text, privateSourceTerms = PRIVATE_SOURCE_TOKENS) {
  const violations = [];
  collectMatches(text, WINDOWS_LOCAL_PATH_RE, (match) => violations.push(finding(
    "windows-local-absolute-path", path, text, match.index, match[0],
    "Public files must not expose absolute Windows user or local development paths.",
  )));
  if (privateSourceTerms.length) collectMatches(text, privateSourceRegex(privateSourceTerms), (match) => violations.push(finding(
      "private-source-name", path, text, match.index, match[0],
      "Public files must not expose local private pack or source names.",
    )));
  collectMatches(text, DISCORD_TOKEN_RE, (match) => violations.push(finding(
    "credential-discord-token", path, text, match.index, "[redacted]",
    "A value matching a Discord credential shape was found.",
  )));
  collectMatches(text, PRIVATE_KEY_RE, (match) => violations.push(finding(
    "credential-private-key", path, text, match.index, "[redacted private-key header]",
    "A private-key header was found in a public candidate.",
  )));
  collectMatches(text, SECRET_ASSIGNMENT_RE, (match) => {
    const value = match[1].replace(/["'`]$/, "");
    if (PLACEHOLDER_RE.test(value)) return;
    violations.push(finding(
      "credential-secret-assignment", path, text, match.index, "[redacted assignment]",
      "A non-placeholder token, password, key, or secret assignment was found.",
    ));
  });
  if (isCoreReferencePath(path)) collectMatches(text, CORE_REFERENCE_RE, (match) => violations.push(finding(
    "core-pmmp-reference", path, text, match.index, match[0],
    "Core Bedrock documentation, data, skills, and task prompts must not route to PMMP/PocketMine material.",
  )));
  return violations;
}

export function auditPublicSourceConfig(path, text) {
  const normalized = slash(path).toLowerCase();
  if (normalized !== "config/sources.public.json") return [];
  let parsed;
  try { parsed = JSON.parse(stripJsonTrailingCommas(stripJsonComments(text))); }
  catch (error) {
    return [finding("public-source-config-parse", path, text, 0, "invalid JSON/JSONC", `Public source config cannot be parsed: ${error.message}`)];
  }
  const violations = [], positions = [];
  const redistributionRe = /["']?redistribution["']?\s*:\s*["']([^"']+)["']/gi;
  collectMatches(text, redistributionRe, (match) => positions.push({ value: match[1], index: match.index }));
  for (const [index, source] of (parsed.sources || []).entries()) {
    if (["public", "metadata-only"].includes(source.redistribution)) continue;
    const position = positions[index]?.index ?? 0;
    violations.push(finding(
      "public-config-redistribution", path, text, position,
      `source=${source.id || index}; redistribution=${source.redistribution ?? "missing"}`,
      "Public source config permits only public or metadata-only redistribution.",
    ));
  }
  return violations;
}

function runGit(root, args) {
  return new Promise((done, reject) => {
    const child = spawn("git", args, { cwd: root, windowsHide: true });
    const stdout = [], stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => done({ code, stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8") }));
  });
}

export async function listPublicCandidates(root = REPO) {
  const result = await runGit(root, ["ls-files", "--cached", "--others", "--exclude-standard", "-z"]);
  if (result.code !== 0) throw new Error(`git ls-files failed: ${result.stderr.trim() || `exit ${result.code}`}`);
  const files = [...new Set(result.stdout.split("\0").filter(Boolean).map(slash))].sort();
  const candidates = [];
  for (const path of files) {
    if (isExcludedPublicPath(path)) continue;
    try { if ((await stat(resolve(root, path))).isFile()) candidates.push(path); }
    catch { /* Deleted tracked paths are not release candidates. */ }
  }
  return candidates;
}

export async function loadPrivateSourceTerms(root = REPO) {
  const terms = new Set(PRIVATE_SOURCE_TOKENS), configPath = resolve(root, "config", "sources.local.json");
  try {
    const examplePath = resolve(root, "config", "sources.local.example.json"), publicExampleIds = new Set();
    try {
      const exampleRaw = await readFile(examplePath, "utf8"), example = JSON.parse(stripJsonTrailingCommas(stripJsonComments(exampleRaw)));
      for (const source of example.sources || []) if (typeof source.id === "string") publicExampleIds.add(source.id);
    } catch { /* A missing example config does not weaken the fixed denylist. */ }
    const raw = await readFile(configPath, "utf8"), config = JSON.parse(stripJsonTrailingCommas(stripJsonComments(raw)));
    for (const source of config.sources || []) {
      if (!["local-only", "prohibited"].includes(source.redistribution)) continue;
      if (typeof source.id === "string" && source.id.length >= 3 && !publicExampleIds.has(source.id)) terms.add(source.id);
      for (const field of ["rpRoot", "bpRoot"]) {
        if (typeof source[field] !== "string") continue;
        const name = source[field].split(/[\\/]+/).filter(Boolean).pop();
        if (name?.length >= 4 && !/^<.*>$/.test(name)) terms.add(name);
      }
    }
  } catch { /* The fixed denylist remains active when no local config exists. */ }
  return [...terms].sort((a, b) => b.length - a.length || a.localeCompare(b));
}

export async function resolveReportPath(value, root = REPO) {
  const rootReal = await realpath(root), target = resolve(root, value);
  if (!isInside(root, target)) throw new Error("--report must stay inside the repository");
  let cursor = target;
  while (true) {
    try {
      await access(cursor);
      const cursorReal = await realpath(cursor);
      if (!isInside(rootReal, cursorReal)) throw new Error("--report resolves outside the repository through a symlink");
      break;
    } catch (error) {
      if (/outside the repository/.test(error.message)) throw error;
      const parent = dirname(cursor);
      if (parent === cursor) throw new Error("--report has no existing ancestor inside the repository");
      cursor = parent;
    }
  }
  return target;
}

export async function runPublicAudit(root = REPO) {
  const candidates = await listPublicCandidates(root), privateSourceTerms = await loadPrivateSourceTerms(root), violations = [];
  let scannedTextFiles = 0, skippedNonTextFiles = 0;
  for (const path of candidates) {
    if (!isTextCandidate(path)) { skippedNonTextFiles += 1; continue; }
    const text = await readFile(resolve(root, path), "utf8");
    scannedTextFiles += 1;
    violations.push(...auditText(path, text, privateSourceTerms), ...auditPublicSourceConfig(path, text));
  }
  violations.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.column - b.column || a.rule.localeCompare(b.rule));
  return {
    schema: "mcbe-jsonui-ai-kit/public-audit@1",
    ok: violations.length === 0,
    candidateFiles: candidates.length,
    scannedTextFiles,
    skippedNonTextFiles,
    privateSourceTermsLoaded: privateSourceTerms.length,
    excluded: [".gitignore", ...EXCLUDED_PREFIXES, "config/sources.local.json"],
    violations,
  };
}

function parseArgs(args) {
  const options = { help: false, json: false, report: null };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--help") options.help = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "--report") { options.report = args[++index]; if (!options.report) return null; }
    else if (arg.startsWith("--report=")) { options.report = arg.slice("--report=".length); if (!options.report) return null; }
    else return null;
  }
  return options;
}

export async function main(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  if (!options || options.help) {
    console.log(HELP);
    process.exitCode = options ? 0 : 64;
    return null;
  }
  const report = await runPublicAudit(REPO);
  if (options.report) {
    const reportPath = await resolveReportPath(options.report, REPO);
    await mkdir(dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  if (options.json) console.log(JSON.stringify(report, null, 2));
  else if (report.ok) console.log(`[OK] public audit: ${report.scannedTextFiles} text files checked`);
  else {
    console.error(`[ERR] public audit: ${report.violations.length} violation(s) in ${report.scannedTextFiles} text files`);
    for (const item of report.violations) console.error(`${item.path}:${item.line}:${item.column} ${item.rule} ${item.match}`);
  }
  if (!report.ok) process.exitCode = 9;
  return report;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }));
  process.exitCode = 1;
});
