import { join } from "node:path";
import { readText } from "./fsx.mjs";
import { PATHS } from "./paths.mjs";

const TEMPLATES = Object.freeze({
  minimal: {
    file: "minimal.yaml",
    description: "Centered panel with a title and symmetric action buttons",
  },
  rpg_hud: {
    file: "rpg_hud.yaml",
    description: "Compact top-left RPG status cluster with portrait and stat bars",
  },
  rpg_menu: {
    file: "rpg_menu.yaml",
    description: "Image-led asymmetric server-form dashboard with four action cards",
  },
});

export function listProjectTemplates() {
  return Object.entries(TEMPLATES).map(([id, template]) => ({ id, description: template.description }));
}

export async function renderProjectTemplate(templateId, projectName) {
  const template = TEMPLATES[templateId];
  if (!template) {
    const valid = Object.keys(TEMPLATES).join(", ");
    throw new Error(`unknown template "${templateId}"; valid templates: ${valid}`);
  }
  const source = await readText(join(PATHS.irTemplates, template.file));
  return source.replaceAll("{{name}}", projectName);
}
