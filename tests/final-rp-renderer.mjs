import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadRpProject, layoutResolvedTree, resolveControl } from "../tools/_lib/final-rp-resolver.mjs";
import { loadCanvas, renderResolvedTree } from "../tools/_lib/final-rp-renderer.mjs";

const root = await mkdtemp(join(tmpdir(), "mcbe-state-render-"));
await mkdir(join(root, "ui"), { recursive: true });
await writeFile(join(root, "ui", "_ui_defs.json"), JSON.stringify({ ui_defs: ["ui/test.json"] }));
const state = (index, offset) => ({
  type: "button", collection_index: index, size: [20, 20], anchor_from: "top_left", anchor_to: "top_left", offset,
  default_control: "default", hover_control: "hover", pressed_control: "pressed",
  controls: [
    { default: { type: "image", texture: "textures/ui/Black", size: [20, 20] } },
    { hover: { type: "image", texture: "textures/ui/White", size: [20, 20] } },
    { pressed: { type: "image", texture: "textures/ui/Black", color: [1, 0, 0], size: [20, 20] } }
  ]
});
await writeFile(join(root, "ui", "test.json"), JSON.stringify({ namespace: "test", screen: { type: "panel", size: [64, 32], controls: [{ left: state(0, [4, 6]) }, { right: state(1, [36, 6]) }] } }));
const project = await loadRpProject(root), resolved = resolveControl(project, "@test.screen", { fixture: { buttons: [{ index: 0, text: "" }, { index: 1, text: "" }] } }), layout = layoutResolvedTree(resolved.tree, { viewport: [64, 32] }), canvasMod = await loadCanvas();
const left = await renderResolvedTree({ canvasMod, project, layout, outputPath: join(root, "left.png"), interaction: { hoveredIndex: 0 } });
const right = await renderResolvedTree({ canvasMod, project, layout, outputPath: join(root, "right.png"), interaction: { hoveredIndex: 1 } });
assert.notEqual(left.hash, right.hash, "different hovered collection indices must produce different PNG hashes");
console.log("final-rp-renderer: ok");
