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

// Heuristic FR/EN detector for the last client message. We bias toward EN when
// signals are mixed because the system prompt itself is in French and the model
// otherwise tends to default to French even on plain-English requests.
function detectReplyLanguage(text: string): "fr" | "en" {
  const sample = text.toLowerCase().slice(0, 1000);

  // French-only diacritics are a strong FR signal.
  if (/[àâçéèêëîïôùûœ]/i.test(sample)) return "fr";

  const tokenize = (s: string) => s.match(/[a-z']+/g) || [];
  const tokens = tokenize(sample);
  if (tokens.length === 0) return "en";

  const FR_WORDS = new Set([
    "le","la","les","un","une","des","du","de","et","ou","mais","donc","car",
    "je","tu","il","elle","nous","vous","ils","elles","mon","ma","mes","ton","ta","tes","son","sa","ses","votre","vos","notre","nos",
    "est","sont","ai","as","avons","avez","ont","suis","es","sommes","etes","etait","etaient",
    "pour","avec","sans","dans","sur","sous","chez","vers","par","entre",
    "pas","plus","tres","aussi","bien","ici","la","bonjour","bonsoir","salut","merci","cordialement",
    "ou","quand","pourquoi","comment","quoi","quel","quelle","quels","quelles",
    "commande","commandes","compte","remboursement","probleme","question","demande","reponse","jour","jours","heure","heures",
    "c'est","s'il","qu'est","j'ai","n'est","d'un","d'une","l'on","aujourd'hui",
  ]);
  const EN_WORDS = new Set([
    "the","a","an","and","or","but","so","because",
    "i","you","he","she","we","they","my","your","his","her","our","their",
    "is","are","am","was","were","be","been","being","have","has","had","do","does","did",
    "for","with","without","in","on","under","over","by","between","from","to","at",
    "not","more","very","also","well","here","there","hello","hi","hey","thanks","thank","please","regards",
    "where","when","why","how","what","which","who",
    "order","orders","account","refund","problem","question","request","answer","reply","day","days","hour","hours",
    "it's","i've","don't","can't","won't","didn't","haven't","you're","i'm",
  ]);

  let fr = 0;
  let en = 0;
  for (const t of tokens) {
    if (FR_WORDS.has(t)) fr++;
    if (EN_WORDS.has(t)) en++;
  }

  // Require a clear FR lead to flip to French (anti-bias against the FR-heavy system prompt).
  if (fr > en + 1) return "fr";
  return "en";
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
  const { id, additionalContext } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const guidance =
    typeof additionalContext === "string" && additionalContext.trim()
      ? additionalContext.trim().slice(0, 1000)
      : null;

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

  // Detect the language from the LAST client message in the thread, not the root,
  // since a thread can drift (e.g. client switched to English mid-conversation).
  const lastClientMessage = [...conversation].reverse().find((m) => m.from === "client")?.text || msg.message;
  const replyLanguage = detectReplyLanguage(lastClientMessage);

  const langBlock = replyLanguage === "en"
    ? [
        "MANDATORY OUTPUT LANGUAGE: ENGLISH.",
        "The client's last message is in English — the entire reply MUST be written in English.",
        "Start with 'Hello,' on its own line. End with an empty line then 'The Fanovera team'.",
        "Do NOT write any French word, even a greeting or signature. No mixing.",
      ].join("\n")
    : [
        "LANGUE DE SORTIE OBLIGATOIRE : FRANÇAIS.",
        "Le dernier message du client est en français — toute la réponse DOIT être en français.",
        "Commence par 'Bonjour,' sur sa propre ligne. Termine par une ligne vide puis 'L'équipe Fanovera'.",
        "N'écris aucun mot anglais, pas même une formule de salutation ou signature. Pas de mélange.",
      ].join("\n");

  const systemPrompt = [
    langBlock,
    "",
    "Tu es un agent de support client pour Fanovera, un panel SMM qui vend des followers, likes et vues sur Instagram, TikTok, YouTube, X, etc.",
    "Tu rédiges des brouillons de réponse email que l'admin va relire avant envoi.",
    "",
    "Règles strictes (s'appliquent quelle que soit la langue de sortie) :",
    "- Ton courtois, direct, sans formules marketing creuses.",
    "- Si une commande pertinente existe dans le contexte, référence-la précisément (numéro, plateforme, username, date).",
    "- Si le client demande où est sa commande : status 'delivered' = déjà livrée à la date X ; 'pending' ou 'processing' = en cours, délai habituel 24-72h selon volume.",
    "- Si le client demande un remboursement : reste factuel, demande des précisions (raison, capture d'écran) avant de promettre quoi que ce soit.",
    "- Si aucune commande trouvée et le client en réclame une : demande poliment plus d'infos (email utilisé pour payer, date approximative).",
    "- Pas de bullshit, pas de 'nous prenons votre demande très au sérieux'. Va droit au but.",
    "- Réponse concise : 2 à 5 phrases max, sauf si la question demande vraiment plus.",
    "- Si un champ 'admin_guidance' est fourni, suis ces instructions supplémentaires en plus des règles ci-dessus (ton, longueur, contenu spécifique à mentionner, etc.).",
    "- Retourne UNIQUEMENT le texte de la réponse, sans guillemets, sans markdown, sans préfixe.",
  ].join("\n");

  const noOrdersFallback = replyLanguage === "en"
    ? "No order found for this email."
    : "Aucune commande trouvée pour cet email.";

  const instructionText = replyLanguage === "en"
    ? (conversation.length > 1
        ? "Write the NEXT reply from the Fanovera team. Take the full history into account: do not repeat what has already been said, respond to the client's last message. Output in English only."
        : "Write the first reply from the Fanovera team to the client's message. Output in English only.")
    : (conversation.length > 1
        ? "Rédige la PROCHAINE réponse de l'équipe Fanovera. Tiens compte de tout l'historique : ne répète pas ce qui a déjà été dit, réponds au dernier message du client. Réponse en français uniquement."
        : "Rédige la première réponse de l'équipe Fanovera au message du client. Réponse en français uniquement.");

  const userPayload: Record<string, unknown> = {
    client_email: msg.email,
    reply_language: replyLanguage,
    conversation_history: conversation,
    instruction: instructionText,
    client_orders: orderContext.length > 0 ? orderContext : noOrdersFallback,
  };
  if (guidance) userPayload.admin_guidance = guidance;

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
