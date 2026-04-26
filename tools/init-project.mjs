// tools/init-project.mjs
// Create a workspace/<name>/ scaffold with a starter ir.yaml.
// Usage: node tools/init-project.mjs <name>

import { join } from "node:path";
import { log } from "./_lib/log.mjs";
import { PATHS } from "./_lib/paths.mjs";
import { ensureDir, exists, writeText } from "./_lib/fsx.mjs";

const TEMPLATE = (name) => `# Workspace: ${name}
# IR (Intermediate Representation) for layout-only authoring.
# Compile with:  node tools/run.mjs workspace/${name}/ir.yaml

screen: ${name}
base_resolution: [1920, 1080]
gui_scale: 3

elements:
  - id: panel_main
    kind: panel
    anchor: center
    pos: [0, 0]
    size: [320, 200]

  - id: title
    parent: panel_main
    kind: label
    anchor: top_middle
    pos: [0, 8]
    size: [200, 20]

  - id: btn_left
    parent: panel_main
    kind: button
    anchor: bottom_middle
    pos: [-70, -16]
    size: [120, 32]

  - id: btn_right
    parent: panel_main
    kind: button
    anchor: bottom_middle
    pos: [70, -16]
    size: [120, 32]

constraints:
  - { op: same_size,    ids: [btn_left, btn_right] }
  - { op: symmetric_x,  ids: [btn_left, btn_right] }
  - { op: align_y,      ids: [btn_left, btn_right] }
`;

async function main() {
  const name = process.argv[2];
  if (!name || !/^[a-z][a-z0-9_]*$/.test(name)) {
    log.error("usage: node tools/init-project.mjs <name>  (snake_case)");
    process.exit(64);
  }
  const dir = join(PATHS.workspace, name);
  await ensureDir(dir);
  const ir = join(dir, "ir.yaml");
  if (await exists(ir)) {
    log.warn("ir.yaml already exists; not overwriting", { path: ir });
    process.exit(0);
  }
  await writeText(ir, TEMPLATE(name));
  log.ok("project initialized", { dir, ir });
}

main().catch((e) => {
  log.error("init-project crashed", { error: String(e && e.message || e) });
  process.exit(1);
});
