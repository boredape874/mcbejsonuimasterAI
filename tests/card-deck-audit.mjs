import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { createCanvas } from "@napi-rs/canvas";

const repo = resolve(import.meta.dirname, "..");
const root = resolve(process.env.MCBEKIT_TEST_ROOT || resolve(repo, "workspace"), "card-deck");
const deck = resolve(root, "components", "baccarat");
const reportPath = resolve(root, "report.json");
const ranks = ["a", "2", "3", "4", "5", "6", "7", "8", "9", "10", "j", "q", "k"];
const suits = ["c", "d", "h", "s"];

await rm(root, { recursive: true, force: true });
await mkdir(deck, { recursive: true });
const canvas = createCanvas(84, 121);
const context = canvas.getContext("2d");
context.fillStyle = "white";
context.fillRect(0, 0, 84, 121);
const png = await canvas.encode("png");
for (const rank of ranks) for (const suit of suits) await writeFile(resolve(deck, `card_${rank}${suit}.png`), png);
await writeFile(resolve(root, "PLAYING_CARDS_LICENSE.txt"), "MIT License\nCopyright fixture\n");

const result = await new Promise((done) => {
  const child = spawn(process.execPath, ["tools/card-deck-audit.mjs", deck, "--report", reportPath, "--json"], { cwd: repo });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  child.on("close", (code) => done({ code, output }));
});
if (result.code !== 0) throw new Error(result.output);
const report = JSON.parse(await readFile(reportPath, "utf8"));
if (!report.ok || report.cards.length !== 52 || report.canvasSizes[0] !== "84x121") throw new Error("deck audit invariant failed");
console.log("PASS card deck rank/suit, canvas, and license audit");
