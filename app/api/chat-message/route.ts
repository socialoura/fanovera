import { NextRequest, NextResponse } from "next/server";
import { createSupportMessage } from "@/app/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = (body.email || "").trim();
  const message = (body.message || "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (!message || message.length < 3) {
    return NextResponse.json({ error: "Message trop court" }, { status: 400 });
  }

  const id = await createSupportMessage(email, message);

  // Send to Discord
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          embeds: [
            {
              title: "💬 Nouveau message support",
              color: 0x5260e6,
              fields: [
                { name: "Email", value: email, inline: true },
                { name: "Date", value: new Date().toLocaleString("fr-FR"), inline: true },
                { name: "Message", value: message.slice(0, 1000) },
              ],
              footer: { text: `ID: ${id}` },
            },
          ],
        }),
      });
    } catch (err) {
      console.error("[chat-message] Discord webhook error:", err);
    }
  }

  return NextResponse.json({ success: true, id });
}
