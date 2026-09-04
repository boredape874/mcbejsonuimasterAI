import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLocalBackend } from "../tools/mcp-backend.mjs";

const root = await mkdtemp(join(tmpdir(), "mcbe-mcp-v2-"));
await mkdir(join(root, "ui"), { recursive: true });
await writeFile(join(root, "ui", "_ui_defs.json"), JSON.stringify({ ui_defs: ["ui/demo.json"] }));
const target = join(root, "ui", "demo.json");
await writeFile(target, JSON.stringify({ namespace: "demo", screen: { type: "panel", offset: [0, 0] } }));
const hash = createHash("sha256").update(await readFile(target)).digest("hex");
const backend = await createLocalBackend();
const evidenceIds = ["evidence-fixture"];
const base = { rpRoot: root, evidenceIds, maxDeltaUi: 2 };

const accepted = await backend.proposeCorrections({ ...base, evidence: [{ result: { issues: [{ kind: "offset", proposal: { file: "ui/demo.json", jsonPointer: "/screen/offset/0", oldValue: 0, newValue: 1, deltaUi: 1, fileHash: hash } }] } }] });
assert.equal(accepted.patches.length, 1);
assert.deepEqual(accepted.patches[0].jsonPatch, [
  { op: "test", path: "/screen/offset/0", value: 0 },
  { op: "replace", path: "/screen/offset/0", value: 1 },
]);
assert.equal(accepted.patches[0].applyAllowed, false);
assert.equal(accepted.patches[0].source.fileHash, hash);

const rejected = await backend.proposeCorrections({ ...base, evidence: [{ result: { issues: [
  { proposal: { file: "../escape.json", jsonPointer: "/x", oldValue: 0, newValue: 1, deltaUi: 1 } },
  { proposal: { file: "ui/demo.json", jsonPointer: "/x", oldValue: 0, newValue: 3, deltaUi: 3 } },
  { proposal: { file: "ui/demo.json", jsonPointer: "/x", oldValue: 0, newValue: 1, deltaUi: 1, fileHash: "stale" } },
] } }] });
assert.deepEqual(rejected.rejected.map((item) => item.reason), ["path_escape", "delta_exceeds_limit", "stale_file_hash"]);

const inspector = await readFile(new URL("../tools/inspector-server.mjs", import.meta.url), "utf8");
assert.match(inspector, /createMcbeUiService/);
assert.match(inspector, /service\.dispatch\(tool,args\)/);
assert.doesNotMatch(inspector, /backend\[method\]\(args\)/);

console.log("mcp-v2-contract: ok");
