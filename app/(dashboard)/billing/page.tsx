"use client";

import { Check, Loader2 } from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import { useCheckout, usePortal, useWorkspace, type OrgPlan } from "@/lib/hooks/use-org";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

// Plain display data — deliberately not imported from lib/plans.ts, which
// also holds server-only Stripe price-id lookups. Client components should
// never pull in modules that read non-NEXT_PUBLIC_ env vars.
const PLANS: { id: OrgPlan; name: string; price: number | null; tagline: string; features: string[] }[] = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    tagline: "For trying it on real meetings, with no card.",
    features: ["3 meetings per month", "1 workspace", "Transcripts and summaries", "Action items and decisions"],
  },
  {
    id: "TEAM",
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
  {
    id: "BUSINESS",
    name: "Business",
    price: 149,
    tagline: "For orgs that need retention, roles and control.",
    features: ["Everything in Team", "Roles and permissions", "Shareable read-only meeting links", "Priority support"],
  },
];

export default function BillingPage() {
  const { org, canAdmin } = useWorkspace();
  const checkout = useCheckout(org?.id);
  const portal = usePortal(org?.id);

  return (
    <AppShell title="Billing">
      <div className="mx-auto max-w-5xl px-5 py-8 md:px-8">
        <Reveal>
          <h1 className="font-display text-2xl">Plans that scale with you</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every plan includes transcripts, summaries, decisions and action items.
          </p>
        </Reveal>

        <Stagger className="mt-8 grid items-stretch gap-5 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = org?.plan === plan.id;
            const featured = plan.id === "TEAM";
            return (
              <StaggerItem key={plan.id} className="h-full">
                <div
                  className={
                    featured
                      ? "relative h-full rounded-2xl border-2 border-primary bg-card p-7 shadow-raise"
                      : "h-full rounded-2xl border border-border bg-card p-7"
                  }
                >
                  {featured && (
                    <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-primary-foreground">
                      Most teams
                    </span>
                  )}
                  <p className="mono text-[11px] uppercase tracking-widest text-muted-foreground">{plan.name}</p>
                  <p className="mt-3 text-4xl font-semibold tracking-tight">
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                    {plan.price !== 0 && <span className="ml-1 text-base font-normal text-muted-foreground">/mo</span>}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">{plan.tagline}</p>
                  <ul className="mt-7 space-y-3 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <div className="mt-8 flex w-full items-center justify-center rounded-md bg-success/12 px-4 py-2.5 text-sm font-medium text-success">
                      Current plan
                    </div>
                  ) : (
                    <button
                      disabled={!canAdmin || plan.id === "FREE" || checkout.isPending}
                      onClick={() => checkout.mutate(plan.id as Exclude<OrgPlan, "FREE">)}
                      className={
                        featured
                          ? "mt-8 inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                          : "mt-8 inline-flex w-full items-center justify-center rounded-md border border-border-strong px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
                      }
                    >
                      {checkout.isPending ? <Loader2 className="size-4 animate-spin" /> : plan.id === "FREE" ? "Downgrade in portal" : "Upgrade"}
                    </button>
                  )}
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <p className="mt-6 text-[12px] text-muted-foreground">
          Demo billing mode: with no Stripe keys configured, switching plans updates your organization
          directly — no card required anywhere.
        </p>

        {canAdmin && org && org.plan !== "FREE" && (
          <div className="mt-4">
            <button
              onClick={() => portal.mutate()}
              disabled={portal.isPending}
              className="text-sm font-medium text-primary hover:underline"
            >
              Manage billing & invoices →
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
