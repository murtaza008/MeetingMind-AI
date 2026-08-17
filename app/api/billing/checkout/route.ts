import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireOrgRole, ADMIN_ROLES } from "@/lib/org";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import { PLAN_PRICE_ENV } from "@/lib/plans";
import { handleApiError } from "@/lib/handle-error";

const CheckoutInput = z.object({
  orgId: z.string(),
  plan: z.enum(["TEAM", "BUSINESS"]),
});

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { orgId, plan } = CheckoutInput.parse(await request.json());
    await requireOrgRole(userId, orgId, ADMIN_ROLES);

    // Demo billing mode: no Stripe key configured, so switching plans just
    // writes straight to Postgres — no card, no external service, no cost.
    if (!isStripeConfigured()) {
      await prisma.org.update({ where: { id: orgId }, data: { plan } });
      return NextResponse.json({ demo: true });
    }

    const priceId = PLAN_PRICE_ENV[plan];
    if (!priceId) {
      return NextResponse.json({ error: `No Stripe price configured for ${plan}.` }, { status: 500 });
    }

    const stripe = getStripe();
    const org = await prisma.org.findUniqueOrThrow({ where: { id: orgId } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { orgId } });
      customerId = customer.id;
      await prisma.org.update({ where: { id: orgId }, data: { stripeCustomerId: customerId } });
    }

    const origin = request.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/billing?checkout=success`,
      cancel_url: `${origin}/billing?checkout=cancelled`,
      metadata: { orgId, plan },
      subscription_data: { metadata: { orgId, plan } },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
