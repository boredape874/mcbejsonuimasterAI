#!/usr/bin/env node
import { access, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { loadImage } from "@napi-rs/canvas";

const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.length === 0) {
  console.log("Usage: node tools/card-deck-audit.mjs <deck-dir> [--report <report.json>] [--json]");
  process.exit(argv.length ? 0 : 64);
}
const deckDir = resolve(argv[0]);
const reportAt = argv.indexOf("--report");
const reportPath = reportAt >= 0 ? resolve(argv[reportAt + 1]) : null;
const ranks = ["a", "2", "3", "4", "5", "6", "7", "8", "9", "10", "j", "q", "k"];
const suits = ["c", "d", "h", "s"];
const cards = [];
const errors = [];

for (const rank of ranks) for (const suit of suits) {
  const id = `${rank}${suit}`;
  const path = join(deckDir, `card_${id}.png`);
  try {
    await access(path);
    const image = await loadImage(path);
    cards.push({ id, rank, suit, path, width: image.width, height: image.height });
  } catch (error) {
    errors.push({ code: "missing_or_unreadable_card", id, message: error.message });
  }
}

const sizes = [...new Set(cards.map((card) => `${card.width}x${card.height}`))];
if (cards.length !== 52) errors.push({ code: "deck_card_count", expected: 52, actual: cards.length });
if (sizes.length !== 1) errors.push({ code: "mixed_card_canvas", sizes });
const licensePath = resolve(deckDir, "..", "..", "PLAYING_CARDS_LICENSE.txt");
let license = null;
try {
  const text = await readFile(licensePath, "utf8");
  license = { path: licensePath, mit: /MIT License/i.test(text), copyright: text.match(/Copyright[^\r\n]*/i)?.[0] ?? null };
  if (!license.mit) errors.push({ code: "license_not_mit", path: licensePath });
} catch {
  errors.push({ code: "missing_license", path: licensePath });
}

const report = {
  schemaVersion: "1.0.0",
  ok: errors.length === 0,
  deckDir,
  expectedIds: ranks.flatMap((rank) => suits.map((suit) => `${rank}${suit}`)),
  cards,
  canvasSizes: sizes,
  license,
  errors,
};
if (reportPath) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
if (argv.includes("--json")) console.log(JSON.stringify(report));
else console.log(`${report.ok ? "PASS" : "FAIL"} ${cards.length}/52 cards; canvas=${sizes.join(",") || "none"}`);
process.exit(report.ok ? 0 : 9);
