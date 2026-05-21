import { NextRequest, NextResponse } from "next/server";
import { getSupportMessageById, getOrdersByEmail, getSupportThreadReplies } from "@/app/lib/db";
import { isAdmin, unauthorized } from "@/app/lib/adminAuth";

type OrderRow = {
  id: number;
  username: string;
  platform: string;
  cart: unknown;
  total_cents: number;
  currency: string;
  status: string;
  lang: string;
  created_at: string;
  delivered_at: string | null;
  followers_before: number;
};

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

function summarizeOrder(o: OrderRow) {
  const total = (o.total_cents / 100).toFixed(2);
  const date = new Date(o.created_at).toISOString().slice(0, 10);
  const delivered = o.delivered_at ? new Date(o.delivered_at).toISOString().slice(0, 10) : null;
  return {
    id: o.id,
    date,
    platform: o.platform,
    username: o.username,
    cart: o.cart,
    total: `${total} ${o.currency?.toUpperCase() || "EUR"}`,
    status: o.status,
    delivered_at: delivered,
    followers_before: o.followers_before,
  };
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const msg = await getSupportMessageById(Number(id));
  if (!msg) {
    return NextResponse.json({ error: "message not found" }, { status: 404 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const orders = (await getOrdersByEmail(msg.email)) as OrderRow[];
  const orderContext = orders.map(summarizeOrder);

  // Load full conversation history (this thread's replies, oldest first)
  const replies = (await getSupportThreadReplies(Number(id))) as Array<{
    message: string;
    sender_type: "admin" | "client";
    created_at: string;
  }>;

  const conversation: Array<{ from: "client" | "admin"; at: string; text: string }> = [
    { from: "client", at: msg.created_at, text: msg.message },
    ...replies.map((r) => ({
      from: r.sender_type,
      at: r.created_at,
      text: r.message,
    })),
  ];

  const model = process.env.OPENAI_DRAFT_MODEL || process.env.OPENAI_TRANSLATION_MODEL || "gpt-4o-mini";

  const systemPrompt = [
    "Tu es un agent de support client pour Fanovera, un panel SMM qui vend des followers, likes et vues sur Instagram, TikTok, YouTube, X, etc.",
    "Tu rédiges des brouillons de réponse email que l'admin va relire avant envoi.",
    "",
    "Règles strictes :",
    "- Réponds dans la MÊME langue que le message du client. Français → réponse en français. Anglais → réponse en anglais. Jamais de mélange.",
    "- Ton courtois, direct, sans formules marketing creuses.",
    "- Commence par 'Bonjour,' (si FR) ou 'Hello,' (si EN) sur sa propre ligne.",
    "- Termine par une signature sur deux lignes : ligne vide + 'L'équipe Fanovera' (FR) ou 'The Fanovera team' (EN).",
    "- Si une commande pertinente existe dans le contexte, référence-la précisément (numéro, plateforme, username, date).",
    "- Si le client demande où est sa commande : status 'delivered' = déjà livrée à la date X ; 'pending' ou 'processing' = en cours, délai habituel 24-72h selon volume.",
    "- Si le client demande un remboursement : reste factuel, demande des précisions (raison, capture d'écran) avant de promettre quoi que ce soit.",
    "- Si aucune commande trouvée et le client en réclame une : demande poliment plus d'infos (email utilisé pour payer, date approximative).",
    "- Pas de bullshit, pas de 'nous prenons votre demande très au sérieux'. Va droit au but.",
    "- Réponse concise : 2 à 5 phrases max, sauf si la question demande vraiment plus.",
    "- Retourne UNIQUEMENT le texte de la réponse, sans guillemets, sans markdown, sans préfixe.",
  ].join("\n");

  const userPayload = {
    client_email: msg.email,
    conversation_history: conversation,
    instruction: conversation.length > 1
      ? "Rédige la PROCHAINE réponse de l'équipe Fanovera. Tiens compte de tout l'historique : ne répète pas ce qui a déjà été dit, réponds au dernier message du client."
      : "Rédige la première réponse de l'équipe Fanovera au message du client.",
    client_orders: orderContext.length > 0 ? orderContext : "Aucune commande trouvée pour cet email.",
  };

  try {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPayload) },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[admin/support/draft] OpenAI error:", res.status, detail.slice(0, 500));
      return NextResponse.json(
        { error: "OpenAI request failed", detail: detail.slice(0, 300) },
        { status: 502 },
      );
    }

    const data = (await res.json()) as Record<string, unknown>;
    const draft = extractResponseText(data).trim();

    if (!draft) {
      return NextResponse.json({ error: "Empty draft from OpenAI" }, { status: 502 });
    }

    return NextResponse.json({ draft, orderCount: orders.length });
  } catch (err) {
    console.error("[admin/support/draft] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate draft", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
