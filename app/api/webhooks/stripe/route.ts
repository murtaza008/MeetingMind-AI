import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

/** Keeps Org.plan in sync when a subscription is changed or cancelled directly in Stripe. */
export async function POST(request: Request) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhooks are not configured." }, { status: 400 });
  }

  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as { customer: string };
    await prisma.org
      .updateMany({
        where: { stripeCustomerId: subscription.customer },
        data: { plan: "FREE" },
      })
      .catch(() => undefined);
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const subscription = event.data.object as { customer: string; metadata?: { plan?: string } };
    const plan = subscription.metadata?.plan;
    if (plan === "TEAM" || plan === "BUSINESS") {
      await prisma.org
        .updateMany({
          where: { stripeCustomerId: subscription.customer },
          data: { plan },
        })
        .catch(() => undefined);
    }
  }

  return NextResponse.json({ received: true });
}
