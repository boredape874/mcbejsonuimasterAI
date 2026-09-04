import assert from "node:assert/strict";
import { parseUiSource } from "../tools/_lib/json-dialect.mjs";

const accepts = (source, dialect, kind = "authoring") => parseUiSource(source, { dialect, kind }).document;
const rejects = (source, dialect, code, kind = "authoring") => assert.throws(() => accepts(source, dialect, kind), (error) => error.code === code);
assert.deepEqual(accepts('{"a":1}', "strict-json"), { a: 1 });
rejects('\uFEFF{"a":1}', "strict-json", "JSON_BOM_FORBIDDEN");
rejects('{//x\n"a":1}', "strict-json", "JSON_COMMENT_FORBIDDEN");
rejects('{"a":1,}', "strict-json", "JSON_TRAILING_COMMA_FORBIDDEN");
assert.deepEqual(accepts('\uFEFF{/*x*/"a":[1,],}', "tooling-jsonc"), { a: [1] });
assert.deepEqual(accepts('{//x\n"a":1,}', "bedrock-json@1.21.100", "runtime"), { a: 1 });
rejects('{"a":1,"\\u0061":2}', "strict-json", "JSON_DUPLICATE_KEY");
rejects('{"a":"x\u0001y"}', "strict-json", "JSON_UNESCAPED_CONTROL_CHAR");
rejects('{"a":1}', "bedrock-json@9.99", "DIALECT_UNVERIFIED", "runtime");
rejects('{"a":1}', "tooling-jsonc", "TOOLING_JSONC_ONLY", "runtime");
assert.equal(accepts('{"url":"//not-comment","x":"/*ok*/,"}', "strict-json").url, "//not-comment");
console.log("dialect matrix OK");
