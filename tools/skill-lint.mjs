import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { PATHS } from "./_lib/paths.mjs";

const root = resolve(PATHS.root, "skills");
const issues = [];
const warnings = [];

async function walk(path) {
  const result = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const next = resolve(path, entry.name);
    if (entry.isDirectory()) result.push(...await walk(next));
    else if (entry.isFile()) result.push(next);
  }
  return result;
}

function frontmatter(text, file) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) { issues.push({ code: "FRONTMATTER_MISSING", file }); return null; }
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s/.test(line)) continue;
    const field = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!field) { issues.push({ code: "FRONTMATTER_INVALID", file, detail: line }); continue; }
    if (Object.hasOwn(fields, field[1])) issues.push({ code: "FRONTMATTER_DUPLICATE", file, detail: field[1] });
    fields[field[1]] = field[2].replace(/^['"]|['"]$/g, "").trim();
  }
  return fields;
}

function inspectText(text, file) {
  if (text.includes("�") || /(?:Ã.|Â.|â€|ì[\x80-\xBF])/u.test(text)) issues.push({ code: "MOJIBAKE", file });
  for (const match of text.matchAll(/https?:\/\/[^\s)>"']+/g)) {
    const url = match[0];
    if (/example\.(?:com|org)|TODO|PLACEHOLDER/i.test(url)) issues.push({ code: "PLACEHOLDER_URL", file, detail: url });
  }
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, "").split("#")[0];
    if (!target || /^(?:https?:|mailto:|#)/i.test(target)) continue;
    if (isAbsolute(target) || target.includes("\\")) { issues.push({ code: "NON_PORTABLE_REFERENCE", file, detail: target }); continue; }
    const candidate = resolve(dirname(file), decodeURIComponent(target));
    const rel = relative(root, candidate);
    if (rel.startsWith("..") || isAbsolute(rel)) issues.push({ code: "REFERENCE_ESCAPE", file, detail: target });
    else if (!existsSync(candidate)) issues.push({ code: "REFERENCE_MISSING", file, detail: target });
  }
}

if (process.argv.includes("--help")) {
  process.stdout.write("Usage: node tools/skill-lint.mjs [--json]\n");
  process.exit(0);
}
const skillDirs = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name));
const allFiles = await walk(root);
for (const directory of skillDirs) {
  const skillFile = resolve(root, directory.name, "SKILL.md");
  let text;
  try { text = await readFile(skillFile, "utf8"); } catch { issues.push({ code: "SKILL_MISSING", file: skillFile }); continue; }
  const fields = frontmatter(text, skillFile);
  if (fields) {
    if (fields.name !== directory.name) issues.push({ code: "NAME_MISMATCH", file: skillFile, detail: `${fields.name || "<missing>"} != ${directory.name}` });
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.name || "") || fields.name.length > 64) issues.push({ code: "NAME_INVALID", file: skillFile });
    if (!fields.description) issues.push({ code: "DESCRIPTION_MISSING", file: skillFile });
  }
}
for (const file of allFiles.filter((path) => /\.(?:md|ya?ml)$/i.test(path))) inspectText(await readFile(file, "utf8"), file);

const referenced = new Set();
for (const file of allFiles.filter((path) => /\.md$/i.test(path))) {
  const text = await readFile(file, "utf8");
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)#]+)(?:#[^)]+)?\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, "");
    if (!/^(?:https?:|mailto:)/i.test(target)) referenced.add(resolve(dirname(file), target));
  }
  for (const match of text.matchAll(/`([^`\r\n]+\.md)`/g)) {
    const target = match[1].trim();
    if (!isAbsolute(target) && !target.includes("\\")) referenced.add(resolve(dirname(file), target));
  }
}
const orphans = allFiles.filter((file) => file.includes(`${resolve(root)}${process.platform === "win32" ? "\\" : "/"}`) && file.includes(`${process.platform === "win32" ? "\\" : "/"}references${process.platform === "win32" ? "\\" : "/"}`) && !referenced.has(file)).map((file) => relative(PATHS.root, file).replaceAll("\\", "/"));
for (const file of orphans) warnings.push({ code: "UNREFERENCED_REFERENCE", file, action: "report-only" });
const report = { schema: "mcbe-jsonui-ai-kit/skill-lint@1", ok: issues.length === 0, readOnly: true, skills: skillDirs.length, issues, warnings, orphanAction: "report-only" };
process.stdout.write(`${JSON.stringify(report)}\n`);
if (!report.ok) process.exit(9);
