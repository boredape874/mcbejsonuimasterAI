function tokenize(source) {
  const tokens = [];
  const re = /\s*(?:(\d+(?:\.\d+)?)|(\$[A-Za-z_][\w.-]*|#[A-Za-z_][\w.-]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|\b(not|and|or|true|false)\b|(==|!=|<=|>=|&&|\|\||[=()+\-*/%<>!]))/iy;
  let at = 0;
  while (at < source.length) {
    re.lastIndex = at;
    const match = re.exec(source);
    if (!match) return null;
    tokens.push(match[1] ? { type: "number", value: Number(match[1]) }
      : match[2] ? { type: "name", value: match[2] }
      : match[3] ? { type: "string", value: decodeStringLiteral(match[3]) }
      : match[4] ? (["true", "false"].includes(match[4].toLowerCase()) ? { type: "boolean", value: match[4].toLowerCase() === "true" } : { type: "op", value: match[4].toLowerCase() })
      : { type: "op", value: match[5] });
    at = re.lastIndex;
  }
  return tokens;
}

function decodeStringLiteral(source) {
  if (source[0] === '"') return JSON.parse(source);
  const body = source.slice(1, -1)
    .replaceAll('"', '\\"')
    .replaceAll('\r', '\\r')
    .replaceAll('\n', '\\n')
    .replaceAll('\t', '\\t');
  return JSON.parse(`"${body}"`);
}

export function evaluateExpression(source, environment = {}, context = {}) {
  if (typeof source !== "string") return { ok: true, value: source, unresolved: [] };
  if (Object.hasOwn(environment, source)) return { ok: true, value: structuredClone(environment[source]), unresolved: [] };
  const tokens = tokenize(source.trim());
  if (!tokens) return unknown(source, context, "unsupported_syntax");
  let cursor = 0;
  const read = () => tokens[cursor];
  const primary = () => {
    const token = tokens[cursor++];
    if (!token) throw new Error("unexpected_end");
    if (token.type === "number" || token.type === "string" || token.type === "boolean") return token.value;
    if (token.type === "name") {
      if (!Object.hasOwn(environment, token.value)) throw new Error(`unknown_symbol:${token.value}`);
      return environment[token.value];
    }
    if (token.value === "(") { const value = or(); if (read()?.value !== ")") throw new Error("missing_paren"); cursor++; return value; }
    if (token.value === "-" || token.value === "!" || token.value === "not") { const value = primary(); return token.value === "-" ? -Number(value) : !value; }
    throw new Error(`unexpected_token:${token.value}`);
  };
  const binary = (next, ops, fn) => () => { let value = next(); while (ops.includes(read()?.value)) { const op = tokens[cursor++].value; value = fn(op, value, next()); } return value; };
  const mul = binary(primary, ["*", "/", "%"], (op, a, b) => {
    if (op === "*") {
      const format = typeof a === "string" ? /^%\.(\d+)s$/.exec(a) : null;
      if (format) return String(b ?? "").slice(0, Number(format[1]));
      return Number(a) * Number(b);
    }
    return op === "/" ? Number(a) / Number(b) : Number(a) % Number(b);
  });
  const add = binary(mul, ["+", "-"], (op, a, b) => op === "+" ? (typeof a === "string" || typeof b === "string" ? `${a}${b}` : Number(a) + Number(b)) : typeof a === "string" && typeof b === "string" ? a.replaceAll(b, "") : Number(a) - Number(b));
  const compare = binary(add, ["=", "==", "!=", "<", ">", "<=", ">="], (op, a, b) => ({ "=": a === b, "==": a === b, "!=": a !== b, "<": a < b, ">": a > b, "<=": a <= b, ">=": a >= b })[op]);
  const and = binary(compare, ["&&", "and"], (_op, a, b) => Boolean(a && b));
  const or = binary(and, ["||", "or"], (_op, a, b) => Boolean(a || b));
  try {
    const value = or();
    if (cursor !== tokens.length || !Number.isFinite(value) && typeof value === "number") throw new Error("invalid_result");
    return { ok: true, value, unresolved: [] };
  } catch (error) { return unknown(source, context, error.message); }
}

function unknown(source, context, reason) {
  return { ok: false, value: source, unresolved: [{ kind: "unresolved_expression", expression: source, reason, ...context }] };
}

export function materializeEnvironment(value, environment = {}, context = {}) {
  const unresolved = [];
  function visit(item, pointer, resolving = new Set()) {
    if (typeof item === "string" && item.startsWith("#")) return item;
    if (typeof item === "string" && pointer.includes("/bindings/")) return item;
    if (typeof item === "string" && (item.startsWith("$") || item.startsWith("#") || /^\s*\(.*\)\s*$/.test(item))) {
      const result = evaluateExpression(item, environment, { ...context, pointer });
      unresolved.push(...result.unresolved);
      if (result.ok && typeof result.value === "string" && result.value.startsWith("$") && result.value !== item && !resolving.has(item)) {
        const next = new Set(resolving); next.add(item);
        return visit(result.value, pointer, next);
      }
      return result.value;
    }
    if (Array.isArray(item)) return item.map((entry, index) => visit(entry, `${pointer}/${index}`, resolving));
    if (item && typeof item === "object") return Object.fromEntries(Object.entries(item).map(([key, entry]) => [key, visit(entry, `${pointer}/${escapePointer(key)}`, resolving)]));
    return item;
  }
  return { value: visit(value, context.pointer || ""), unresolved };
}

function escapePointer(value) { return value.replaceAll("~", "~0").replaceAll("/", "~1"); }
