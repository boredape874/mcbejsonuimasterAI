// Every skill must tell the agent to research real evidence before applying
// the skill's own guidance, in the same order and with the same labels, so the
// behavior does not depend on which skill was loaded first.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SKILLS = resolve(ROOT, "skills");
const topology = JSON.parse(await readFile(resolve(ROOT, "data", "skill-topology.json"), "utf8"));
const directories = (await readdir(SKILLS, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
assert.deepEqual(directories, [...topology.sourceSkills].sort(), "skill directories must match the topology");

const REQUIRED = [
  "## Evidence first, skill second",
  "1. ",
  "2. ",
  "3. ",
  "4. ",
  "node tools/design-library.mjs sources --source ID",
  "config/design-research-lock.json",
  "inferred from skill guidance",
  "overrides this skill",
  "do not delete or rewrite them",
];
const PACK_SKILLS = new Set(["mcbe-attachables-ui", "mcbe-geo-ui", "mcbe-resource-pack-master", "mcbe-resource-pack-rendering"]);
let checked = 0;
for (const name of directories) {
  const text = await readFile(resolve(SKILLS, name, "SKILL.md"), "utf8");
  for (const token of REQUIRED) assert.ok(text.includes(token), `${name}/SKILL.md is missing "${token}"`);
  const sectionStart = text.indexOf("## Evidence first, skill second");
  const nextHeading = text.indexOf("\n## ", sectionStart + 1);
  const section = text.slice(sectionStart, nextHeading === -1 ? undefined : nextHeading);
  assert.ok(section.includes("references/official/bedrock-samples-ui.lock.json"), `${name}: the pinned official sample lock must be the vanilla evidence anchor`);
  if (PACK_SKILLS.has(name)) {
    assert.ok(section.includes("node tools/attachable-inspect.mjs") || section.includes("node tools/geoui-inspect.mjs") || section.includes("node tools/material-audit.mjs"), `${name}: pack skills must name their structural checker as evidence`);
    assert.ok(section.includes("resource_pack/attachables") || section.includes("resource_pack/entity") || section.includes("materials"), `${name}: pack skills must point at the vanilla pack folders that hold their evidence`);
  } else {
    assert.ok(section.includes("node tools/vanilla-name-check.mjs"), `${name}: JSON UI skills must name the vanilla name checker`);
  }
  // The section must come before the skill's own workflow/contract sections so it is read first.
  const firstOwnHeading = text.search(/\n## (?!Evidence first)/);
  assert.ok(firstOwnHeading === -1 || sectionStart < firstOwnHeading, `${name}: evidence-first section must precede the skill's own sections`);
  checked++;
}
console.log(`evidence-first order present in ${checked} skills`);
