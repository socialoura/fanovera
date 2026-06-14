// Detect TikTok customers who lost > THRESHOLD% of their expected followers.
//
//   node scripts/analyze-tiktok-follower-drops.mjs [SINCE=2026-06-12] [THRESHOLD=20]
//
// For each tt_followers order placed since SINCE:
//   expected = followers_before (snapshot at checkout) + ordered (qty + bonus)
//   current  = live followerCount via the same RapidAPI host the site uses
//   lost     = expected - current
// Flags when lost / expected  > THRESHOLD%  (also shows loss vs delivered qty).
// Dedupes to the most-recent order per username (its followers_before already
// reflects any earlier delivery, so we never double-count).
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const SINCE = process.argv[2] || "2026-06-12";
const THRESHOLD = Number(process.argv[3] || 20);

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const sql = neon(env.DATABASE_URL);
const RAPID_HOST = "tiktok-api23.p.rapidapi.com";
const RAPID_KEY = env.RAPIDAPI_KEY;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function liveFollowers(username) {
  const u = username.trim().toLowerCase().replace(/^@/, "");
  try {
    const res = await fetch(`https://${RAPID_HOST}/api/user/info?uniqueId=${encodeURIComponent(u)}`, {
      headers: { "x-rapidapi-host": RAPID_HOST, "x-rapidapi-key": RAPID_KEY },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 404) return { err: "not_found" };
    if (!res.ok) return { err: `http_${res.status}` };
    const j = await res.json();
    const user = j.userInfo?.user ?? j.user;
    const stats = j.userInfo?.stats ?? j.stats;
    if (!user) return { err: "not_found" };
    if (user.privateAccount) return { err: "private" };
    return { followers: Number(stats?.followerCount ?? 0) };
  } catch (e) {
    return { err: e.name === "TimeoutError" ? "timeout" : (e.message || "error") };
  }
}

// Latest tt_followers order per username since SINCE.
const rows = await sql`
  SELECT DISTINCT ON (LOWER(username))
         id, LOWER(username) AS username, followers_before, status, created_at, cart, email, total_cents, currency
  FROM orders
  WHERE platform = 'tiktok'
    AND created_at >= ${SINCE}
    AND status IN ('paid','processing','delivered','partial')
    AND cart::text LIKE '%tt_followers%'
  ORDER BY LOWER(username), created_at DESC`;

console.log(`Analyse: ${rows.length} comptes TikTok avec commande followers depuis le ${SINCE}. Seuil=${THRESHOLD}%\n`);

const orderedFollowers = (cart) => {
  const arr = Array.isArray(cart) ? cart : JSON.parse(cart || "[]");
  return arr.filter((i) => i.service === "tt_followers")
            .reduce((s, i) => s + Number(i.qty || i.quantity || 0) + Number(i.bonus || 0), 0);
};

const flagged = [], errors = [], ok = [];

for (const r of rows) {
  const ordered = orderedFollowers(r.cart);
  if (ordered <= 0) continue;
  const before = Number(r.followers_before || 0);
  const expected = before + ordered;

  const live = await liveFollowers(r.username);
  await sleep(350); // be gentle with RapidAPI rate limit

  if (live.err) { errors.push({ ...r, ordered, before, expected, reason: live.err }); continue; }

  const current = live.followers;
  const lost = expected - current;
  const pctVsExpected = (lost / expected) * 100;
  const pctVsOrdered = (lost / ordered) * 100;

  const rec = { id: r.id, username: r.username, email: r.email, before, ordered, expected,
                current, lost, pctVsExpected, pctVsOrdered, status: r.status,
                date: r.created_at.toISOString().slice(0, 10) };

  if (pctVsExpected > THRESHOLD) flagged.push(rec); else ok.push(rec);
}

flagged.sort((a, b) => b.pctVsExpected - a.pctVsExpected);

console.log(`========== ⚠️  ${flagged.length} COMPTES AVEC PERTE > ${THRESHOLD}% ==========`);
for (const f of flagged) {
  console.log(
    `@${f.username.padEnd(24)} #${String(f.id).padEnd(4)} ${f.date}  ` +
    `avant=${f.before}  commandé=${f.ordered}  attendu=${f.expected}  ` +
    `actuel=${f.current}  PERDU=${f.lost}  ` +
    `(-${f.pctVsExpected.toFixed(1)}% du total | -${f.pctVsOrdered.toFixed(0)}% du livré)  [${f.status}]`
  );
  console.log(`     ${f.email}`);
}

console.log(`\n========== ✅ ${ok.length} comptes OK (perte <= ${THRESHOLD}%) ==========`);
for (const f of ok.sort((a,b)=>b.pctVsExpected-a.pctVsExpected)) {
  console.log(`@${f.username.padEnd(24)} attendu=${f.expected} actuel=${f.current} (${f.pctVsExpected>0?"-":"+"}${Math.abs(f.pctVsExpected).toFixed(1)}%)`);
}

if (errors.length) {
  console.log(`\n========== ❓ ${errors.length} non vérifiables (API) ==========`);
  for (const e of errors) console.log(`@${e.username} #${e.id} — ${e.reason} (attendu ${e.expected})`);
}

const totalLost = flagged.reduce((s, f) => s + f.lost, 0);
console.log(`\nRésumé: ${flagged.length} comptes touchés, ${totalLost} followers perdus au total sur ce groupe.`);
