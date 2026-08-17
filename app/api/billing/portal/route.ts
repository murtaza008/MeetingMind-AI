import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireOrgRole, ADMIN_ROLES } from "@/lib/org";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { handleApiError } from "@/lib/handle-error";

const PortalInput = z.object({ orgId: z.string() });

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { orgId } = PortalInput.parse(await request.json());
    await requireOrgRole(userId, orgId, ADMIN_ROLES);

    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured (demo billing mode)." }, { status: 400 });
    }

    const org = await prisma.org.findUniqueOrThrow({ where: { id: orgId } });
    if (!org.stripeCustomerId) {
      return NextResponse.json({ error: "No billing account on file yet." }, { status: 400 });
    }

    const stripe = getStripe();
    const origin = request.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${origin}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
