import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createCanvas } from "@napi-rs/canvas";
import { controlIndex } from "../tools/_lib/preview-engine.mjs";

const repo = resolve(fileURLToPath(new URL("..", import.meta.url)));
const fixture = resolve(repo, "workspace", "_test_preview_engine");
function run(args) { return new Promise((done) => { const child = spawn(process.execPath, args, { cwd: repo }); let output = ""; child.stdout.on("data", (d) => { output += d; }); child.stderr.on("data", (d) => { output += d; }); child.on("close", (code) => done({ code, output })); }); }
function assert(ok, message) { if (!ok) throw new Error(message); console.log("PASS", message); }

await rm(fixture, { recursive: true, force: true });
await mkdir(resolve(fixture, "textures", "ui"), { recursive: true });
const texture = createCanvas(12, 12), tx = texture.getContext("2d");
tx.fillStyle = "#203040"; tx.fillRect(0, 0, 12, 12); tx.fillStyle = "#ffcc55";
tx.fillRect(0, 0, 12, 2); tx.fillRect(0, 10, 12, 2); tx.fillRect(0, 0, 2, 12); tx.fillRect(10, 0, 2, 12);
await writeFile(resolve(fixture, "textures", "ui", "frame.png"), await texture.encode("png"));
await writeFile(resolve(fixture, "textures", "ui", "frame.json"), JSON.stringify({ nineslice_size: [2, 2, 2, 2], base_size: [12, 12] }));
const ui = {
  namespace: "preview_fixture", root_panel: { type: "panel", size: [320, 180], controls: [] },
  panel: { type: "panel", size: [260, 120] }, frame: { type: "image", size: [260, 120], texture: "textures/ui/frame" },
  title: { type: "label", size: [180, 20], text: "Preview Engine", font_size: "normal", font_scale_factor: 0.8 },
  row: { type: "stack_panel", size: [200, 32], orientation: "horizontal" }, slots: { type: "grid", size: [96, 32], grid_dimensions: [3, 1] },
  action: { type: "button", size: [80, 28], default_control: "default", hover_control: "hover", pressed_control: "pressed" },
  unsupported_probe: { type: "panel", size: [10, 10], mystery_property: true },
};
const referenced = controlIndex({ namespace: "fixture", base: { type: "panel" }, root: { type: "panel", controls: [{ "instance@fixture.base": {} }] } });
assert(referenced.has("base"), "instance@namespace.control resolves the base control after @");
const rects = {
  __screen__: { x: 0, y: 0, w: 320, h: 180 }, __root__: { x: 0, y: 0, w: 320, h: 180 }, panel: { x: 30, y: 30, w: 260, h: 120 },
  frame: { x: 30, y: 30, w: 260, h: 120 }, title: { x: 70, y: 42, w: 180, h: 20 }, row: { x: 60, y: 76, w: 200, h: 32 },
  slots: { x: 60, y: 76, w: 96, h: 32 }, action: { x: 180, y: 78, w: 80, h: 28 }, unsupported_probe: { x: 0, y: 0, w: 10, h: 10 },
};
await writeFile(resolve(fixture, "ui.json"), JSON.stringify(ui, null, 2));
await writeFile(resolve(fixture, "solved.json"), JSON.stringify({ base_resolution: [320, 180], rects }, null, 2));
const result = await run(["tools/preview.mjs", "workspace/_test_preview_engine/ui.json", "workspace/_test_preview_engine/solved.json", "--json"]);
assert(result.code === 0, `preview exits 0: ${result.output}`);
const report = JSON.parse(result.output.trim()), coords = JSON.parse(await readFile(resolve(fixture, "coords.json"), "utf8"));
assert(coords.rects.length === 7, "geometry debugger preserves public solved rects");
assert(report.imageRenderer.enabled === true, "canvas renderer activates when installed");
assert(report.outputs.some((path) => path.endsWith("preview-pc-hover.png")), "PC hover output exists");
assert(report.outputs.some((path) => path.endsWith("preview-touch-pressed.png")), "touch pressed output exists");
assert(report.outputs.some((path) => path.endsWith("preview-contact-sheet.png")), "contact sheet exists");
assert(report.unsupported.some((item) => item.value === "mystery_property"), "unsupported property is reported");
assert(report.diagnostics.length === 0, "texture and nine-slice sidecar resolve");
const legacy = await run(["tools/render.mjs", "workspace/_test_preview_engine/ui.json", "workspace/_test_preview_engine/solved.json", "--no-image", "--report", "workspace/_test_preview_engine/disabled.json"]);
const disabled = JSON.parse(await readFile(resolve(fixture, "disabled.json"), "utf8"));
assert(legacy.code === 0 && disabled.imageRenderer.reason === "disabled_by_flag", "legacy render and explicit disabled report work");
const help = await run(["tools/preview.mjs", "--help"]);
assert(help.code === 0 && help.output.includes("--profiles") && help.output.includes("--report"), "public help documents machine-readable options");
