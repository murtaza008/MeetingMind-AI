# MeetingMind AI

**AI meeting notes and action items — built on a 100% free stack.**

[![Live demo](https://img.shields.io/badge/demo-live-22c55e?style=flat-square)](https://meeting-mind-ai-zeta.vercel.app/)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma 7](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)
![Neon](https://img.shields.io/badge/Neon-Postgres-00E599?style=flat-square&logo=postgresql&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2?style=flat-square&logo=googlegemini&logoColor=white)

**Live demo:** https://meeting-mind-ai-zeta.vercel.app/ — click **Try demo** to
explore a ready-made workspace with five processed meetings, no sign-up needed.
Or create your own account and upload or record a short clip.

Record a meeting or upload an existing recording. MeetingMind sends the audio
straight to Gemini, which transcribes it, labels speakers, writes a factual
summary, logs the decisions that were actually made, extracts action items
with owners and due dates, and drafts a follow-up email. Every action item from
every meeting lands on one shared board for the team.

## Contents

- [Why this stack is fully free](#why-this-stack-is-fully-free)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Public demo mode](#public-demo-mode)
- [Seeding demo meetings](#seeding-demo-meetings)
- [How processing works](#how-processing-works)
- [Known issues](#known-issues)
- [API routes](#api-routes)
- [Project structure](#project-structure)
- [Deploying to Vercel](#deploying-to-vercel)
- [License](#license)

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

- **Auth & organizations** — email/password sign-up (Google OAuth is wired on the server, UI button pending), multi-tenant organizations with `owner / admin / member` roles, each holding one or more workspaces
- **Upload or record** — drag-and-drop an MP3/WAV/M4A/webm file (up to 20MB locally, 4MB on Vercel — see Known issues), or record straight from the browser mic with a live waveform level meter
- **One Gemini call per meeting** — transcription, speaker diarization, a factual summary, key topics, decisions, action items (owner + due date) and a follow-up email draft, all extracted in a single structured request. The prompt is deliberately conservative: it never invents a decision, owner or date that wasn't actually said
- **Dashboard** — every meeting in the current workspace with status (Processing / Ready / Failed), search by title and a status filter
- **Meeting detail page** — tabbed summary/transcript view, an inline audio player (the recording is stored in Postgres, streamed back on demand), timestamped speaker-labelled transcript, one-click action item toggling, copy-to-clipboard follow-up email
- **Cross-meeting action item board** — every action item across every meeting on an Open / In progress / Done board (drag cards between columns), or grouped by source meeting; filterable by status and assignee
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

**Prerequisites:** Node.js **20.9+**, a free Neon database, a free Gemini API key.

### 1. Clone and install

```bash
git clone <your-fork-url> meetingmind-ai
cd meetingmind-ai
npm install        # also runs `prisma generate` (postinstall)
```

Then create a `.env` file in the project root with this template and fill it in
over the next steps:

```bash
# Required
DATABASE_URL=""                    # Neon connection string
NEXTAUTH_SECRET=""                 # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_GENERATIVE_AI_API_KEY=""    # https://aistudio.google.com/apikey

# Optional: Google sign-in
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional: Stripe (leave blank for demo billing mode)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_TEAM=""
STRIPE_PRICE_BUSINESS=""
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

Skip this step; it is not needed. When both variables are set, `lib/auth.ts`
registers the Google provider and creates a local user on the first Google
sign-in, **but the login and sign-up pages do not have a Google button yet**, so
email/password is the only sign-in path in the UI. To prepare the backend:

1. Create an OAuth Client in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
3. Fill in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.env`.

### 6. (Optional) Stripe test mode

Skip this entirely if you don't need real checkout — billing falls back to
demo mode automatically. To wire up real (test-mode, free) Stripe Checkout:

1. Create a free account at [stripe.com](https://stripe.com).
2. Grab your **test** keys from the [API keys page](https://dashboard.stripe.com/test/apikeys).
3. Create two recurring Prices in test mode (Team, Business) and copy their price IDs.
4. Fill in `STRIPE_SECRET_KEY`, `STRIPE_PRICE_TEAM`, `STRIPE_PRICE_BUSINESS` in `.env`.
   (Checkout is server-side redirect, so no publishable key is needed.)
5. For webhooks locally, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and paste the printed secret into `STRIPE_WEBHOOK_SECRET`.
   The webhook keeps the plan in sync on `customer.subscription.created`,
   `customer.subscription.updated` and `customer.subscription.deleted`.

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

### npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | `next build` (does **not** touch the database schema, see [Deploying](#deploying-to-vercel)) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run seed:demo` | Build or reset the public demo org (see [Public demo mode](#public-demo-mode)) |
| `npx prisma db push` | Sync `prisma/schema.prisma` to the database |

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **yes** | Neon Postgres connection string (app data **and** uploaded audio) |
| `NEXTAUTH_SECRET` | **yes** | Signs session JWTs (`AUTH_SECRET` also works with Auth.js v5) |
| `NEXTAUTH_URL` | local only | Base URL; also the fallback origin for Stripe redirect URLs |
| `GOOGLE_GENERATIVE_AI_API_KEY` | to process meetings | Gemini key; without it uploads fail with a clear "AI is not configured" message |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Register the Google OAuth provider (backend only; no UI button yet) |
| `STRIPE_SECRET_KEY` | no | Real Stripe Checkout; empty = demo billing mode |
| `STRIPE_WEBHOOK_SECRET` | with Stripe | Verifies webhook signatures |
| `STRIPE_PRICE_TEAM` / `STRIPE_PRICE_BUSINESS` | with Stripe | Recurring Price IDs |
| `DEMO_PASSWORD` | for the public demo | Password of the shared demo account; "Try demo" uses it server-side, it never reaches the browser |
| `CRON_SECRET` | for the public demo | Protects `/api/cron/demo-reset`; Vercel Cron sends it as a Bearer token |
| `SEED_USER_EMAIL` | no | Target account for `scripts/seed-meetings.ts` |

`VERCEL` is set automatically by Vercel and lowers the upload cap to 4 MB (see Known issues).

## Public demo mode

A **Try demo** button on the landing page and the login page signs visitors
into a shared demo account (`demo@meetingmind.demo`) with no typing. The sign-in
happens on the server (`POST /api/demo/login`), so the password never reaches
the browser. Visitors land in **Lumen Labs**, a fictional startup on the
Business plan with three members (owner, admin, member) and five fully
processed meetings: a sales discovery call, sprint planning, a client kickoff,
a roadmap review and a hiring debrief. Each one has a speaker-labelled
transcript, summary, decisions, action items with owners and due dates, and a
follow-up email. All AI output is stored in the seed, so browsing the demo never
calls Gemini. The roadmap review has a permanent public link at
`/share/demo-lumen-roadmap-review`.

**What demo visitors can and can't do**

- They can move action items between Open / In progress / Done on the board,
  read everything, and share a meeting.
- They can upload or record audio, but only **2 uploads per day across all
  visitors**, each **at most 3 minutes**. This is enforced on the server with an
  atomic counter (`DemoUsage`) and a duration check.
- These actions are blocked with a friendly message: deleting meetings,
  turning off a share link, creating or renaming organizations and
  workspaces, inviting members, changing roles, accepting invites, and billing
  (Stripe checkout and portal). The app has no email/password or API-key
  settings for a visitor to change.

**Setup**

```bash
# .env — generate both with: openssl rand -base64 32
DEMO_PASSWORD="..."
CRON_SECRET="..."

npx prisma db push      # adds the IN_PROGRESS status and the DemoUsage table
npm run seed:demo       # builds the demo org; safe to re-run
```

`npm run seed:demo` is idempotent. It deletes and rebuilds only the demo org
(the cascade also removes meetings and audio that visitors uploaded) plus the
demo accounts' memberships and the upload counter. Meeting and due dates are
relative to the day it runs. Real users and their data are never touched, and
sign-ups on the reserved `@meetingmind.demo` / `@lumenlabs.demo` domains are
refused.

**Daily reset.** `vercel.json` schedules `GET /api/cron/demo-reset` once a day
(00:00 UTC). With `CRON_SECRET` set in the Vercel project, Vercel sends it as
`Authorization: Bearer <CRON_SECRET>`, and the route runs the same reset as the
seed script. To trigger it by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<your-domain>/api/cron/demo-reset
```

## Seeding demo meetings

`scripts/seed-meetings.ts` adds three finished demo meetings (transcript, summary,
decisions, action items, follow-up email and a playable recording from
`scripts/demo-meeting.wav`) to an **existing** account's workspace. Sign up and
create an organization first, then:

```bash
npx tsx scripts/seed-meetings.ts you@example.com --dry   # preview, writes nothing
npx tsx scripts/seed-meetings.ts you@example.com         # insert
npx tsx scripts/check-seed.ts you@example.com            # read-only summary
```

Re-running is safe (meetings are matched by title). The seeded transcripts and
summaries are hand-written; upload a real recording to see the Gemini pipeline run.

## How processing works

1. The browser uploads the file (or the `MediaRecorder` recording) to
   `POST /api/meetings/upload` with the workspace id and duration.
2. The route checks the size cap and, on the Free plan, the 3-meetings-per-month
   limit, then stores the audio as `bytea` on a new `Meeting` row with status `PROCESSING`.
3. **One** `generateObject` call ([`lib/gemini.ts`](lib/gemini.ts)) sends the audio as an
   inline file part to `gemini-flash-latest` with a zod schema for speaker segments,
   summary, key topics, decisions, action items (`assignee`, `dueDate`, timestamp)
   and the follow-up email.
4. Transcript, summary, decisions and action items are written in one transaction
   and the meeting flips to `READY`, or to `FAILED` with the error message.

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
- **Search covers meeting titles only.** Transcripts are stored but not full-text indexed.
- **Only the meeting cap is enforced per plan.** The Free plan's 3 meetings / month is
  checked server-side; other items on the pricing table (workspace count,
  share links, roles) are available on every plan.
- **Invites are links, not emails.** Creating an invite copies an `/invite/<token>`
  link to your clipboard for you to send; no email is delivered.
- **No Google sign-in button.** The Google provider is configured in `lib/auth.ts`
  when its env vars are set, but the auth form only offers email/password.

## API routes

All routes except auth, `public/*` and the Stripe webhook require a session, and
check the caller's organization membership and role.

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Create an account |
| `GET` `POST` | `/api/orgs` | Your orgs + workspaces / create an org with its first workspace |
| `PATCH` | `/api/orgs/[orgId]` | Rename the organization |
| `POST` | `/api/orgs/[orgId]/workspaces` | Add a workspace |
| `GET` | `/api/orgs/[orgId]/members` | Members and roles |
| `PATCH` `DELETE` | `/api/orgs/[orgId]/members/[memberId]` | Change role / remove (the last owner is protected) |
| `GET` `POST` | `/api/orgs/[orgId]/invites` | List / create invite links |
| `DELETE` | `/api/orgs/[orgId]/invites/[inviteId]` | Revoke an invite |
| `GET` | `/api/invites/[token]` | Read an invite |
| `POST` | `/api/invites/accept` | Accept an invite |
| `GET` | `/api/meetings?workspaceId=&q=` | List meetings (title search) |
| `POST` | `/api/meetings/upload` | Upload audio and run the Gemini analysis |
| `GET` `DELETE` | `/api/meetings/[id]` | Meeting detail / delete |
| `GET` | `/api/meetings/[id]/audio` | Stream the stored recording |
| `POST` | `/api/meetings/[id]/share` | Toggle the public share link |
| `GET` | `/api/public/meetings/[token]` | Public read-only meeting (no auth) |
| `GET` | `/api/action-items?orgId=` | Cross-meeting action item board |
| `PATCH` | `/api/action-items/[id]` | Update an action item's status |
| `POST` | `/api/billing/checkout` | Stripe Checkout, or instant plan switch in demo mode |
| `POST` | `/api/billing/portal` | Stripe Customer Portal |
| `POST` | `/api/webhooks/stripe` | Stripe webhook receiver |
| `POST` | `/api/demo/login` | "Try demo": signs in to the shared demo account server-side |
| `GET` | `/api/demo/status` | Demo uploads left today |
| `GET` | `/api/cron/demo-reset` | Daily demo reset (requires `Authorization: Bearer $CRON_SECRET`) |

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
      orgs/                         # Orgs, plus [orgId]/workspaces, /members, /invites
      invites/                      # Read + accept an invite by token
      meetings/                     # List, upload (runs Gemini inline), detail, audio, share
      public/meetings/[token]/      # Unauthenticated share-link read
      action-items/                 # Cross-meeting action item board
      billing/, webhooks/stripe/    # Stripe checkout, portal, webhook
  components/
    landing/                        # ProductMock (live meeting-detail replica used in the hero)
    dashboard/                      # AppShell (sidebar, workspace switcher), PersonAvatar
    meetings/                       # Waveform (live mic level meter), ProcessingSteps, StatusBadge
    auth/                           # Shared login/signup form
    motion/                         # Reveal, Stagger, CountUp — replay on every scroll re-entry
    ui/                             # Dropdown menu, toaster
    theme-toggle.tsx                # Light / dark / system switch
  lib/
    prisma.ts, auth.ts, auth.config.ts, session.ts, org.ts
    gemini.ts                       # The single generateObject call that does transcription + analysis
    meetings.ts, plans.ts, stripe.ts, format.ts
    hooks/                          # TanStack Query hooks (use-org, use-meetings, use-action-items, use-team)
  prisma/schema.prisma               # Full data model (Org → Workspace → Meeting → Transcript/Summary/Decision/ActionItem)
  scripts/
    seed-meetings.ts, check-seed.ts  # Demo data seeder + read-only check
    demo-meeting.wav                 # Audio used by the seeded meetings
  proxy.ts                           # Redirects signed-out visitors (Next.js 16 "proxy", formerly middleware)
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

No `output: "standalone"` or edge-runtime configuration is needed — every
API route uses the default Node.js runtime, which the Neon Prisma adapter
(`@prisma/adapter-neon`) requires anyway (it depends on the `ws` package for
its WebSocket connection). `vercel.json` only registers the daily demo-reset
cron job (see [Public demo mode](#public-demo-mode)).

## License

MIT — do whatever you want with it.
