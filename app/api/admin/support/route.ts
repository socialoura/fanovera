import { NextRequest, NextResponse } from "next/server";
import { getSupportMessages, getSupportMessageById, replySupportMessage } from "@/app/lib/db";

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  return token === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const messages = await getSupportMessages();
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, replyText } = body;

  if (!id || !replyText?.trim()) {
    return NextResponse.json({ error: "id and replyText required" }, { status: 400 });
  }

  const msg = await getSupportMessageById(Number(id));
  if (!msg) {
    return NextResponse.json({ error: "message not found" }, { status: 404 });
  }

  // Send reply via Resend
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Fanovera Support <support@fanovera.com>",
        to: msg.email,
        subject: "Réponse à votre demande — Fanovera",
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #1a1a2e; margin: 0 0 16px;">Bonjour,</h2>
            <p style="color: #444; line-height: 1.6; margin: 0 0 20px;">
              Merci pour votre message. Voici notre réponse :
            </p>
            <div style="background: #f8f9fa; border-left: 3px solid #5260e6; padding: 16px; border-radius: 8px; margin: 0 0 20px;">
              <p style="margin: 0; color: #1a1a2e; line-height: 1.6;">${replyText.trim().replace(/\n/g, "<br>")}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #999; margin: 0;">
              — L'équipe Fanovera
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[admin/support] Resend error:", err);
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
    }

    await replySupportMessage(Number(id), replyText.trim());

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[admin/support] Error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
