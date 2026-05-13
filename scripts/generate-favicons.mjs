/* eslint-disable no-console */
/**
 * Génère les favicons et icônes carrées à partir de public/fanovera-icon-source.png
 *
 * Sortie :
 *   - app/icon.png            (512x512, fond transparent) -> favicon principal Next.js
 *   - app/apple-icon.png      (180x180, fond blanc)       -> iOS / Apple touch icon
 *   - public/favicon-32.png   (32x32, fond transparent)   -> compat navigateurs
 *   - public/favicon-192.png  (192x192, fond transparent) -> manifest / Android
 *   - public/favicon-512.png  (512x512, fond transparent) -> manifest / haute résolution
 *
 * Usage : node scripts/generate-favicons.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SOURCE = resolve(ROOT, "public/fanovera-icon-source.png");

const TRANSPARENT_BG = { r: 0, g: 0, b: 0, alpha: 0 };
const WHITE_BG = { r: 255, g: 255, b: 255, alpha: 1 };
const PADDING_RATIO = 0.08; // 8% de marge intérieure

async function getTrimmedSource() {
  return await sharp(SOURCE)
    .ensureAlpha()
    .trim({ background: TRANSPARENT_BG, threshold: 5 })
    .toBuffer();
}

async function ensureDir(p) {
  await mkdir(dirname(p), { recursive: true });
}

async function generateSquare(size, outPath, trimmedBuffer, background = TRANSPARENT_BG) {
  const innerSize = Math.round(size * (1 - PADDING_RATIO * 2));
  const inner = await sharp(trimmedBuffer)
    .resize(innerSize, innerSize, { fit: "contain", background: TRANSPARENT_BG })
    .toBuffer();

  await ensureDir(outPath);
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: inner, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(outPath);

  console.log(`  generated ${outPath} (${size}x${size})`);
}

async function main() {
  console.log("Generating favicons from:", SOURCE);
  const trimmed = await getTrimmedSource();
  await Promise.all([
    generateSquare(512, resolve(ROOT, "app/icon.png"), trimmed),
    generateSquare(180, resolve(ROOT, "app/apple-icon.png"), trimmed, WHITE_BG),
    generateSquare(32, resolve(ROOT, "public/favicon-32.png"), trimmed),
    generateSquare(192, resolve(ROOT, "public/favicon-192.png"), trimmed),
    generateSquare(512, resolve(ROOT, "public/favicon-512.png"), trimmed),
  ]);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
