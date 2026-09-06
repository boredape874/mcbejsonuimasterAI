import { readdir } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { exists, readJson, readText } from "./fsx.mjs";
import { PATHS } from "./paths.mjs";

const IGNORED_DIRS = new Set([".git", "node_modules", "workspace", "_ext", "private", "restricted", "upstreams"]);
const LEGACY_REFERENCES = [
  { pattern: /references[\\/]sample-packs[\\/]/g, replacement: "references/source-packs/" },
  { pattern: /references[\\/]verified-samples[\\/]/g, replacement: "references/official/" },
  { pattern: /references[\\/]mirrors[\\/]/g, replacement: "references/external/" },
  { pattern: /references[\\/]reference-mirrors[\\/]/g, replacement: "references/upstreams/" },
  { pattern: /(?:\.\.\/)+(?:docs|data|references|schemas|templates|vanilla-index)\//g, replacement: "a repository-root-relative path", skillsOnly: true },
  { pattern: /docs\/pack-analyses\/form-router-sample\.md/g, replacement: "docs/pack-analyses/modern-cloud-ui-reference.md" },
  { pattern: /docs\/pack-analyses\/game-hud-sample\.md/g, replacement: "docs/pack-analyses/rpg-server-ui-reference.md" },
  { pattern: /docs\/pack-analyses\/ui-variant-samples\.md/g, replacement: "docs/pack-analyses/farm-ui-variants.md" },
  { pattern: /data\/advanced-ui-set-ui-file-index\.json/g, replacement: "data/advanced-ui-set-file-index.json" },
  { pattern: /"optionalRestrictedReferences"/g, replacement: "\"optionalrestrictedReferences\"" },
  { pattern: /json ui 개발\/ui\/sample UI suiteUI/g, replacement: "json ui 개발/ui/RainbowPieUI" },
  { pattern: /minecraft-bedrock-json-ui-sample\/dynamic form library\//g, replacement: "minecraft-bedrock-json-ui-sample/starLib/" },
  { pattern: /18-tooling-auxgen-dumper-dynamic form library\.md/g, replacement: "18-tooling-auxgen-dumper-starlib.md" },
];

function portable(path) {
  return path.split(sep).join("/");
}

async function listFiles(root, predicate) {
  const files = [];
  async function visit(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.isDirectory() && IGNORED_DIRS.has(entry.name)) continue;
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile() && predicate(path)) files.push(path);
    }
  }
  if (await exists(root)) await visit(root);
  return files;
}

function markdownLinks(source) {
  const links = [];
  let fenced = false;
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (fenced) continue;
    const pattern = /\[[^\]]*\]\(([^)]+)\)/g;
    let match;
    while ((match = pattern.exec(line))) links.push({ target: match[1].trim(), line: index + 1 });
  }
  return links;
}

function localLinkTarget(target) {
  if (!target || target.startsWith("#") || target.includes("://") || target.startsWith("mailto:")) return null;
  const withoutTitle = target.replace(/\s+["'][^"']*["']$/, "");
  const unwrapped = withoutTitle.startsWith("<") && withoutTitle.endsWith(">") ? withoutTitle.slice(1, -1) : withoutTitle;
  const path = unwrapped.split("#", 1)[0].split("?", 1)[0];
  if (!path || path.includes("*") || path.includes("{{") || path.includes("<")) return null;
  return decodeURIComponent(path);
}

function declaredRepositoryPaths(source) {
  const paths = [];
  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const pattern = /`((?:docs|data|references|schemas|templates|skills|topics)\/[^`]+)`/g;
    let match;
    while ((match = pattern.exec(lines[index]))) paths.push({ target: match[1], line: index + 1 });
  }
  return paths;
}

function isCheckableRepositoryPath(target) {
  if (target.startsWith("references/restricted/") || target.startsWith("references/upstreams/")) return false;
  if (/[*{}<>]|\.\.\./.test(target)) return false;
  return /(?:\.(?:md|json|jsonc|yaml|yml)|\/)$/.test(target);
}

async function exactCaseExists(path) {
  const rel = relative(PATHS.root, path);
  if (rel.startsWith("..") || isAbsolute(rel)) return exists(path);
  let current = PATHS.root;
  for (const segment of rel.split(sep).filter(Boolean)) {
    const entries = await readdir(current).catch(() => []);
    if (!entries.includes(segment)) return false;
    current = join(current, segment);
  }
  return true;
}

async function auditMarkdown() {
  const roots = [PATHS.root, resolve(PATHS.root, "docs"), resolve(PATHS.root, "skills"), resolve(PATHS.root, "examples"), resolve(PATHS.root, "templates")];
  const files = new Set();
  for (const root of roots) {
    if (root === PATHS.root) {
      for (const name of ["README.md", "AGENTS.md", "NOTICE.md"]) {
        const path = resolve(root, name);
        if (await exists(path)) files.add(path);
      }
      continue;
    }
    for (const file of await listFiles(root, (path) => extname(path).toLowerCase() === ".md")) files.add(file);
  }

  const issues = [];
  for (const file of [...files].sort()) {
    const source = await readText(file);
    for (const link of markdownLinks(source)) {
      const target = localLinkTarget(link.target);
      if (!target) continue;
      const resolved = target.startsWith("/") ? resolve(PATHS.root, target.slice(1)) : resolve(dirname(file), target);
      if (!(await exactCaseExists(resolved))) {
        issues.push({ severity: "error", path: `${portable(relative(PATHS.root, file))}:${link.line}`, message: `Broken local Markdown link: ${link.target}` });
      }
    }
  }
  return { files: files.size, issues };
}

async function auditJson() {
  const roots = [resolve(PATHS.root, "data"), resolve(PATHS.root, "schemas"), resolve(PATHS.root, "examples", "vscode")];
  const files = [PATHS.packageJson];
  for (const root of roots) files.push(...await listFiles(root, (path) => extname(path).toLowerCase() === ".json"));
  const issues = [];
  for (const file of files) {
    try {
      await readJson(file);
    } catch (error) {
      issues.push({ severity: "error", path: portable(relative(PATHS.root, file)), message: `Invalid JSON: ${String(error && error.message || error)}` });
    }
  }
  return { files: files.length, issues };
}

async function auditSkills() {
  const files = await listFiles(resolve(PATHS.root, "skills"), (path) => path.endsWith(`${sep}SKILL.md`));
  const issues = [];
  for (const file of files) {
    const source = await readText(file);
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    const frontmatter = match && match[1];
    const name = frontmatter && frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
    const description = frontmatter && frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
    if (!frontmatter || !name || !description) {
      issues.push({ severity: "error", path: portable(relative(PATHS.root, file)), message: "SKILL.md must define name and description frontmatter" });
    }
  }
  return { files: files.length, issues };
}

async function auditPackageScripts() {
  const packageJson = await readJson(PATHS.packageJson);
  const issues = [];
  for (const [name, command] of Object.entries(packageJson.scripts || {})) {
    const match = command.match(/^node\s+([^\s]+)/);
    if (!match) continue;
    const target = resolve(PATHS.root, match[1]);
    if (!(await exactCaseExists(target))) {
      issues.push({ severity: "error", path: `package.json#scripts.${name}`, message: `Script target does not exist: ${match[1]}` });
    }
  }
  return { files: 1, issues };
}

async function auditLegacyReferences() {
  const roots = [
    PATHS.root,
    resolve(PATHS.root, "docs"),
    resolve(PATHS.root, "skills"),
    resolve(PATHS.root, "data"),
  ];
  const files = new Set();
  for (const root of roots) {
    if (root === PATHS.root) {
      for (const name of ["README.md", "AGENTS.md"]) {
        const path = resolve(root, name);
        if (await exists(path)) files.add(path);
      }
      continue;
    }
    for (const file of await listFiles(root, (path) => [".md", ".json", ".yaml", ".yml"].includes(extname(path).toLowerCase()))) files.add(file);
  }

  const issues = [];
  for (const file of [...files].sort()) {
    const filePath = portable(relative(PATHS.root, file));
    const lines = (await readText(file)).split(/\r?\n/);
    for (let index = 0; index < lines.length; index++) {
      for (const legacy of LEGACY_REFERENCES) {
        if (legacy.skillsOnly && !filePath.startsWith("skills/")) continue;
        legacy.pattern.lastIndex = 0;
        if (!legacy.pattern.test(lines[index])) continue;
        issues.push({
          severity: "error",
          path: `${filePath}:${index + 1}`,
          message: `Legacy reference path; use ${legacy.replacement}`,
        });
      }
    }
  }
  return { files: files.size, issues };
}

async function auditDeclaredRepositoryPaths() {
  const files = new Set();
  for (const name of ["README.md", "AGENTS.md"]) {
    const path = resolve(PATHS.root, name);
    if (await exists(path)) files.add(path);
  }
  for (const root of [resolve(PATHS.root, "docs"), resolve(PATHS.root, "skills")]) {
    for (const file of await listFiles(root, (path) => extname(path).toLowerCase() === ".md")) files.add(file);
  }

  const issues = [];
  for (const file of [...files].sort()) {
    const filePath = portable(relative(PATHS.root, file));
    const skillMatch = filePath.match(/^skills\/([^/]+)\//);
    const skillRoot = skillMatch ? resolve(PATHS.root, "skills", skillMatch[1]) : null;
    for (const declared of declaredRepositoryPaths(await readText(file))) {
      if (!isCheckableRepositoryPath(declared.target)) continue;
      const rootTarget = resolve(PATHS.root, declared.target);
      const skillTarget = skillRoot ? resolve(skillRoot, declared.target) : null;
      const fileTarget = resolve(dirname(file), declared.target);
      const rootExists = await exactCaseExists(rootTarget);
      const skillExists = skillTarget ? await exactCaseExists(skillTarget) : false;
      const fileExists = await exactCaseExists(fileTarget);
      if (rootExists || skillExists || fileExists) continue;
      issues.push({
        severity: "error",
        path: `${filePath}:${declared.line}`,
        message: `Declared repository path does not exist: ${declared.target}`,
      });
    }
  }

  const dataFiles = await listFiles(resolve(PATHS.root, "data"), (path) => extname(path).toLowerCase() === ".json");
  const indexedPaths = [];
  function visit(value, filePath, skillRoot = null) {
    if (typeof value === "string") {
      if (!/^(?:docs|data|references|schemas|templates|skills)\//.test(value) || !isCheckableRepositoryPath(value)) return;
      indexedPaths.push({ filePath, value, skillRoot });
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item, filePath, skillRoot);
      return;
    }
    if (!value || typeof value !== "object") return;
    const nestedSkillRoot = filePath === "data/skill-routing.json" && typeof value.skill === "string"
      ? resolve(PATHS.root, "skills", value.skill)
      : skillRoot;
    for (const item of Object.values(value)) visit(item, filePath, nestedSkillRoot);
  }
  for (const file of dataFiles) visit(await readJson(file), portable(relative(PATHS.root, file)));
  for (const indexed of indexedPaths) {
    if (await exactCaseExists(resolve(PATHS.root, indexed.value))) continue;
    if (indexed.skillRoot && await exactCaseExists(resolve(indexed.skillRoot, indexed.value))) continue;
    issues.push({
      severity: "error",
      path: indexed.filePath,
      message: `Indexed repository path does not exist: ${indexed.value}`,
    });
  }

  return { files: files.size + dataFiles.length, issues };
}

export async function auditRepository() {
  const sections = await Promise.all([
    auditMarkdown(),
    auditJson(),
    auditSkills(),
    auditPackageScripts(),
    auditLegacyReferences(),
    auditDeclaredRepositoryPaths(),
  ]);
  const issues = sections.flatMap((section) => section.issues);
  return {
    schema: "mcbe-jsonui-ai-kit/audit-report@1",
    ok: issues.every((issue) => issue.severity !== "error"),
    checkedFiles: sections.reduce((sum, section) => sum + section.files, 0),
    errors: issues.filter((issue) => issue.severity === "error"),
    warnings: issues.filter((issue) => issue.severity === "warning"),
    checkedAt: new Date().toISOString(),
  };
}
