// One-off migration runner.
// Usage:  npx tsx --env-file=.env.local scripts/init-db.ts
import { initDb } from "../app/lib/db";

(async () => {
  console.log("Running initDb()...");
  try {
    await initDb();
    console.log("✓ Database migration completed");
    process.exit(0);
  } catch (err) {
    console.error("✗ Migration failed:", err);
    process.exit(1);
  }
})();
