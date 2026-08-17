import Stripe from "stripe";

/**
 * Demo billing mode: this project ships with no paid services wired up.
 * If STRIPE_SECRET_KEY is unset, upgrading a plan just flips it in Postgres
 * instantly (see app/api/billing/checkout/route.ts) — no checkout needed.
 * Fill in real Stripe test keys later and checkout switches on automatically.
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let _stripe: Stripe | null = null;

/** Throws if Stripe isn't configured — callers should check `isStripeConfigured()` first. */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured (STRIPE_SECRET_KEY is unset).");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}
