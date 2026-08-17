import type { OrgPlan } from "@/lib/generated/prisma/enums";

export const FREE_MEETING_LIMIT = 3;

// Vercel's Node.js Serverless Functions hard-cap the request body at 4.5MB —
// a platform limit, not something raising this constant can work around.
// `VERCEL` is set automatically in every Vercel build/runtime, so the cap
// only tightens there; local dev and any non-Vercel Node host (Railway,
// Render, a VPS, your own server) keep the generous 20MB limit.
export const FREE_AUDIO_MAX_BYTES = process.env.VERCEL ? 4 * 1024 * 1024 : 20 * 1024 * 1024;

export const PLAN_PRICE_ENV: Record<Exclude<OrgPlan, "FREE">, string | undefined> = {
  TEAM: process.env.STRIPE_PRICE_TEAM,
  BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
};

export const PLAN_DETAILS: Record<
  OrgPlan,
  { name: string; price: number | null; tagline: string; features: string[] }
> = {
  FREE: {
    name: "Free",
    price: 0,
    tagline: "For trying it on real meetings, with no card.",
    features: [
      "3 meetings per month",
      "1 workspace",
      "Transcripts and summaries",
      "Action items and decisions",
    ],
  },
  TEAM: {
    name: "Team",
    price: 79,
    tagline: "For teams running recurring meetings across projects.",
    features: [
      "Unlimited meetings",
      "Unlimited workspaces",
      "Follow-up email drafts",
      "Cross-meeting action item board",
      "Priority processing",
    ],
  },
  BUSINESS: {
    name: "Business",
    price: 149,
    tagline: "For orgs that need retention, roles and control.",
    features: [
      "Everything in Team",
      "Roles and permissions",
      "Shareable read-only meeting links",
      "Priority support",
    ],
  },
};
