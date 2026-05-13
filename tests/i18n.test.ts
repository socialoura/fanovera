import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { dictionaries } from "../app/i18n/dictionaries";
import { SUPPORTED_LOCALES } from "../app/i18n/types";

const MOJIBAKE_RE = /Ã.|Â.|â[\u0080-\u00ff]|ðŸ|&eacute;|caractÃ|dÃ©|CrÃ©/u;

function collectStrings(value: unknown, output: string[] = []) {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, output));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectStrings(item, output));
  return output;
}

function walkFiles(dir: string, output: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(fullPath, output);
    else if (/\.(ts|tsx|css|md|json)$/.test(entry.name)) output.push(fullPath);
  }
  return output;
}

describe("i18n dictionaries", () => {
  it("cover every supported locale", () => {
    expect(Object.keys(dictionaries).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it("do not contain empty strings or mojibake artifacts", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const strings = collectStrings(dictionaries[locale]);
      expect(strings.length).toBeGreaterThan(0);
      for (const value of strings) {
        expect(value.trim(), `${locale} has an empty translation`).not.toBe("");
        expect(value, `${locale} contains mojibake: ${value}`).not.toMatch(MOJIBAKE_RE);
      }
    }
  });

  it("keeps locale dictionaries structurally aligned", () => {
    const shape = Object.keys(dictionaries.fr).sort();
    for (const locale of SUPPORTED_LOCALES) {
      expect(Object.keys(dictionaries[locale]).sort()).toEqual(shape);
    }
  });
});

describe("source encoding", () => {
  it("does not ship mojibake in app source files", () => {
    const files = walkFiles(path.join(process.cwd(), "app"));
    const offenders = files.flatMap((file) => {
      const text = fs.readFileSync(file, "utf8");
      return text
        .split(/\r?\n/)
        .map((line, index) => ({ file, line, index: index + 1 }))
        .filter(({ line }) => MOJIBAKE_RE.test(line));
    });
    expect(offenders).toEqual([]);
  });
});
