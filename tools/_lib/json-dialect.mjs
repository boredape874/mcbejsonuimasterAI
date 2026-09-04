import { readFile } from "node:fs/promises";

export const JSON_DIALECTS = Object.freeze({
  "strict-json": { id: "strict-json", verified: true, bom: false, comments: false, trailingCommas: false },
  "tooling-jsonc": { id: "tooling-jsonc", verified: true, bom: true, comments: true, trailingCommas: true },
  "bedrock-json@1.21.100": { id: "bedrock-json@1.21.100", verified: true, bom: true, comments: true, trailingCommas: true },
});

export class JsonDialectError extends SyntaxError {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "JsonDialectError";
    this.code = code;
    Object.assign(this, details);
  }
}

function fail(code, message, index, source) {
  const before = source.slice(0, Math.max(0, index));
  const lines = before.split(/\r\n|\r|\n/);
  throw new JsonDialectError(code, message, { offset: index, line: lines.length, column: lines.at(-1).length + 1 });
}

function resolveProfile(dialect) {
  const profile = JSON_DIALECTS[dialect];
  if (!profile?.verified) throw new JsonDialectError("DIALECT_UNVERIFIED", `JSON dialect is not verified: ${dialect || "<missing>"}`, { dialect: dialect || null });
  return profile;
}

function sanitize(source, profile) {
  let output = "", index = 0, inString = false, escaped = false;
  if (source.charCodeAt(0) === 0xFEFF) {
    if (!profile.bom) fail("JSON_BOM_FORBIDDEN", "BOM is not allowed by the selected JSON dialect", 0, source);
    output += " "; index = 1;
  }
  for (; index < source.length; index++) {
    const char = source[index], next = source[index + 1];
    if (inString) {
      if (char.charCodeAt(0) < 0x20) fail("JSON_UNESCAPED_CONTROL_CHAR", "Unescaped control character in JSON string", index, source);
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; output += char; continue; }
    if (char === "/" && (next === "/" || next === "*")) {
      if (!profile.comments) fail("JSON_COMMENT_FORBIDDEN", "Comments are not allowed by the selected JSON dialect", index, source);
      const block = next === "*"; output += "  "; index += 2;
      while (index < source.length && (block ? !(source[index] === "*" && source[index + 1] === "/") : !/[\r\n]/.test(source[index]))) {
        output += /[\r\n]/.test(source[index]) ? source[index] : " "; index++;
      }
      if (block) {
        if (index >= source.length) fail("JSON_UNTERMINATED_COMMENT", "Unterminated block comment", index - 1, source);
        output += "  "; index++;
      } else if (index < source.length) output += source[index];
      continue;
    }
    if (char === ",") {
      let cursor = index + 1;
      while (cursor < source.length && /\s/.test(source[cursor])) cursor++;
      if (source[cursor] === "}" || source[cursor] === "]") {
        if (!profile.trailingCommas) fail("JSON_TRAILING_COMMA_FORBIDDEN", "Trailing commas are not allowed by the selected JSON dialect", index, source);
        output += " "; continue;
      }
    }
    output += char;
  }
  if (inString) fail("JSON_SYNTAX_ERROR", "Unterminated JSON string", source.length - 1, source);
  return output;
}

function duplicateAwareParse(source) {
  const stack = [], seenByObject = [];
  let index = 0;
  const skip = () => { while (/\s/.test(source[index] || "")) index++; };
  const stringToken = () => {
    const start = index++;
    let escaped = false;
    while (index < source.length) {
      const char = source[index++];
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') return { start, raw: source.slice(start, index), value: JSON.parse(source.slice(start, index)) };
    }
    return null;
  };
  while (index < source.length) {
    skip(); const char = source[index];
    if (char === "{") { stack.push("object"); seenByObject.push(new Set()); index++; continue; }
    if (char === "[") { stack.push("array"); seenByObject.push(null); index++; continue; }
    if (char === "}" || char === "]") { stack.pop(); seenByObject.pop(); index++; continue; }
    if (char === '"') {
      const token = stringToken(); if (!token) break;
      skip();
      if (stack.at(-1) === "object" && source[index] === ":") {
        const seen = seenByObject.at(-1);
        if (seen.has(token.value)) fail("JSON_DUPLICATE_KEY", `Duplicate JSON object key: ${token.value}`, token.start, source);
        seen.add(token.value);
      }
      continue;
    }
    index++;
  }
  try { return JSON.parse(source); }
  catch (error) { throw new JsonDialectError("JSON_SYNTAX_ERROR", error.message); }
}

export function parseUiSource(source, { kind = "runtime", extension = ".json", dialect } = {}) {
  const selected = dialect || (extension.toLowerCase() === ".jsonc" ? "tooling-jsonc" : kind === "runtime" ? null : "strict-json");
  const profile = resolveProfile(selected);
  if (kind === "runtime" && profile.id === "tooling-jsonc") throw new JsonDialectError("TOOLING_JSONC_ONLY", "tooling-jsonc cannot validate a runtime pack file", { dialect: profile.id });
  return { document: duplicateAwareParse(sanitize(String(source), profile)), dialect: profile.id };
}

export async function readUiJson(path, options = {}) {
  return parseUiSource(await readFile(path, "utf8"), { extension: path.toLowerCase().endsWith(".jsonc") ? ".jsonc" : ".json", ...options });
}
