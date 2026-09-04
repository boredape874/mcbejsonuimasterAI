import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const here = fileURLToPath(new URL(".", import.meta.url));
const repo = resolve(here, "..");
const failures = [];

function check(name, condition, detail = "") {
  process.stdout.write(`${condition ? "PASS" : "FAIL"} ${name}${detail ? ` ${detail}` : ""}\n`);
  if (!condition) failures.push({ name, detail });
}

const briefText = await readFile(resolve(repo, "prompts/texture-asset-brief.yaml"), "utf8");
const brief = YAML.parse(briefText);
const skill = await readFile(resolve(repo, "skills/mcbe-json-ui-texture-design/SKILL.md"), "utf8");
const reference = await readFile(resolve(repo, "skills/mcbe-json-ui-texture-design/references/asset-brief-contract.md"), "utf8");
const profiles = JSON.parse(await readFile(resolve(repo, "data/skill-tool-profiles.json"), "utf8"));
const registry = JSON.parse(await readFile(resolve(repo, "data/ai-tool-registry.json"), "utf8"));

check("brief:identity", brief.schemaVersion === "1.0.0" && /^[a-z][a-z0-9_]*$/.test(brief.id));
check("brief:evidence-boundary", brief.evidence?.every((item) => item.claim && item.basis && Number.isInteger(item.sourcesObserved) && item.sourcesObserved >= 1));
check("brief:state-complete", ["default", "hover", "pressed", "locked"].every((state) => brief.stateSet?.some((item) => item.state === state)));
check("brief:file-state-match", brief.stateSet?.every((item) => brief.files?.some((file) => file.state === item.state)));
const [width, height] = brief.designDecisions.sourcePixelSize;
const margins = brief.nineSlice.margins;
check("brief:nineslice-bounds", margins.left + margins.right <= width && margins.top + margins.bottom <= height);
check("brief:same-stem-contract", brief.nineSlice.sidecarStemMatchesPng === true);
check("brief:prompt-exclusions", /No text, logos, watermark, signature/.test(brief.generationPrompt.constraints.join(" ")));
check("skill:imagegen-gate", /only when the user explicitly asks to create or edit an image/.test(skill));
check("skill:privacy-boundary", /Never include absolute paths, private source IDs/.test(skill));
check("reference:progressive-link", skill.includes("references/asset-brief-contract.md") && reference.includes("## Brief shape"));
const profile = profiles.profiles.find((item) => item.skill === "mcbe-json-ui-texture-design");
check("profile:registered", profile?.skillStatus === "implemented");
check("profile:tool-resolution", profile?.toolSelections.every((selection) => registry.tools.some((tool) => tool.id === selection.id)));
check("profile:semantic-first", profile?.workflow?.[0] === "asset.catalog" && profile?.workflow?.[1] === "asset.context");
check("profile:asset-fallback", profile?.toolSelections?.some((selection) => selection.id === "asset.search" && selection.phase === "fallback" && selection.required === false));

process.stdout.write(`\nTotal: ${14 - failures.length} passed, ${failures.length} failed\n`);
if (failures.length) process.exit(1);
