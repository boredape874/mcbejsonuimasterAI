import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { extractRpContract, extractBpSenders, analyzeServerFormContract, validateServerFormContractShape } from "../tools/_lib/server-form-contract.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const FIXTURES = resolve(ROOT, "tests/fixtures/runtime-regressions/server-form");
let passed = 0;
const failures = [];
function check(name, condition, detail = "") {
  if (condition) { passed++; process.stdout.write(`PASS ${name}\n`); }
  else { failures.push({ name, detail }); process.stdout.write(`FAIL ${name} ${detail}\n`); }
}
function codes(result) { return [...result.diagnostics, ...result.unresolved].map((item) => item.code); }
function run(args) { return new Promise((done) => {
  const child = spawn(process.execPath, args, { cwd: ROOT }); let stdout = ""; let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; }); child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.on("close", (code) => done({ code, stdout, stderr }));
}); }

async function main() {
  const validRp = resolve(FIXTURES, "valid/RP/ui/server_form.json");
  const validBp = resolve(FIXTURES, "valid/BP/scripts/main.js");
  const valid = await analyzeServerFormContract({ rpPath: validRp, bpPath: validBp });
  check("valid integrated contract", valid.ok === true, JSON.stringify([...valid.diagnostics, ...valid.unresolved]));
  check("extract title/factory/collection/event", valid.sender?.title === "SHOP:main" && valid.receiver.factories.length === 1 && valid.receiver.collections[0]?.semanticIds?.length === 2 && valid.receiver.events.includes("button.form_button_click"));
  check("all-scope and filtered original index", valid.search.scope === "all" && valid.search.indexSafety === "safe");
  check("static evidence boundary", valid.evidenceLevel === "integrated-static" && valid.runtimeVerified === false);
  check("P1-101 valid contract shape", validateServerFormContractShape(valid).ok === true);
  const invalidShape = validateServerFormContractShape({ schema: "bad", search: { scope: "global" }, inputs: {} });
  check("P1-101 invalid contract shape", !invalidShape.ok && invalidShape.errors.some((item) => item.code === "CONTRACT_SCHEMA_INVALID") && invalidShape.errors.some((item) => item.code === "CONTRACT_SEARCH_SCOPE_INVALID"));

  const missing = await extractRpContract(resolve(FIXTURES, "missing-route-control.json"));
  check("F-002 missing route control", codes(missing).includes("CONTROL_REFERENCE_NOT_FOUND"));
  const template = await extractRpContract(resolve(FIXTURES, "invalid-template.json"));
  check("F-003 unresolved variable template", codes(template).includes("UNRESOLVED_TEMPLATE_VARIABLE"));
  const owner = await extractRpContract(resolve(FIXTURES, "invalid-owner-hover.json"));
  check("F-004 invalid hover property", codes(owner).includes("INVALID_HOVER_PROPERTY"));
  check("F-010 collection owner context", codes(owner).includes("COLLECTION_OWNER_TYPE_INVALID") && codes(owner).includes("COLLECTION_INDEX_CONTEXT_INVALID"));
  check("F-011 hover content semantics", codes(owner).includes("HOVER_STATE_CONTENT_LOSS"));
  const current = await extractRpContract(resolve(FIXTURES, "current-search.json"));
  check("F-006 current search is not global", current.search.scope === "current" && codes(current).includes("SEARCH_SCOPE_CURRENT_COLLECTION"));
  check("filtered click without index is unsafe", current.search.indexSafety === "unsafe" && codes(current).includes("FILTERED_CLICK_INDEX_UNSAFE"));
  const normalized = await extractRpContract(resolve(FIXTURES, "normalized-search.json"));
  check("Korean/mixed normalization unresolved", normalized.search.caseSensitivity === "unsupported-unresolved" && codes(normalized).includes("SEARCH_NORMALIZATION_UNSUPPORTED"));
  const marker = await extractRpContract(resolve(FIXTURES, "protocol-marker-leak.json"));
  check("F-007 visible protocol marker leak", codes(marker).includes("PROTOCOL_MARKER_LEAK"));

  const directRp = resolve(ROOT, "references/patterns/server-form-direct-input/RP/ui/server_form.json");
  const directBp = resolve(ROOT, "references/patterns/server-form-direct-input/BP/scripts/main.js");
  const direct = await analyzeServerFormContract({ rpPath: directRp, bpPath: directBp });
  check("direct input native contract", direct.ok && direct.sender.formKind === "modal" && direct.inputs.length === 1 && direct.inputs[0].focusable === true && direct.receiver.events.includes("button.submit_custom_form") && direct.receiver.events.includes("button.clear_custom_form"), JSON.stringify([...direct.diagnostics, ...direct.unresolved]));
  const inputMismatch = await analyzeServerFormContract({ rpPath: directRp, bpPath: resolve(FIXTURES, "modal-input-mismatch.js") });
  check("modal input order mismatch", codes(inputMismatch).includes("INPUT_FIELD_ORDER_MISMATCH"));

  const noSender = await analyzeServerFormContract({ rpPath: validRp });
  check("missing sender fail closed", !noSender.ok && codes(noSender).includes("SENDER_NOT_FOUND"));
  const mismatchSource = await readFile(resolve(FIXTURES, "mismatch.js"), "utf8");
  const chained = await extractBpSenders(directBp);
  check("BP modal field order extraction", chained[0]?.inputs[0]?.semanticId === "Reply");
  const mismatch = await analyzeServerFormContract({ rpPath: validRp, bpPath: resolve(FIXTURES, "mismatch.js") });
  check("button order and title mismatch", codes(mismatch).includes("BUTTON_ORDER_MISMATCH") && codes(mismatch).includes("TITLE_ROUTE_MISMATCH"));
  check("cancel is scoped per sender", codes(mismatch).includes("CANCEL_HANDLER_MISSING"));
  const senderKinds = await extractBpSenders(resolve(FIXTURES, "mismatch.js"));
  check("Action/Message chained sender extraction", mismatchSource.includes("ActionFormData") && senderKinds[0]?.buttons.length === 2 && senderKinds[1]?.formKind === "message" && senderKinds[1]?.buttons.length === 2);

  const cli = await run(["tools/server-form-contract.mjs", "--rp", validRp, "--bp", validBp, "--json"]);
  check("CLI success JSON", cli.code === 0 && JSON.parse(cli.stdout).ok === true, cli.stderr);
  const cliFail = await run(["tools/server-form-contract.mjs", "--rp", resolve(FIXTURES, "current-search.json"), "--json"]);
  check("CLI fail-closed exit", cliFail.code === 9 && JSON.parse(cliFail.stdout).ok === false, cliFail.stderr);

  process.stdout.write(`\nTotal: ${passed} passed, ${failures.length} failed\n`);
  if (failures.length) process.exit(1);
}
main().catch((error) => { process.stderr.write(`${error.stack || error}\n`); process.exit(1); });
