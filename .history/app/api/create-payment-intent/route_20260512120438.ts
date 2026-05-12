import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { upsertCheckoutPayload } from "@/app/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // @ts-expect-error Stripe SDK version mismatch
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, email, username, platform, cart } = body;

    if (!amount || amount < 100) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency || "eur",
      metadata: {
        email: email || "",
        username: username || "",
        platform: platform || "",
      },
      automatic_payment_methods: { enabled: true },
    });

    try {
      await upsertCheckoutPayload({
        paymentIntentId: paymentIntent.id,
        email,
        username,
        platform,
        cart,
        amountCents: Math.round(amount),
        currency: currency || "eur",
      });
    } catch (payloadErr) {
      console.error("[create-payment-intent] checkout payload persist failed:", payloadErr);
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("[create-payment-intent]", err);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
