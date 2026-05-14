import { NextRequest, NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/app/lib/rateLimit";
import { createMagicLinkToken, isValidEmail, normalizeEmail } from "@/app/lib/accountAuth";
import { sendMagicLinkEmail } from "@/app/lib/email";

/**
 * POST /api/account/request-link
 * Body: { email: string, locale?: string }
 *
 * Issues a single-use magic link to the customer's email. Always returns 200
 * (even when the email shape is invalid in a way the rate limiter can't catch)
 * to avoid leaking whether an email exists. Errors are only surfaced for
 * obvious validation problems where there is no risk of enumeration.
 */
export async function POST(req: NextRequest) {
  // Tight rate limit: 5 attempts / 10 min / IP. Magic links cost an email send.
  const rl = rateLimit(req, { key: "account-request-link", max: 5, windowMs: 10 * 60_000 });
  if (!rl.allowed) return tooManyRequests(rl);

  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body?.email === "string" ? body.email : "";
    const locale = typeof body?.locale === "string" ? body.locale : "";

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const ua = req.headers.get("user-agent") || null;

    const token = await createMagicLinkToken({ email, ip, userAgent: ua });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const link = `${baseUrl.replace(/\/$/, "")}/api/account/verify?token=${token}`;

    // Fire-and-forget. Even when the upstream Resend call fails we keep a 200
    // here — the customer can always retry.
    sendMagicLinkEmail({ to: email, link, locale }).catch((err) => {
      console.error("[account/request-link] send error:", err);
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account/request-link] error:", err);
    // Surface as 200 ok=false so we never leak the failure mode to bots.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
