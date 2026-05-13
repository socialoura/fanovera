import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_TRANSLATION_LANGUAGE_NAMES,
  ADMIN_TRANSLATION_TARGET_LOCALES,
  appendLocaleTranslations,
  filterTranslationsToMissing,
  findMissingLocaleTranslations,
  isAdminTranslationTargetLocale,
  type AdminTranslationTargetLocale,
  type LocaleMissingTranslations,
} from "@/app/lib/i18nAdminSync";

type OpenAiTranslationResponse = {
  exact?: Record<string, string>;
  fragments?: Record<string, string>;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

function localePath(locale: string) {
  return path.join(process.cwd(), "app", "i18n", "locales", `${locale}.ts`);
}

async function readLocaleFile(locale: string) {
  return fs.readFile(localePath(locale), "utf8");
}

function summarize(missing: LocaleMissingTranslations[]) {
  return {
    locales: missing.map((item) => ({
      locale: item.locale,
      exact: item.exact.length,
      fragments: item.fragments.length,
      total: item.exact.length + item.fragments.length,
      samples: [...item.exact, ...item.fragments].slice(0, 5).map((entry) => entry.source),
    })),
    total: missing.reduce((sum, item) => sum + item.exact.length + item.fragments.length, 0),
  };
}

async function getMissing(locales = ADMIN_TRANSLATION_TARGET_LOCALES) {
  const source = await readLocaleFile("en");
  const missing: LocaleMissingTranslations[] = [];

  for (const locale of locales) {
    const target = await readLocaleFile(locale);
    missing.push(findMissingLocaleTranslations(source, target, locale));
  }

  return missing;
}

function extractResponseText(data: Record<string, unknown>) {
  if (typeof data.output_text === "string") return data.output_text;

  const output = Array.isArray(data.output) ? data.output : [];
  const chunks: string[] = [];

  for (const item of output) {
    const content = Array.isArray((item as { content?: unknown }).content)
      ? (item as { content: Array<Record<string, unknown>> }).content
      : [];

    for (const part of content) {
      if (typeof part.text === "string") chunks.push(part.text);
    }
  }

  return chunks.join("").trim();
}

function parseTranslationJson(text: string): OpenAiTranslationResponse {
  const clean = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(clean) as OpenAiTranslationResponse;
}

async function translateMissing(locale: AdminTranslationTargetLocale, missing: LocaleMissingTranslations) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const exact = missing.exact.slice(0, 200);
  const fragments = missing.fragments.slice(0, 200);
  if (exact.length + fragments.length === 0) {
    return { exact: {}, fragments: {} };
  }

  const model = process.env.OPENAI_TRANSLATION_MODEL || "gpt-4o-mini";
  const language = ADMIN_TRANSLATION_LANGUAGE_NAMES[locale];

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are a professional product localization translator. Return only valid JSON. Preserve placeholders, numbers, brand names, punctuation intent, and HTML-like tokens. Do not translate object keys.",
        },
        {
          role: "user",
          content: JSON.stringify({
            task: `Translate Fanovera UI strings into ${language}.`,
            rules: [
              "Return JSON with exactly two objects: exact and fragments.",
              "Each object key must be the original source string.",
              "Each object value must be the translation.",
              "If the source has mojibake, infer the intended French when possible before translating.",
              "Keep Fanovera unchanged.",
              "Use concise UI wording.",
            ],
            exact,
            fragments,
          }),
        },
      ],
    }),
  });

  if (!res.ok) {
    const message = await res.text().catch(() => "");
    throw new Error(`OpenAI translation failed (${res.status}): ${message.slice(0, 300)}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const parsed = parseTranslationJson(extractResponseText(data));
  return filterTranslationsToMissing(missing, parsed);
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  try {
    const missing = await getMissing();
    return NextResponse.json(summarize(missing));
  } catch (error) {
    console.error("[admin/i18n-sync] GET error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) return unauthorized();

  try {
    const body = await req.json().catch(() => ({}));
    const requestedLocales = Array.isArray(body.locales)
      ? body.locales.filter((locale: unknown) => typeof locale === "string" && isAdminTranslationTargetLocale(locale))
      : ADMIN_TRANSLATION_TARGET_LOCALES;

    const locales = requestedLocales.length > 0 ? requestedLocales : ADMIN_TRANSLATION_TARGET_LOCALES;
    const before = await getMissing(locales);
    const translated: Array<{ locale: AdminTranslationTargetLocale; exact: number; fragments: number }> = [];

    for (const missing of before) {
      const translations = await translateMissing(missing.locale, missing);
      const exactCount = Object.keys(translations.exact).length;
      const fragmentCount = Object.keys(translations.fragments).length;

      if (exactCount + fragmentCount > 0) {
        const file = await readLocaleFile(missing.locale);
        await fs.writeFile(localePath(missing.locale), appendLocaleTranslations(file, translations), "utf8");
      }

      translated.push({ locale: missing.locale, exact: exactCount, fragments: fragmentCount });
    }

    const after = await getMissing(locales);
    return NextResponse.json({
      ok: true,
      before: summarize(before),
      after: summarize(after),
      translated,
    });
  } catch (error) {
    console.error("[admin/i18n-sync] POST error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
