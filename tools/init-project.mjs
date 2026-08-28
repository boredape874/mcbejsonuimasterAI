import { join } from "node:path";
import { log } from "./_lib/log.mjs";
import { PATHS } from "./_lib/paths.mjs";
import { ensureDir, exists, writeText } from "./_lib/fsx.mjs";
import { listProjectTemplates, renderProjectTemplate } from "./_lib/project-templates.mjs";

function printTemplates() {
  for (const template of listProjectTemplates()) {
    log.info(template.id, { description: template.description });
  }
}

function parseArgs(argv) {
  let name = null;
  let template = "minimal";
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--list-templates") continue;
    if (arg.startsWith("--template=")) {
      template = arg.slice("--template=".length);
      continue;
    }
    if (arg === "--template") {
      template = argv[++index];
      if (!template || template.startsWith("--")) return null;
      continue;
    }
    if (arg.startsWith("--") || name !== null) return null;
    name = arg;
  }
  return { name, template };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--list-templates")) {
    printTemplates();
    return;
  }

  const options = parseArgs(argv);
  const validTemplates = new Set(listProjectTemplates().map((template) => template.id));
  if (!options || !options.name || !/^[a-z][a-z0-9_]*$/.test(options.name) || !validTemplates.has(options.template)) {
    log.error("usage: node tools/init-project.mjs <name> [--template <minimal|rpg_hud|rpg_menu>]");
    process.exit(64);
  }
  const { name, template } = options;

  const dir = join(PATHS.workspace, name);
  const ir = join(dir, "ir.yaml");
  if (await exists(ir)) {
    log.warn("ir.yaml already exists; not overwriting", { path: ir });
    return;
  }

  const source = await renderProjectTemplate(template, name);
  await ensureDir(dir);
  await writeText(ir, source);
  log.ok("project initialized", { dir, ir, template });
}

main().catch((error) => {
  log.error("init-project crashed", { error: String(error && error.message || error) });
  process.exit(1);
});
