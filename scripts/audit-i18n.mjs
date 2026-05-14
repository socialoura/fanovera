/**
 * Fanovera i18n audit script.
 *
 * Scans every copy-bearing source file in the repo and reports:
 *  - per-locale key counts and completeness % vs `fr` (source of truth)
 *  - locales relying on `deepTranslateCopy` / fallback to FR
 *  - dictionaries' `exact` / `fragments` sizes per locale
 *  - top hardcoded JSX strings without i18n (FR/EN words in .tsx)
 *
 * Run:  node scripts/audit-i18n.mjs
 * Outputs: console summary + writes docs/i18n-audit-report.md
 *
 * No deps. Uses the `typescript` package (already a devDep) to parse TS AST.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "app");

const LOCALES = ["fr", "en", "es", "pt", "de", "it", "tr"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSourceFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return {
    raw,
    ast: ts.createSourceFile(filePath, raw, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS),
  };
}

/**
 * Walk an ObjectLiteralExpression and return a flat map of "path.to.key" → string|null.
 * Non-string leaves are recorded as null (we still count their key).
 */
function flattenObjectLiteral(node, prefix = "") {
  const flat = {};
  if (!ts.isObjectLiteralExpression(node)) return flat;

  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const name = ts.isIdentifier(prop.name)
      ? prop.name.text
      : ts.isStringLiteral(prop.name)
        ? prop.name.text
        : null;
    if (!name) continue;
    const fullKey = prefix ? `${prefix}.${name}` : name;
    const v = prop.initializer;

    if (ts.isStringLiteral(v) || ts.isNoSubstitutionTemplateLiteral(v)) {
      flat[fullKey] = v.text;
    } else if (ts.isTemplateExpression(v)) {
      flat[fullKey] = "<template>";
    } else if (ts.isArrowFunction(v) || ts.isFunctionExpression(v)) {
      flat[fullKey] = "<fn>";
    } else if (ts.isArrayLiteralExpression(v)) {
      // Treat each element with index suffix.
      v.elements.forEach((el, i) => {
        const idxKey = `${fullKey}[${i}]`;
        if (ts.isStringLiteral(el) || ts.isNoSubstitutionTemplateLiteral(el)) {
          flat[idxKey] = el.text;
        } else if (ts.isObjectLiteralExpression(el)) {
          Object.assign(flat, flattenObjectLiteral(el, idxKey));
        } else {
          flat[idxKey] = null;
        }
      });
    } else if (ts.isObjectLiteralExpression(v)) {
      Object.assign(flat, flattenObjectLiteral(v, fullKey));
    } else {
      flat[fullKey] = null;
    }
  }
  return flat;
}

/**
 * Locate the first top-level VariableStatement whose name matches `varName`,
 * and return its initializer ObjectLiteralExpression (or null).
 */
function findExportedObject(ast, varName) {
  for (const stmt of ast.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (
        ts.isIdentifier(decl.name) &&
        decl.name.text === varName &&
        decl.initializer &&
        ts.isObjectLiteralExpression(decl.initializer)
      ) {
        return decl.initializer;
      }
    }
  }
  return null;
}

/**
 * For a Record<locale, T> literal like `{ fr: {...}, en: {...}, es: {...} }`,
 * returns { fr: flatMap, en: flatMap, ... } where each value is the flattened
 * leaves of that locale's object. Locales whose value is NOT an
 * ObjectLiteralExpression (e.g. `es: deepTranslateCopy(copy.fr, "es")`) are
 * flagged with `__machine: true`.
 */
function extractLocaleRecord(objNode) {
  const out = {};
  if (!objNode) return out;
  for (const prop of objNode.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const name = ts.isIdentifier(prop.name)
      ? prop.name.text
      : ts.isStringLiteral(prop.name)
        ? prop.name.text
        : null;
    if (!name || !LOCALES.includes(name)) continue;
    const v = prop.initializer;
    if (ts.isObjectLiteralExpression(v)) {
      out[name] = { __machine: false, flat: flattenObjectLiteral(v) };
    } else if (ts.isCallExpression(v) || ts.isPropertyAccessExpression(v) || ts.isIdentifier(v)) {
      out[name] = { __machine: true, flat: {} };
    } else {
      out[name] = { __machine: true, flat: {} };
    }
  }
  return out;
}

// ─── Auditors ─────────────────────────────────────────────────────────────────

function diffLocales(record, sourceLocale = "fr") {
  const source = record[sourceLocale];
  if (!source) return { error: `Missing source locale ${sourceLocale}` };

  const sourceKeys = new Set(Object.keys(source.flat));
  const result = {
    sourceLocale,
    sourceKeyCount: sourceKeys.size,
    locales: {},
  };

  for (const locale of LOCALES) {
    if (locale === sourceLocale) continue;
    const entry = record[locale];
    if (!entry) {
      result.locales[locale] = {
        present: false,
        machine: false,
        keyCount: 0,
        missingKeys: [...sourceKeys],
        identicalToSource: [],
        completeness: 0,
      };
      continue;
    }
    if (entry.__machine) {
      result.locales[locale] = {
        present: true,
        machine: true,
        keyCount: 0,
        missingKeys: [],
        identicalToSource: [],
        completeness: -1, // unknown (machine translated at runtime)
      };
      continue;
    }
    const localeKeys = new Set(Object.keys(entry.flat));
    const missing = [...sourceKeys].filter((k) => !localeKeys.has(k));
    const identical = [...sourceKeys].filter(
      (k) =>
        localeKeys.has(k) &&
        source.flat[k] !== null &&
        source.flat[k] === entry.flat[k] &&
        // Skip placeholders / non-translatable markers
        !/^[\s\d€$£%.\-_/]+$/.test(source.flat[k] || "") &&
        (source.flat[k] || "").length > 2,
    );
    result.locales[locale] = {
      present: true,
      machine: false,
      keyCount: localeKeys.size,
      missingKeys: missing,
      identicalToSource: identical,
      completeness: Math.round(((sourceKeys.size - missing.length) / sourceKeys.size) * 100),
    };
  }
  return result;
}

function auditFileCopyRecord(filePath, varName, opts = {}) {
  const { ast } = parseSourceFile(filePath);
  const obj = findExportedObject(ast, varName);
  if (!obj) return { file: filePath, varName, error: "Variable not found" };
  const record = extractLocaleRecord(obj);
  const presentLocales = Object.keys(record);
  if (presentLocales.length === 0) {
    return { file: filePath, varName, error: "No locale keys found" };
  }
  return {
    file: path.relative(ROOT, filePath).replace(/\\/g, "/"),
    varName,
    presentLocales,
    diff: diffLocales(record, opts.sourceLocale || "fr"),
  };
}

// ─── Per-file audits ──────────────────────────────────────────────────────────

const targets = [
  // For platform pages, `copy` only holds fr+en; `localized` is the
  // Record<SupportedLocale, T> that maps to the real runtime values
  // (with deepTranslateCopy for other locales). We audit BOTH:
  //  - `copy`     : measures human-translated locales (fr/en)
  //  - `localized`: measures runtime locale coverage (machine for others)
  { file: "app/components/publicCopy.ts", varName: "PUBLIC_COPY" },
  { file: "app/lib/email.ts", varName: "EMAIL_COPY" },
  { file: "app/instagram/i18n.ts", varName: "localized" },
  { file: "app/instagram/i18n.ts", varName: "copy" },
  { file: "app/tiktok/i18n.ts", varName: "localized" },
  { file: "app/tiktok/i18n.ts", varName: "copy" },
  { file: "app/youtube/i18n.ts", varName: "localized" },
  { file: "app/youtube/i18n.ts", varName: "copy" },
  { file: "app/spotify/i18n.ts", varName: "localized" },
  { file: "app/spotify/i18n.ts", varName: "copy" },
  { file: "app/twitch/i18n.ts", varName: "localized" },
  { file: "app/twitch/i18n.ts", varName: "copy" },
  { file: "app/facebook/i18n.ts", varName: "localized" },
  { file: "app/facebook/i18n.ts", varName: "copy" },
  { file: "app/linkedin/i18n.ts", varName: "localized" },
  { file: "app/linkedin/i18n.ts", varName: "copy" },
  { file: "app/twitter/i18n.ts", varName: "localized" },
  { file: "app/twitter/i18n.ts", varName: "copy" },
  { file: "app/contact/ContactClient.tsx", varName: "COPY" },
  { file: "app/track/TrackLookupClient.tsx", varName: "COPY" },
];

const fileResults = [];
for (const t of targets) {
  const abs = path.join(ROOT, t.file);
  if (!fs.existsSync(abs)) {
    fileResults.push({ file: t.file, varName: t.varName, error: "File not found" });
    continue;
  }
  fileResults.push(auditFileCopyRecord(abs, t.varName, t));
}

// ─── Locale dictionary audit (app/i18n/locales/*.ts) ──────────────────────────

function auditLocaleDictionaries() {
  const dir = path.join(APP, "i18n", "locales");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts"));
  const summary = {};
  for (const f of files) {
    const code = f.replace(".ts", "");
    const { ast } = parseSourceFile(path.join(dir, f));
    let exactCount = 0;
    let fragmentCount = 0;
    let hasFullStructure = false;

    function walk(node) {
      if (ts.isVariableStatement(node)) {
        for (const decl of node.declarationList.declarations) {
          if (decl.initializer && ts.isObjectLiteralExpression(decl.initializer)) {
            for (const p of decl.initializer.properties) {
              if (!ts.isPropertyAssignment(p)) continue;
              const name = p.name && ts.isIdentifier(p.name) ? p.name.text : null;
              if (name === "exact" && ts.isObjectLiteralExpression(p.initializer)) {
                exactCount = p.initializer.properties.length;
                hasFullStructure = true;
              }
              if (name === "fragments" && ts.isArrayLiteralExpression(p.initializer)) {
                fragmentCount = p.initializer.elements.length;
                hasFullStructure = true;
              }
            }
          }
        }
      }
      ts.forEachChild(node, walk);
    }
    walk(ast);

    summary[code] = {
      file: `app/i18n/locales/${f}`,
      exactCount,
      fragmentCount,
      totalEntries: exactCount + fragmentCount,
      bytes: fs.statSync(path.join(dir, f)).size,
      // de/it/tr extend `en` via spread (...en); their counts are local-only additions.
      extendsEn: fs.readFileSync(path.join(dir, f), "utf8").includes("...en"),
      hasFullStructure,
    };
  }
  return summary;
}

const dictResults = auditLocaleDictionaries();

// ─── Hardcoded JSX strings ────────────────────────────────────────────────────

function walkDir(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip admin (gated) and i18n (defines the system).
      if (full.includes(`${path.sep}admin${path.sep}`)) continue;
      if (full.includes(`${path.sep}i18n${path.sep}`)) continue;
      walkDir(full, out);
    } else if (entry.name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

// Matches FR-only words (length > 3) or EN words in JSX text nodes / attrs.
const FR_HARDCODED_WORDS = /\b(et|avec|pour|votre|notre|nos|votre|sans|cette|tous|toutes|merci|aujourd'hui|paiement|commande|abonnés|livraison|sécurisé|confiance|réseaux|essai|gratuit|continuer|retour)\b/i;
const EN_HARDCODED_WORDS = /\b(start|continue|order|payment|track|home|secure|loading|view|here|reviews|followers|delivery|tracking)\b/i;

function findHardcodedStrings() {
  const files = walkDir(APP);
  const hits = [];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    // JSX text nodes between `>` and `<`, length 5+
    const jsxTextRe = />\s*([A-ZÀ-ÿa-z][^<>{}\n]{4,}?)\s*</g;
    // Common attribute strings
    const attrRe = /(?:placeholder|alt|aria-label|title)\s*=\s*"([^"\n]{5,})"/g;
    let m;
    while ((m = jsxTextRe.exec(text))) {
      const value = m[1].trim();
      if (value.length < 5) continue;
      if (/^[\s\d€$£%./\-_]+$/.test(value)) continue;
      if (!FR_HARDCODED_WORDS.test(value) && !EN_HARDCODED_WORDS.test(value)) continue;
      // Skip URL-like
      if (/https?:\/\//.test(value)) continue;
      // Skip pure SVG attribute fragments (heuristic)
      if (/^M\s?\d|^L\s?\d|stroke|fill=/.test(value)) continue;
      hits.push({ file: path.relative(ROOT, file).replace(/\\/g, "/"), kind: "jsx", value });
    }
    while ((m = attrRe.exec(text))) {
      const value = m[1].trim();
      if (!FR_HARDCODED_WORDS.test(value) && !EN_HARDCODED_WORDS.test(value)) continue;
      if (/^https?:\/\//.test(value)) continue;
      hits.push({ file: path.relative(ROOT, file).replace(/\\/g, "/"), kind: "attr", value });
    }
  }
  return hits;
}

const hardcoded = findHardcodedStrings();

// ─── Reporting ────────────────────────────────────────────────────────────────

function pct(n) {
  return n < 0 ? "(machine)" : `${n}%`;
}

const lines = [];
lines.push("# Audit i18n Fanovera — rapport automatique");
lines.push("");
lines.push(`Généré le ${new Date().toISOString()}`);
lines.push("");
lines.push("## 1. Dictionnaire global `app/i18n/locales/*.ts`");
lines.push("");
lines.push("| Locale | Fichier | `exact` | `fragments` | Total | Hérite de EN | Taille |");
lines.push("|---|---|---:|---:|---:|---|---:|");
for (const loc of LOCALES) {
  const d = dictResults[loc];
  if (!d) continue;
  lines.push(
    `| ${loc} | \`${d.file}\` | ${d.exactCount} | ${d.fragmentCount} | ${d.totalEntries} | ${d.extendsEn ? "✅" : "❌"} | ${d.bytes} o |`,
  );
}
lines.push("");
lines.push(
  "> Note : `fr` est la **source de vérité** (texte original dans les composants). Les autres locales fournissent un mapping `exact` (phrase→phrase) ou `fragments` (sub-string→sub-string) utilisé par `translateVisibleText()`. Plus le total est bas, plus le texte FR fuit côté client.",
);
lines.push("");

lines.push("## 2. Per-file copy records");
lines.push("");
for (const r of fileResults) {
  if (r.error) {
    lines.push(`### \`${r.file || r.varName}\` — ⚠️ ${r.error}`);
    lines.push("");
    continue;
  }
  lines.push(`### \`${r.file}\` · variable \`${r.varName}\``);
  lines.push("");
  lines.push(`Locales présentes : ${r.presentLocales.map((l) => `\`${l}\``).join(", ")}`);
  lines.push(
    `Locales **absentes** (fallback runtime FR si pas géré) : ${LOCALES.filter((l) => !r.presentLocales.includes(l))
      .map((l) => `\`${l}\``)
      .join(", ") || "—"}`,
  );
  lines.push("");
  if (r.diff && r.diff.sourceKeyCount) {
    lines.push(`Source : **${r.diff.sourceLocale}** · **${r.diff.sourceKeyCount}** clés de texte`);
    lines.push("");
    lines.push("| Locale | Mode | Clés présentes | Manquantes | Identiques à la source | Complétude |");
    lines.push("|---|---|---:|---:|---:|---:|");
    for (const loc of LOCALES) {
      if (loc === r.diff.sourceLocale) continue;
      const info = r.diff.locales[loc];
      if (!info) continue;
      lines.push(
        `| \`${loc}\` | ${info.machine ? "machine" : info.present ? "humain" : "absent"} | ${info.keyCount} | ${info.missingKeys.length} | ${info.identicalToSource.length} | ${pct(info.completeness)} |`,
      );
    }
    lines.push("");

    // Identical to source warning (top 5 by locale)
    const flagged = [];
    for (const loc of LOCALES) {
      const info = r.diff.locales[loc];
      if (!info || info.machine || info.identicalToSource.length === 0) continue;
      flagged.push(
        `- **${loc}** : ${info.identicalToSource.length} valeurs identiques à \`${r.diff.sourceLocale}\` (exemples : ${info.identicalToSource
          .slice(0, 3)
          .map((k) => `\`${k}\``)
          .join(", ")})`,
      );
    }
    if (flagged.length) {
      lines.push("**Valeurs identiques à la source (BLOCKER si caractères français)** :");
      lines.push("");
      lines.push(...flagged);
      lines.push("");
    }
  }
}

lines.push("## 3. Chaînes hardcodées dans le JSX (hors admin et i18n)");
lines.push("");
lines.push(`Total détecté : **${hardcoded.length}**`);
lines.push("");
const byFile = {};
for (const h of hardcoded) {
  (byFile[h.file] = byFile[h.file] || []).push(h);
}
const filesSorted = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length);
lines.push("| Fichier | Occurrences | Exemples |");
lines.push("|---|---:|---|");
for (const [file, hits] of filesSorted.slice(0, 30)) {
  const examples = hits
    .slice(0, 3)
    .map((h) => `_${h.value.slice(0, 60).replace(/\|/g, "\\|")}_`)
    .join(" / ");
  lines.push(`| \`${file}\` | ${hits.length} | ${examples} |`);
}
lines.push("");

// ─── Summary ──────────────────────────────────────────────────────────────────

const summary = {
  dictResults,
  fileResults: fileResults.map((r) =>
    r.error
      ? { file: r.file, error: r.error }
      : {
          file: r.file,
          present: r.presentLocales,
          missingLocales: LOCALES.filter((l) => !r.presentLocales.includes(l)),
          sourceLocale: r.diff?.sourceLocale,
          sourceKeyCount: r.diff?.sourceKeyCount,
          completeness: Object.fromEntries(
            LOCALES.filter((l) => l !== r.diff?.sourceLocale).map((l) => [
              l,
              r.diff?.locales?.[l]?.completeness ?? null,
            ]),
          ),
        },
  ),
  hardcodedCount: hardcoded.length,
  hardcodedTopFiles: filesSorted.slice(0, 10).map(([file, hits]) => ({ file, count: hits.length })),
};

const reportPath = path.join(ROOT, "docs", "i18n-audit-report.md");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, lines.join("\n"), "utf8");

const jsonPath = path.join(ROOT, "docs", "i18n-audit-report.json");
fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), "utf8");

// ─── Console summary ──────────────────────────────────────────────────────────

console.log("\n=== Fanovera i18n audit ===\n");
console.log("Dictionnaire global (app/i18n/locales/):");
for (const loc of LOCALES) {
  const d = dictResults[loc];
  if (!d) continue;
  console.log(
    `  ${loc.padEnd(3)} | exact: ${String(d.exactCount).padStart(3)} | fragments: ${String(d.fragmentCount).padStart(3)} | hérite EN: ${d.extendsEn ? "oui" : "non"}`,
  );
}
console.log("");
console.log("Copy records per file:");
for (const r of fileResults) {
  if (r.error) {
    console.log(`  ⚠ ${r.file || r.varName}: ${r.error}`);
    continue;
  }
  const missing = LOCALES.filter((l) => !r.presentLocales.includes(l));
  console.log(`  ${r.file.padEnd(60)} present=[${r.presentLocales.join(",")}] missing=[${missing.join(",") || "—"}]`);
  if (r.diff) {
    for (const loc of LOCALES) {
      if (loc === r.diff.sourceLocale) continue;
      const info = r.diff.locales[loc];
      if (!info) continue;
      const tag = info.machine
        ? "MACHINE"
        : info.present
          ? `${info.completeness}%`
          : "ABSENT";
      console.log(
        `      ${loc} → ${tag.padEnd(8)} miss=${info.missingKeys.length} sameAsSrc=${info.identicalToSource.length}`,
      );
    }
  }
}
console.log("");
console.log(`Chaînes hardcodées détectées dans JSX: ${hardcoded.length}`);
console.log("Top 5 fichiers avec hardcoded:");
for (const [file, hits] of filesSorted.slice(0, 5)) {
  console.log(`  ${file}: ${hits.length}`);
}

console.log("");
console.log(`Rapport Markdown : ${path.relative(ROOT, reportPath)}`);
console.log(`Rapport JSON     : ${path.relative(ROOT, jsonPath)}`);
