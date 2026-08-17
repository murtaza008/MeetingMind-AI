# MeetingMind AI

**AI meeting notes and action items — built on a 100% free stack.**

Record a meeting or upload an existing recording. MeetingMind sends the audio
straight to Gemini, which transcribes it, labels speakers, writes a factual
summary, logs the decisions that were actually made, extracts action items
with owners and due dates, and drafts a follow-up email — all searchable
across every meeting your team has ever run.

## Why this stack is fully free

Every piece of this project runs on a generous free tier, with no credit
card required anywhere in the core product:

| Layer | Choice | Why it's free |
|---|---|---|
| Database | [Neon Postgres](https://neon.tech) | Free serverless Postgres tier — also stores uploaded audio directly (as `bytea`), so no separate storage bucket is needed |
| ORM | [Prisma 7](https://www.prisma.io) | Open source, connects to Neon via `@prisma/adapter-neon` |
| Auth | [NextAuth.js (Auth.js) v5](https://authjs.dev) | Open source, email/password via bcrypt; optional free Google OAuth |
| AI (transcription, diarization, summary, decisions, action items, follow-up email) | [Google Gemini](https://aistudio.google.com/apikey) | Free API key, `gemini-flash-latest`. Gemini accepts audio natively, so **one model call** does the whole job — no separate Whisper/transcription provider |
| Payments | [Stripe](https://dashboard.stripe.com/test/apikeys) test mode | Test-mode keys are free forever. Skip it entirely and billing runs in **demo mode** automatically |
| Hosting | [Vercel](https://vercel.com) free tier (or anywhere Next.js runs) | — |

If you never add a `STRIPE_SECRET_KEY`, the billing page still works —
"upgrading" a plan just flips the organization's plan in the database
instantly with a demo-mode notice, so the whole product works without ever
creating a Stripe account.

## Features

- **Auth & organizations** — email/password sign-up (+ optional free Google OAuth), multi-tenant organizations with `owner / admin / member` roles, each holding one or more workspaces
- **Upload or record** — drag-and-drop an MP3/WAV/M4A/webm file (up to 20MB locally, 4MB on Vercel — see Known issues), or record straight from the browser mic with a live waveform level meter
- **One Gemini call per meeting** — transcription, speaker diarization, a factual summary, key topics, decisions, action items (owner + due date) and a follow-up email draft, all extracted in a single structured request. The prompt is deliberately conservative: it never invents a decision, owner or date that wasn't actually said
- **Meeting detail page** — tabbed summary/transcript view, an inline audio player (the recording is stored in Postgres, streamed back on demand), timestamped speaker-labelled transcript, one-click action item toggling, copy-to-clipboard follow-up email
- **Cross-meeting action item board** — every action item across every meeting, grouped by source meeting, filterable by status and assignee
- **Shareable read-only links** — toggle a public link per meeting so people outside your organization can see the transcript and summary without signing in
- **Team management** — invite teammates by shareable link, manage roles, revoke access
- **Billing** — Free / Team / Business plans with real Stripe Checkout (test mode) or automatic demo-mode fallback; the Free plan is capped at 3 meetings/month, enforced server-side
- **Dark mode** — light / dark / system, persisted, with an animated sliding-pill toggle
- **Design system** — Geist (UI) + Space Grotesk (headlines) + JetBrains Mono (timestamps/data), an indigo-accented palette, `motion` scroll-triggered reveals throughout, and a full marketing landing page (hero, stats, how-it-works, feature grid, use cases, testimonials, pricing, FAQ)

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4, `motion` (Framer Motion successor), `next-themes` for dark mode
- **Database:** Neon Postgres + Prisma 7 (via the `@prisma/adapter-neon` driver adapter) — audio is stored as `Bytes` on the `Meeting` row
- **Auth:** NextAuth.js v5, Credentials provider (bcrypt), optional Google OAuth
- **AI:** Vercel AI SDK (`ai`, `@ai-sdk/google`) + Google Gemini, `generateObject` with a zod schema and an inline audio file part
- **Payments:** Stripe Checkout + Billing Portal (test mode) with a demo-mode fallback
- **Data fetching:** TanStack Query against the app's own Next.js Route Handlers
- **Icons:** lucide-react · **Toasts:** sonner

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a free Neon Postgres database

1. Sign up at [neon.tech](https://neon.tech) (free, no card required).
2. Create a project, then copy its connection string.
3. Paste it into `.env` as `DATABASE_URL`.

### 3. Get a free Google Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey) and sign in with any Google account.
2. Create a free API key.
3. Paste it into `.env` as `GOOGLE_GENERATIVE_AI_API_KEY`.

Without this key the app still runs — uploading a meeting fails cleanly with
an "AI is not configured" message instead of a crash.

### 4. Generate an auth secret

```bash
openssl rand -base64 32
```

Paste the result into `.env` as `NEXTAUTH_SECRET`.

### 5. (Optional) Google sign-in

Skip this and only the email/password form will show. To enable it for free:

1. Create an OAuth Client in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
3. Fill in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env`.

### 6. (Optional) Stripe test mode

Skip this entirely if you don't need real checkout — billing falls back to
demo mode automatically. To wire up real (test-mode, free) Stripe Checkout:

1. Create a free account at [stripe.com](https://stripe.com).
2. Grab your **test** keys from the [API keys page](https://dashboard.stripe.com/test/apikeys).
3. Create two recurring Prices in test mode (Team, Business) and copy their price IDs.
4. Fill in `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_TEAM`, `STRIPE_PRICE_BUSINESS` in `.env`.
5. For webhooks locally, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and paste the printed secret into `STRIPE_WEBHOOK_SECRET`.

### 7. Push the database schema

```bash
npx prisma db push
```

### 8. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, create an
organization, upload a short audio clip (or record one), and watch the
transcript, summary, decisions and action items land on the meeting page.

## Known issues

- **Serverless function timeout on long recordings.** Meeting processing
  happens synchronously inside the upload request (no background job queue —
  deliberately, to keep the stack simple and free). The upload route sets
  `maxDuration = 60`. On Vercel Hobby that's the ceiling; a very long
  recording on a slow free-tier Gemini response can occasionally exceed it,
  which leaves the meeting stuck in "Processing" — re-uploading fixes it.
  Running locally (`npm run dev`) or on Vercel Pro removes this ceiling.
- **Upload cap is environment-aware: 20MB normally, 4MB on Vercel.** Vercel's
  Node.js Serverless Functions hard-cap the request body at 4.5MB — a fixed
  platform limit, not a config knob. `lib/plans.ts` detects the `VERCEL` env
  var (set automatically in every Vercel build) and drops `FREE_AUDIO_MAX_BYTES`
  to 4MB there so uploads fail with a clear "too large" message instead of a
  raw platform 413. Running locally (`npm run dev`) or on any non-Vercel Node
  host (Railway, Render, a VPS, your own server) keeps the full 20MB cap,
  which comfortably covers a real meeting recording. If 4MB is too tight for
  your Vercel deployment, that's the actual tradeoff of serverless — self-host
  the Node server instead, or add a real object-storage upload path (not
  included here, to keep the stack to just Neon + Gemini).
- **Free-tier Gemini latency.** Under sustained/rapid use the free API key
  can take longer to respond than a billed key (lower priority queueing).
  This shows up as a longer wait on the "New meeting" processing screen, not
  an error — no client-side timeout is enforced.
- **The "processing steps" list is cosmetic.** Since there's no background
  job to poll, the step-by-step progress indicator on the upload screen is
  driven by elapsed time on the client, not real backend state. The actual
  meeting `status` (`PROCESSING` / `READY` / `FAILED`) is the source of truth.

## Project structure

```
meetingmind-ai/
  app/
    page.tsx                        # Landing page
    login/, signup/                 # Auth pages
    onboarding/                     # Create-org / join-by-invite
    invite/[token]/                 # Team invite acceptance
    share/[token]/                  # Public read-only meeting view
    (dashboard)/                    # Protected dashboard route group
      dashboard/, new/, meetings/[id]/, actions/, team/, billing/, settings/
    api/
      auth/                         # NextAuth handler + signup endpoint
      orgs/, workspaces/, invites/  # Org, workspace, member, invite CRUD
      meetings/                    # List, upload (runs Gemini inline), detail, audio, share
      public/meetings/[token]/      # Unauthenticated share-link read
      action-items/                 # Cross-meeting action item board
      billing/, webhooks/stripe/    # Stripe checkout, portal, webhook
  components/
    landing/                        # ProductMock (live meeting-detail replica used in the hero)
    dashboard/                      # AppShell (sidebar, workspace switcher), PersonAvatar
    meetings/                       # Waveform (live mic level meter), ProcessingSteps, StatusBadge
    auth/                           # Shared login/signup form
    motion/                         # Reveal, CountUp — replay on every scroll re-entry
  lib/
    prisma.ts, auth.ts, auth.config.ts, session.ts, org.ts
    gemini.ts                       # The single generateObject call that does transcription + analysis
    meetings.ts, plans.ts, stripe.ts, format.ts
    hooks/                          # TanStack Query hooks (use-org, use-meetings, use-action-items, use-team)
  prisma/schema.prisma               # Full data model (Org → Workspace → Meeting → Transcript/Summary/Decision/ActionItem)
```

## Deploying to Vercel

1. **Push this repo to GitHub** and [import it into Vercel](https://vercel.com/new). Vercel auto-detects the Next.js framework and build command.
2. **Set environment variables** in Project Settings → Environment Variables:

   | Variable | Required | Notes |
   |---|---|---|
   | `DATABASE_URL` | Yes | Same Neon **pooled** connection string used locally |
   | `NEXTAUTH_SECRET` | Yes | Generate with `openssl rand -base64 32` — use a different value than local dev |
   | `NEXTAUTH_URL` | No | Leave unset. `next-auth` v5 auto-trusts the host on Vercel |
   | `GOOGLE_GENERATIVE_AI_API_KEY` | Recommended | Same free Gemini key as local dev |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | If enabling Google sign-in, add `https://<your-domain>/api/auth/callback/google` as an authorized redirect URI first |
   | `STRIPE_*` | Optional | Leave blank for demo-mode billing, same as local dev |

3. **Database schema**: this repo has no `prisma/migrations` folder — the
   schema is pushed straight with `npx prisma db push`, and the build script
   is just `next build` (deliberately *not* `prisma migrate deploy`: with no
   tracked migrations, `migrate deploy` fails with `P3005` the moment it hits
   a database that already has tables, which is exactly the state your Neon
   DB is in after step 7 above). Point Vercel at the **same** Neon database
   you've been developing against and it just works. If you ever point
   production at a **different, empty** database, run `npx prisma db push`
   against it once first — Vercel's build never applies schema changes on
   its own.
4. **Deploy.** Vercel runs `npm install` (which triggers `postinstall` →
   `prisma generate`), then `npm run build`.

No `output: "standalone"`, custom `vercel.json`, or edge-runtime
configuration is needed — every API route uses the default Node.js
runtime, which the Neon Prisma adapter (`@prisma/adapter-neon`) requires
anyway (it depends on the `ws` package for its WebSocket connection).

## License

MIT — do whatever you want with it.
