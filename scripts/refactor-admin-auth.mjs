// One-shot refactor: replace inlined `checkAuth` + `unauthorized` in admin/init-db
// routes with the shared `@/app/lib/adminAuth` helper.
//
// Usage: node scripts/refactor-admin-auth.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TARGETS = [
  "app/api/admin/analytics/route.ts",
  "app/api/admin/i18n-sync/route.ts",
  "app/api/admin/marketing-mode/route.ts",
  "app/api/admin/orders/refresh-smm/route.ts",
  "app/api/admin/orders/retry-smm/route.ts",
  "app/api/admin/orders/route.ts",
  "app/api/admin/orders/run-smm/route.ts",
  "app/api/admin/pricing-experiments/results/route.ts",
  "app/api/admin/pricing-experiments/route.ts",
  "app/api/admin/pricing/route.ts",
  "app/api/admin/smm/route.ts",
  "app/api/admin/smm/services/route.ts",
  "app/api/admin/support/route.ts",
  "app/api/admin/upsells/route.ts",
  "app/api/init-db/route.ts",
];

// Standard pattern (analytics, orders, pricing, smm, upsells, marketing-mode, ...):
//   function unauthorized() {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }
//
//   function checkAuth(req: NextRequest) {
//     const auth = req.headers.get("authorization");
//     return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
//   }
const STANDARD_BLOCK = /function unauthorized\(\)\s*\{\s*return NextResponse\.json\(\{\s*error:\s*"Unauthorized"\s*\},\s*\{\s*status:\s*401\s*\}\);\s*\}\s*function checkAuth\(req:\s*NextRequest\)\s*\{\s*const auth = req\.headers\.get\("authorization"\);\s*return auth === `Bearer \$\{process\.env\.ADMIN_PASSWORD\}`;\s*\}\s*/m;

// Variant in support/route.ts:
//   function checkAuth(req: NextRequest): boolean {
//     const auth = req.headers.get("authorization") || "";
//     const token = auth.replace("Bearer ", "");
//     return token === process.env.ADMIN_PASSWORD;
//   }
const SUPPORT_BLOCK = /function checkAuth\(req:\s*NextRequest\):\s*boolean\s*\{\s*const auth = req\.headers\.get\("authorization"\)\s*\|\|\s*""\s*;\s*const token = auth\.replace\("Bearer ",\s*""\);\s*return token === process\.env\.ADMIN_PASSWORD;\s*\}\s*/m;

// init-db pattern is identical to STANDARD's checkAuth but without unauthorized():
//   function checkAuth(req: NextRequest) {
//     const auth = req.headers.get("authorization");
//     return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
//   }
const INITDB_BLOCK = /function checkAuth\(req:\s*NextRequest\)\s*\{\s*const auth = req\.headers\.get\("authorization"\);\s*return auth === `Bearer \$\{process\.env\.ADMIN_PASSWORD\}`;\s*\}\s*/m;

const IMPORT_LINE = `import { isAdmin, unauthorized } from "@/app/lib/adminAuth";\n`;

function ensureImport(src) {
  if (src.includes(`from "@/app/lib/adminAuth"`)) return src;
  // Insert after the last top-level import.
  const importRegex = /^(import .+;\s*\n)+/m;
  const match = src.match(importRegex);
  if (!match) return IMPORT_LINE + src;
  const idx = match.index + match[0].length;
  return src.slice(0, idx) + IMPORT_LINE + src.slice(idx);
}

let totalChanged = 0;
const report = [];

for (const rel of TARGETS) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    report.push({ file: rel, status: "missing" });
    continue;
  }
  const original = fs.readFileSync(abs, "utf8");
  let next = original;
  let matched = false;

  if (STANDARD_BLOCK.test(next)) {
    next = next.replace(STANDARD_BLOCK, "");
    matched = true;
  } else if (SUPPORT_BLOCK.test(next)) {
    next = next.replace(SUPPORT_BLOCK, "");
    matched = true;
  } else if (INITDB_BLOCK.test(next)) {
    next = next.replace(INITDB_BLOCK, "");
    matched = true;
  }

  if (!matched) {
    report.push({ file: rel, status: "no-match" });
    continue;
  }

  next = next.replace(/checkAuth\(req\)/g, "isAdmin(req)");
  next = ensureImport(next);

  if (next !== original) {
    fs.writeFileSync(abs, next, "utf8");
    totalChanged += 1;
    report.push({ file: rel, status: "ok" });
  } else {
    report.push({ file: rel, status: "noop" });
  }
}

console.log(`Refactored ${totalChanged}/${TARGETS.length} files`);
for (const r of report) {
  console.log(`  [${r.status.padEnd(8)}] ${r.file}`);
}
