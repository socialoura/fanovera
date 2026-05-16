import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupportMessages, getSupportMessageById, replySupportMessage } from "@/app/lib/db";
import { RESEND_FROM } from "@/app/lib/email";

import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  const messages = await getSupportMessages();
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const body = await req.json();
  const { id, replyText } = body;

  if (!id || !replyText?.trim()) {
    return NextResponse.json({ error: "id and replyText required" }, { status: 400 });
  }

  const msg = await getSupportMessageById(Number(id));
  if (!msg) {
    return NextResponse.json({ error: "message not found" }, { status: 404 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  try {
    const resend = new Resend(resendKey);
    const result = await resend.emails.send({
      from: RESEND_FROM,
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
    });

    if (result.error) {
      console.error(
        "[admin/support] Resend error:",
        JSON.stringify(result.error),
        "| from =",
        JSON.stringify(RESEND_FROM),
      );
      return NextResponse.json(
        { error: "Failed to send email", detail: result.error.message, from: RESEND_FROM },
        { status: 502 },
      );
    }

    await replySupportMessage(Number(id), replyText.trim());

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(
      "[admin/support] Error:",
      err,
      "| from =",
      JSON.stringify(RESEND_FROM),
    );
    return NextResponse.json(
      { error: "Failed to send email", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
