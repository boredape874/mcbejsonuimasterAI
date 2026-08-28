import { readFile } from "node:fs/promises";

export function stripJsonComments(source) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];

    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }

    if (char === "/" && next === "/") {
      output += "  ";
      index += 2;
      while (index < source.length && source[index] !== "\n" && source[index] !== "\r") {
        output += " ";
        index++;
      }
      if (index < source.length) output += source[index];
      continue;
    }

    if (char === "/" && next === "*") {
      output += "  ";
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) {
        output += source[index] === "\n" || source[index] === "\r" ? source[index] : " ";
        index++;
      }
      if (index < source.length) {
        output += "  ";
        index++;
      }
      continue;
    }

    output += char;
  }

  return output;
}

export function stripJsonTrailingCommas(source) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }
    if (char !== ",") {
      output += char;
      continue;
    }

    let cursor = index + 1;
    while (cursor < source.length && /\s/.test(source[cursor])) cursor++;
    output += source[cursor] === "}" || source[cursor] === "]" ? " " : char;
  }
  return output;
}

export async function readJsonc(path) {
  const source = await readFile(path, "utf8");
  return JSON.parse(stripJsonTrailingCommas(stripJsonComments(source)));
}
