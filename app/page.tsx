import Link from "next/link";
import {
  ArrowRight,
  Check,
  Mic,
  ListChecks,
  Gavel,
  Upload,
  Sparkles,
  Send,
  Search,
  Shield,
  Clock,
  Users,
  FileText,
  CalendarCheck,
  Lock,
} from "lucide-react";
import { ProductMock } from "@/components/landing/ProductMock";
import { ThemeToggle } from "@/components/theme-toggle";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

const STATS = [
  { value: "18 min", label: "average time saved per meeting" },
  { value: "97%", label: "transcript accuracy on clear audio" },
  { value: "< 2 min", label: "from upload to full summary" },
  { value: "0", label: "action items quietly forgotten" },
];

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "Record or upload",
    body: "Hit record in the browser or drop an existing MP3, WAV or M4A. Audio is stored privately, scoped to your organization.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Gemini reads it",
    body: "One model call transcribes, labels speakers, and pulls out topics, decisions and commitments — nothing invented.",
  },
  {
    icon: Send,
    step: "03",
    title: "Send the follow-up",
    body: "A drafted recap email, an assignable action list and a shareable read-only link, ready before people leave the call.",
  },
];

const FEATURES = [
  {
    icon: Mic,
    title: "A transcript you can read",
    body: "Speaker-labelled and timestamped, monospaced for fast scanning through a long call.",
  },
  {
    icon: Gavel,
    title: "Decisions, logged",
    body: "Every decision that was actually made, with the context around it. No inferred commitments, no invented owners.",
  },
  {
    icon: ListChecks,
    title: "Action items with owners",
    body: "Extracted, assignable, due-dateable and aggregated into one cross-meeting view so nothing quietly expires.",
  },
];

const CAPABILITIES = [
  {
    icon: Search,
    title: "Search every meeting",
    body: "Find the sentence where a budget was approved across months of calls, not just the last one.",
  },
  {
    icon: Users,
    title: "Workspaces per team",
    body: "Keep product, sales and leadership meetings separate, with roles controlling who sees what.",
  },
  {
    icon: FileText,
    title: "Export anywhere",
    body: "Plain-text transcripts and copy-ready follow-up emails for your existing tools.",
  },
  {
    icon: CalendarCheck,
    title: "Due dates and owners",
    body: "Every action item carries an owner and a date, aggregated into one board across all meetings.",
  },
  {
    icon: Clock,
    title: "Timestamped transcript",
    body: "Every line is timestamped, speaker-labelled and easy to scan back through.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Org-scoped access on every query. Your audio is never used to train a model.",
  },
];

const USE_CASES = [
  {
    title: "Product teams",
    body: "Standups and planning turn into a decision log the whole team can search, so scope debates only happen once.",
  },
  {
    title: "Client services",
    body: "Every client call ends with a recap email and a task list, sent the same hour instead of the next day.",
  },
  {
    title: "Leadership",
    body: "Weekly business reviews produce a consistent record of what was decided, and what did not get done.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We stopped keeping two sets of notes. The decision log is now the source of truth for anything contested.",
    name: "Priya Raman",
    role: "Head of Product, Northbeam",
  },
  {
    quote:
      "The follow-up email draft is the part nobody expected to love. Client recaps go out before the call finishes.",
    name: "Marcus Hale",
    role: "Director of Delivery, Ordway",
  },
  {
    quote: "Action items used to die in someone's notebook. Now they show up on one board with a name and a date.",
    name: "Dana Whitmore",
    role: "COO, Fieldline",
  },
];

const FAQS = [
  {
    q: "What audio does it accept?",
    a: "Record directly in the browser, or upload MP3, WAV, M4A and most common formats. Longer recordings just take a little longer to process.",
  },
  {
    q: "Does it invent action items?",
    a: "No. The extraction pass is deliberately conservative — it only logs commitments and decisions that were actually spoken.",
  },
  {
    q: "Who can see our recordings?",
    a: "Only members of your organization, or anyone you explicitly send a read-only share link to. Audio is never used for model training.",
  },
  {
    q: "Is the free plan really free?",
    a: "Yes. The Free plan is $0 forever with 3 meetings a month, no card required. Upgrade only when your team outgrows it.",
  },
];

const TIERS = [
  {
    name: "Free",
    price: 0,
    blurb: "For trying it on real meetings, with no card.",
    features: ["3 meetings per month", "1 workspace", "Transcripts and summaries", "Action items and decisions"],
  },
  {
    name: "Team",
    price: 79,
    blurb: "For teams running recurring meetings across projects.",
    features: [
      "Unlimited meetings",
      "Unlimited workspaces",
      "Follow-up email drafts",
      "Cross-meeting action item board",
      "Priority processing",
    ],
    featured: true,
  },
  {
    name: "Business",
    price: 149,
    blurb: "For orgs that need retention, roles and control.",
    features: [
      "Everything in Team",
      "Roles and permissions",
      "Shareable read-only meeting links",
      "Priority support",
    ],
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-[5px] bg-primary">
              <Mic className="size-3.5 text-primary-foreground" strokeWidth={2.25} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">MeetingMind</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Link href="/login" className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-5 pt-20 pb-14 text-center md:pt-28">
          <Reveal>
            <p className="text-eyebrow">Meeting intelligence for teams</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto mt-5 max-w-4xl text-[2.7rem] font-display font-semibold leading-[1.06] tracking-tight text-foreground md:text-6xl">
              Turn every meeting into <span className="text-primary">measurable momentum.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
              MeetingMind records or ingests your meeting audio and returns a speaker-labelled
              transcript, a factual summary, the decisions that were made, and action items with
              owners — searchable across every meeting your team has ever run.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-panel hover:-translate-y-0.5 hover:shadow-raise"
              >
                Start free
                <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-border-strong bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
              >
                Sign in
              </Link>
            </div>
          </Reveal>
          <p className="mt-4 font-mono text-xs text-muted-foreground">No card required · 3 meetings on the free tier</p>

          <Reveal delay={0.2} y={24} className="mt-14 text-left">
            <ProductMock />
          </Reveal>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-surface">
          <Stagger className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden px-5 py-10 md:grid-cols-4">
            {STATS.map((s) => (
              <StaggerItem key={s.label} className="px-4 py-3 text-center">
                <p className="font-display text-3xl font-semibold tracking-tight text-foreground">{s.value}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.label}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Steps */}
        <section id="how" className="mx-auto max-w-6xl px-5 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow">How it works</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Three steps, no note-taker required
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">From raw audio to a sent follow-up in under two minutes.</p>
          </Reveal>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <StaggerItem key={s.title}>
                <div className="lift relative h-full rounded-2xl border border-border bg-card p-8 shadow-panel hover:border-primary/40">
                  <span className="absolute right-6 top-6 font-mono text-xs text-muted-foreground/60">{s.step}</span>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-surface">
                    <s.icon className="size-5 text-primary" strokeWidth={2} />
                  </span>
                  <h3 className="mt-6 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Feature grid */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Engineered for clarity</h2>
              <p className="mt-3 text-sm text-muted-foreground">Precision intelligence for fast-moving teams.</p>
            </Reveal>

            <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
              {FEATURES.map((f) => (
                <StaggerItem key={f.title}>
                  <div className="lift h-full rounded-2xl border border-border bg-card p-8 shadow-panel hover:border-primary/40">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-background">
                      <f.icon className="size-5 text-primary" strokeWidth={2} />
                    </span>
                    <h3 className="mt-6 text-xl font-semibold tracking-tight">{f.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Capabilities */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow">Everything included</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              The details that make it usable daily
            </h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <StaggerItem key={c.title}>
                <div className="lift h-full rounded-xl border border-border bg-card p-6 hover:border-primary/40">
                  <c.icon className="size-5 text-primary" strokeWidth={2} />
                  <h3 className="mt-4 text-base font-semibold tracking-tight">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Use cases */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center">
              <Reveal>
                <p className="text-eyebrow">Who it&apos;s for</p>
                <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  Built for the meetings that decide things
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  MeetingMind is not a note-taker for webinars. It is for the recurring calls where
                  scope, budget and ownership get settled — and where forgetting one sentence costs a
                  week.
                </p>
                <Link href="/signup" className="group mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                  Start with the free plan
                  <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </Reveal>
              <Stagger className="grid gap-4">
                {USE_CASES.map((u) => (
                  <StaggerItem key={u.title}>
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h3 className="text-base font-semibold tracking-tight">{u.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{u.body}</p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Teams that stopped taking notes
            </h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <StaggerItem key={t.name}>
                <figure className="lift flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-panel">
                  <blockquote className="flex-1 text-[15px] leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
                  <figcaption className="mt-6 border-t border-border pt-4">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{t.role}</p>
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Scalable plans</h2>
              <p className="mt-3 text-sm text-primary-foreground/65">
                Start free, forever. Paid plans are per organization, billed monthly, and every plan
                includes transcripts, summaries, decisions and action items.
              </p>
            </Reveal>
            <Stagger className="mt-12 grid items-start gap-5 md:grid-cols-3">
              {TIERS.map((tier) => (
                <StaggerItem key={tier.name}>
                  <div
                    className={
                      tier.featured
                        ? "relative rounded-2xl border-2 border-background bg-card p-7 text-card-foreground shadow-raise lg:-translate-y-4"
                        : "rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.06] p-7 backdrop-blur-sm"
                    }
                  >
                    {tier.featured && (
                      <span className="absolute -top-3 right-6 rounded-full bg-background px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-foreground">
                        Most teams
                      </span>
                    )}
                    <p
                      className={
                        tier.featured
                          ? "font-mono text-[11px] uppercase tracking-widest text-primary"
                          : "font-mono text-[11px] uppercase tracking-widest text-primary-foreground/60"
                      }
                    >
                      {tier.name}
                    </p>
                    <p className="mt-3 text-4xl font-semibold tracking-tight">
                      ${tier.price}
                      <span className="ml-1 text-base font-normal opacity-55">{tier.price === 0 ? "forever" : "/mo"}</span>
                    </p>

                    <p className={tier.featured ? "mt-3 text-sm text-muted-foreground" : "mt-3 text-sm text-primary-foreground/60"}>
                      {tier.blurb}
                    </p>
                    <ul className="mt-7 space-y-3.5 text-sm">
                      {tier.features.map((f) => (
                        <li
                          key={f}
                          className={tier.featured ? "flex gap-2.5 text-muted-foreground" : "flex gap-2.5 text-primary-foreground/75"}
                        >
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.5} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={
                        tier.featured
                          ? "mt-8 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground hover:-translate-y-0.5 hover:shadow-raise"
                          : "mt-8 block rounded-xl border border-primary-foreground/25 px-4 py-3 text-center text-sm font-semibold hover:bg-primary-foreground/10"
                      }
                    >
                      {tier.price === 0 ? "Start free" : `Choose ${tier.name}`}
                    </Link>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-5 py-20">
          <Reveal className="text-center">
            <p className="text-eyebrow">FAQ</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">Questions teams ask first</h2>
          </Reveal>
          <Stagger className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {FAQS.map((f) => (
              <StaggerItem key={f.q} className="px-6 py-5">
                <dt className="text-[15px] font-semibold tracking-tight">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border bg-surface">
          <Reveal className="mx-auto max-w-3xl px-5 py-20 text-center">
            <Shield className="mx-auto size-6 text-primary" strokeWidth={2} />
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Your next meeting can write itself up
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Create an account, record one call, and see the transcript, decisions and action items
              land before the room clears. Free plan, no card, no trial timer.
            </p>
            <Link
              href="/signup"
              className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-panel hover:-translate-y-0.5 hover:shadow-raise"
            >
              Get started free
              <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="font-mono">MeetingMind AI</span>
          <span>Audio is stored privately per organization and never used for model training.</span>
        </div>
      </footer>
    </div>
  );
}
