/**
 * Email sending via Resend.
 *
 * Required env vars:
 *  - RESEND_API_KEY     — your Resend API key
 *  - RESEND_FROM        — sender (e.g. "Fanovera <noreply@fanovera.com>")
 *  - NEXT_PUBLIC_APP_URL — base URL for tracking links (e.g. "https://fanovera.com")
 */

import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY not set — emails disabled.");
    return null;
  }
  return new Resend(key);
}

export const RESEND_FROM = process.env.RESEND_FROM || process.env.EMAIL_FROM || "Fanovera <noreply@fanovera.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fanovera.com";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  spotify: "Spotify",
  twitch: "Twitch",
  twitter: "X",
  x: "X",
  linkedin: "LinkedIn",
};

const CURRENCY_SYMBOL: Record<string, string> = {
  eur: "€",
  usd: "$",
  gbp: "£",
  cad: "CA$",
  nzd: "NZ$",
  aud: "A$",
  chf: "CHF",
};

function fmtPrice(cents: number, currency = "eur"): string {
  const sym = CURRENCY_SYMBOL[currency.toLowerCase()] || "€";
  return `${(cents / 100).toFixed(2)} ${sym}`;
}

function fmtQty(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return String(n);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Order confirmation ──

export interface OrderConfirmationParams {
  to: string;
  orderId: number;
  username: string;
  platform: string;
  cart: Array<{
    service?: string;
    label?: string;
    qty?: number;
    quantity?: number;
    price?: number;
  }>;
  totalCents: number;
  currency?: string;
}

/**
 * Sends an order confirmation email to the customer.
 * Returns { ok: true } on success, { ok: false, error } on failure.
 * Never throws — emails are non-critical and shouldn't break checkout.
 */
export async function sendOrderConfirmation(
  params: OrderConfirmationParams,
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const resend = getResend();
  if (!resend) return { ok: false, error: "Resend not configured" };

  try {
    const html = renderOrderConfirmationHtml(params);
    const text = renderOrderConfirmationText(params);

    const result = await resend.emails.send({
      from: RESEND_FROM,
      to: params.to,
      subject: `Confirmation de commande #${params.orderId} — Fanovera`,
      html,
      text,
    });

    if (result.error) {
      console.error("[email] Resend error:", result.error);
      return { ok: false, error: result.error.message };
    }

    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error("[email] sendOrderConfirmation error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

// ── HTML template ──

function renderOrderConfirmationHtml(p: OrderConfirmationParams): string {
  const platformLabel = PLATFORM_LABEL[p.platform] || p.platform;
  const trackingUrl = `${APP_URL}/track/${p.orderId}`;
  const currency = p.currency || "eur";

  const itemsHtml = p.cart
    .map((it) => {
      const qty = it.qty || it.quantity || 0;
      const lbl = escapeHtml(it.label || it.service || "Service");
      const priceCell =
        it.price !== undefined
          ? `<td align="right" style="padding:12px 0;font-size:14px;color:#6b7280;">${it.price.toFixed(2)} €</td>`
          : "";
      return `
        <tr>
          <td style="padding:12px 0;font-size:14px;color:#111827;border-top:1px solid #e5e7eb;">
            <strong>${fmtQty(qty)}</strong> ${lbl}
          </td>
          ${priceCell ? priceCell.replace("padding:12px 0", "padding:12px 0;border-top:1px solid #e5e7eb") : ""}
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Confirmation de commande</title>
</head>
<body style="margin:0;padding:0;background:#f8f6f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f6f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <a href="${APP_URL}" style="text-decoration:none;display:inline-block;">
                <img src="${APP_URL}/fanovera-logo.png" alt="Fanovera" width="140" height="auto" style="display:block;height:auto;max-height:42px;border:0;outline:none;" />
              </a>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;padding:36px 32px;text-align:center;">
              <div style="font-size:44px;line-height:1;margin-bottom:12px;">🎉</div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#111827;letter-spacing:-0.02em;">
                Merci pour ta commande !
              </h1>
              <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.55;">
                Ta commande <strong style="color:#111827;">#${p.orderId}</strong> est confirmée. On la lance immédiatement.
              </p>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>

          <!-- Order details -->
          <tr>
            <td style="background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;padding:24px 28px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:14px;">
                Détail de la commande
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
                <tr>
                  <td style="font-size:14px;color:#6b7280;padding-bottom:6px;">Plateforme</td>
                  <td align="right" style="font-size:14px;font-weight:600;color:#111827;padding-bottom:6px;">${escapeHtml(platformLabel)}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#6b7280;padding-bottom:6px;">Compte</td>
                  <td align="right" style="font-size:14px;font-weight:600;color:#111827;padding-bottom:6px;">@${escapeHtml(p.username)}</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${itemsHtml}
                <tr>
                  <td style="padding:14px 0 0;border-top:2px solid #111827;font-size:15px;font-weight:700;color:#111827;">Total payé</td>
                  <td align="right" style="padding:14px 0 0;border-top:2px solid #111827;font-size:16px;font-weight:800;color:#111827;">
                    ${fmtPrice(p.totalCents, currency)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>

          <!-- Tracking CTA -->
          <tr>
            <td align="center" style="background:#ffffff;border-radius:18px;border:1px solid #e5e7eb;padding:28px 28px;">
              <div style="font-size:15px;color:#374151;margin-bottom:18px;line-height:1.55;">
                Tu peux suivre la livraison en temps réel ici :
              </div>
              <a href="${trackingUrl}"
                 style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 28px;border-radius:12px;">
                Suivre ma commande →
              </a>
              <div style="margin-top:14px;font-size:12px;color:#9ca3af;">
                ou copie ce lien : <a href="${trackingUrl}" style="color:#6b7280;">${trackingUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Spacer -->
          <tr><td style="height:24px;line-height:24px;font-size:0;">&nbsp;</td></tr>

          <!-- Steps -->
          <tr>
            <td style="padding:0 8px;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;margin-bottom:12px;">
                Et maintenant ?
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="top" style="font-size:14px;color:#374151;line-height:1.6;padding:6px 0;">
                    <strong style="color:#111827;">1.</strong> Activation immédiate (en moins de 60 secondes)
                  </td>
                </tr>
                <tr>
                  <td valign="top" style="font-size:14px;color:#374151;line-height:1.6;padding:6px 0;">
                    <strong style="color:#111827;">2.</strong> Livraison progressive pour un effet 100&nbsp;% naturel
                  </td>
                </tr>
                <tr>
                  <td valign="top" style="font-size:14px;color:#374151;line-height:1.6;padding:6px 0;">
                    <strong style="color:#111827;">3.</strong> Une question ? Réponds simplement à cet email — on est là.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 8px 0;border-top:1px solid #e5e7eb;margin-top:32px;">
              <div style="font-size:12px;color:#9ca3af;line-height:1.55;text-align:center;padding-top:24px;">
                Tu reçois cet email car tu as passé une commande sur Fanovera.<br>
                <a href="${APP_URL}" style="color:#6b7280;text-decoration:underline;">fanovera.com</a> · 17 rue de Paradis · 75010 Paris<br>
                © Fanovera SAS ${new Date().getFullYear()}
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Plain-text fallback ──

function renderOrderConfirmationText(p: OrderConfirmationParams): string {
  const platformLabel = PLATFORM_LABEL[p.platform] || p.platform;
  const trackingUrl = `${APP_URL}/track/${p.orderId}`;
  const currency = p.currency || "eur";

  const items = p.cart
    .map((it) => {
      const qty = it.qty || it.quantity || 0;
      const lbl = it.label || it.service || "Service";
      return `  • ${fmtQty(qty)} ${lbl}`;
    })
    .join("\n");

  return `Merci pour ta commande !

Ta commande #${p.orderId} est confirmée. On la lance immédiatement.

DÉTAIL
------
Plateforme : ${platformLabel}
Compte     : @${p.username}

${items}

Total payé : ${fmtPrice(p.totalCents, currency)}

SUIVI
-----
${trackingUrl}

Et maintenant ?
1. Activation immédiate (en moins de 60 secondes)
2. Livraison progressive pour un effet 100 % naturel
3. Une question ? Réponds à cet email — on est là.

—
Fanovera SAS · 17 rue de Paradis · 75010 Paris
${APP_URL}`;
}
