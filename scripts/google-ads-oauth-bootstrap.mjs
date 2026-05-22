#!/usr/bin/env node
/**
 * One-shot helper: completes the Google OAuth2 flow to mint a refresh token
 * for the Google Ads API. Run this ONCE on your local machine, then paste
 * the printed refresh token into GOOGLE_ADS_REFRESH_TOKEN in your `.env` /
 * Vercel env.
 *
 * Prereqs (all in Google Cloud Console for the same project that owns the
 * Manager Account):
 *   1. Enable "Google Ads API" on the project.
 *   2. Configure OAuth consent screen (External, Testing mode, add your own
 *      gmail as a test user).
 *   3. Create OAuth client ID, type = "Desktop app".
 *      Copy the client_id + client_secret into .env as:
 *        GOOGLE_ADS_CLIENT_ID=...
 *        GOOGLE_ADS_CLIENT_SECRET=...
 *
 * Then:
 *   node scripts/google-ads-oauth-bootstrap.mjs
 *
 * It opens your browser, you grant access to the same Google account that
 * owns the Ads Manager account, the callback fires on localhost:8765, and
 * the refresh token is printed in the terminal.
 */

import http from "node:http";
import crypto from "node:crypto";
import { exec } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SCOPE = "https://www.googleapis.com/auth/adwords";
const REDIRECT_PORT = 8765;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth/callback`;

// Load env without a dep — only reads GOOGLE_ADS_CLIENT_ID / SECRET.
// Follows Next.js precedence: .env.local wins over .env.
function loadEnv() {
  const candidates = [".env.local", ".env"];
  for (const file of candidates) {
    try {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
        if (!m) continue;
        const [, k, vRaw] = m;
        const v = vRaw.replace(/^["']|["']$/g, "");
        if (!process.env[k]) process.env[k] = v;
      }
    } catch {
      // file optional
    }
  }
}

loadEnv();
const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET in env or .env");
  process.exit(1);
}

const state = crypto.randomBytes(16).toString("hex");
const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline");
authUrl.searchParams.set("prompt", "consent");
authUrl.searchParams.set("state", state);

function openBrowser(url) {
  const cmd =
    process.platform === "win32"
      ? `start "" "${url}"`
      : process.platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

async function exchangeCode(code) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/oauth/callback")) {
    res.writeHead(404).end();
    return;
  }
  const u = new URL(req.url, `http://localhost:${REDIRECT_PORT}`);
  const code = u.searchParams.get("code");
  const returnedState = u.searchParams.get("state");
  if (returnedState !== state) {
    res.writeHead(400).end("Bad state");
    return;
  }
  if (!code) {
    res.writeHead(400).end("Missing code");
    return;
  }
  try {
    const tokens = await exchangeCode(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<html><body><h2>Refresh token captured.</h2><p>You can close this tab and return to the terminal.</p></body></html>");
    console.log("\n=== Google Ads OAuth — success ===\n");
    console.log("Paste this into your env:\n");
    console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("\n(Also confirm GOOGLE_ADS_CUSTOMER_ID and GOOGLE_ADS_LOGIN_CUSTOMER_ID are set — both are the numeric IDs without dashes.)");
    setTimeout(() => process.exit(0), 500);
  } catch (err) {
    res.writeHead(500).end(String(err));
    console.error(err);
    process.exit(1);
  }
});

server.listen(REDIRECT_PORT, () => {
  console.log(`Listening on ${REDIRECT_URI}`);
  console.log("Opening browser for Google login...");
  openBrowser(authUrl.toString());
  console.log("If the browser does not open, paste this URL manually:\n");
  console.log(authUrl.toString());
});
