// Content for the public demo organization, "Lumen Labs" — a fictional startup
// that sells a customer-feedback analytics product called Lumen. Every person
// and company here is made up. All AI output (transcript, summary, decisions,
// action items, follow-up email) is written ahead of time and stored in the
// exact shape the upload route saves, so viewing the demo never calls Gemini.
//
// Dates are relative: `daysAgo` / `dueInDays` are resolved against the moment
// the reset runs, so the demo always looks like the last two weeks of work.

import { DEMO_EMAIL } from "./demo";

export type DemoStatus = "OPEN" | "IN_PROGRESS" | "DONE";

export type DemoPerson = { email: string; name: string; role: "OWNER" | "ADMIN" | "MEMBER"; joinedDaysAgo: number };

/** The account visitors sign in as, plus the two teammates who own action items. */
export const DEMO_PEOPLE = {
  jordan: { email: DEMO_EMAIL, name: "Jordan Ellis", role: "OWNER", joinedDaysAgo: 210 },
  maya: { email: "maya.chen@lumenlabs.demo", name: "Maya Chen", role: "ADMIN", joinedDaysAgo: 190 },
  sam: { email: "sam.okafor@lumenlabs.demo", name: "Sam Okafor", role: "MEMBER", joinedDaysAgo: 150 },
} satisfies Record<string, DemoPerson>;

export type DemoPersonKey = keyof typeof DEMO_PEOPLE;

// Fixed ids keep links stable across daily resets (and the share link below
// is meant to be pasted into a profile or proposal, so it must never change).
export const DEMO_ORG_ID = "6f1c2a0e-4b7d-4c1a-9e3f-5d0e1a2b3c01";
export const DEMO_ORG_NAME = "Lumen Labs";
export const DEMO_ORG_SLUG = "lumen-labs-demo";
export const DEMO_WORKSPACE_ID = "6f1c2a0e-4b7d-4c1a-9e3f-5d0e1a2b3c02";
export const DEMO_WORKSPACE_NAME = "Lumen HQ";
export const DEMO_SHARE_TOKEN = "demo-lumen-roadmap-review";

export type DemoMeeting = {
  id: string;
  title: string;
  daysAgo: number;
  /** Hour of day (UTC) the meeting started. */
  hour: number;
  createdBy: DemoPersonKey;
  shareToken?: string;
  /** [speaker, what they said] — start/end seconds are derived from word count. */
  turns: [string, string][];
  summary: string;
  keyTopics: string[];
  decisions: { description: string; context: string }[];
  actionItems: {
    description: string;
    assignee: string;
    dueInDays: number;
    status: DemoStatus;
    /** Index into `turns` where the item was raised. */
    turn: number;
  }[];
  followupEmail: string;
};

const JORDAN = DEMO_PEOPLE.jordan.name;
const MAYA = DEMO_PEOPLE.maya.name;
const SAM = DEMO_PEOPLE.sam.name;

export const DEMO_MEETINGS: DemoMeeting[] = [
  {
    id: "6f1c2a0e-4b7d-4c1a-9e3f-5d0e1a2b3d01",
    title: "Discovery call — Harbor & Pine Outfitters",
    daysAgo: 4,
    hour: 15,
    createdBy: "jordan",
    turns: [
      [JORDAN, "Thanks for making the time, Rachel, Tom. I'd like to spend most of this call understanding how customer feedback flows through Harbor & Pine today, and then show you a little of Lumen at the end if it looks relevant. Does that work?"],
      ["Rachel Kim", "Works for us. Quick context: we run 64 stores plus the online shop, and my team owns everything customer facing after the sale. Support, returns and reviews."],
      [MAYA, "How does feedback reach your team right now? Is it one queue or several?"],
      ["Rachel Kim", "Several, which is the problem. Zendesk for tickets, Bazaarvoice for product reviews, a quarterly NPS survey, and store managers who email me spreadsheets. Nobody sees all of it at once."],
      [JORDAN, "When something goes wrong with a product, how long does it usually take before you know?"],
      ["Rachel Kim", "Honestly, weeks. Last spring we had a zipper defect on a jacket line. Reviews flagged it in early April and we didn't pull the batch until mid-May. That cost us roughly forty thousand dollars in returns."],
      [MAYA, "That's exactly the gap Lumen is built for. It pulls tickets, reviews and survey comments into one place and groups them into themes, so a spike like the zipper issue shows up as a trend within a few days."],
      ["Tom Becker", "My first question is always integrations. We're on Zendesk Enterprise and Bazaarvoice. Do you connect to both natively, or is this a CSV exercise?"],
      [MAYA, "Zendesk is a native connector with read-only OAuth. Bazaarvoice we support through their export API. Which tool runs the NPS survey?"],
      ["Rachel Kim", "Qualtrics."],
      [MAYA, "Qualtrics is native as well. The store manager spreadsheets would be a scheduled upload to start with."],
      ["Tom Becker", "OK. Then security. We need SSO through Okta and a signed DPA before any customer data leaves our systems, and we want the data hosted in the US."],
      [JORDAN, "All three are standard for us. Okta SSO is on our Business plan, we only host in US regions, and I can send you our DPA and SOC 2 Type II report today."],
      ["Tom Becker", "Good. Send those to me directly and I'll start our vendor review in parallel. It usually takes about three weeks."],
      ["Rachel Kim", "On budget, I have a tooling line this fiscal year, but I need a business case for our COO. The zipper incident is my best argument."],
      [JORDAN, "Then let's make that the pilot. If we backfill the last twelve months of your tickets and reviews, we can show you exactly when Lumen would have flagged the zipper problem."],
      ["Rachel Kim", "That would be compelling. How long does a backfill take?"],
      [MAYA, "For your volume, two to three days once we have read access. We'd also want one of your analysts on a thirty minute call to confirm product category names."],
      ["Rachel Kim", "I can give you Lena from my insights team."],
      ["Tom Becker", "One constraint. The pilot can only use US online store data at first. Retail store data needs a separate approval from legal."],
      [JORDAN, "That's fine. Online is the bigger feedback volume anyway. So the pilot is twelve months of online tickets, reviews and NPS, backfilled, with the zipper retrospective as the headline."],
      ["Rachel Kim", "Agreed. If the retrospective shows what you're describing, I'll take it to our COO at the end of the month."],
      [JORDAN, "Great. I'll send a pilot proposal with pricing this week, and Maya will set up the sandbox once Tom's review clears."],
      ["Tom Becker", "Send the security documents first, please. I'd rather not hold up the review."],
      [JORDAN, "Will do, today. Thanks, both. This was really useful."],
    ],
    summary:
      "Discovery call with Harbor & Pine Outfitters, a retailer with 64 stores and an online shop. Their customer feedback is split across Zendesk, Bazaarvoice, Qualtrics and store-manager spreadsheets, and a jacket zipper defect last spring took about six weeks to act on, costing roughly $40,000 in returns. Tom Becker requires Okta SSO, a signed DPA and US data hosting, and will run a three-week vendor review in parallel. Both sides agreed on a pilot limited to US online-store data, led by a retrospective on the zipper incident for Rachel Kim's business case to the COO.",
    keyTopics: [
      "Fragmented feedback channels",
      "Zipper defect retrospective",
      "Zendesk, Bazaarvoice and Qualtrics integrations",
      "Security and vendor review",
      "Pilot scope",
    ],
    decisions: [
      {
        description: "Run the pilot on US online-store data only: tickets, reviews and NPS for the last twelve months.",
        context: "Tom Becker said retail store data needs a separate legal approval, so the pilot starts with online.",
      },
      {
        description: "Lead the business case with a retrospective on last spring's zipper defect.",
        context: "Rachel Kim needs a concrete ROI story for the COO; the backfill will show when Lumen would have flagged it.",
      },
    ],
    actionItems: [
      { description: "Send the DPA and SOC 2 Type II report to Tom Becker", assignee: JORDAN, dueInDays: -4, status: "DONE", turn: 12 },
      { description: "Start Harbor & Pine's vendor security review", assignee: "Tom Becker", dueInDays: 17, status: "IN_PROGRESS", turn: 13 },
      { description: "Prepare the zipper-defect retrospective from the backfilled data", assignee: MAYA, dueInDays: 7, status: "OPEN", turn: 15 },
      { description: "Schedule a category-mapping call with Lena from the insights team", assignee: MAYA, dueInDays: 1, status: "OPEN", turn: 17 },
      { description: "Send the pilot proposal with pricing", assignee: JORDAN, dueInDays: 1, status: "IN_PROGRESS", turn: 22 },
    ],
    followupEmail: `Subject: Harbor & Pine x Lumen: pilot next steps

Hi Rachel and Tom,

Thanks for the time today. A short recap so we are aligned.

What we heard
- Feedback is spread across Zendesk, Bazaarvoice, Qualtrics and store-manager spreadsheets.
- The spring zipper defect took about six weeks to act on and cost roughly $40,000 in returns.

Decisions
- The pilot covers US online-store data only: tickets, reviews and NPS for the last twelve months.
- The business case will lead with a retrospective on the zipper incident.

Next steps
- Jordan: send the DPA and SOC 2 Type II report to Tom today.
- Tom: start the vendor security review (about three weeks).
- Maya: schedule a 30-minute category-mapping call with Lena.
- Jordan: send the pilot proposal with pricing this week.

Best,
Jordan`,
  },
  {
    id: "6f1c2a0e-4b7d-4c1a-9e3f-5d0e1a2b3d02",
    title: "Weekly sprint planning — Sprint 42",
    daysAgo: 2,
    hour: 9,
    createdBy: "sam",
    turns: [
      [SAM, "Morning, everyone. Sprint 42 planning. We have fourteen points of carry-over and about thirty-two points of capacity, since Diego is out Thursday and Friday. Maya, do you want to start with priorities?"],
      [MAYA, "Sure. Top priority is the Harbor & Pine pilot. They need the Bazaarvoice connector and the historical backfill working before their security review finishes. Second is the theme alerts feature we promised Cobalt Fitness."],
      ["Diego Alvarez", "The Bazaarvoice connector is mostly built. What's left is pagination and rate-limit handling. Their export API caps us at two requests per second, so a twelve-month backfill needs a proper queue."],
      [SAM, "How big is that?"],
      ["Diego Alvarez", "Five points for the queue and retry logic, three for the backfill job itself. I'd like to finish it before I'm out."],
      ["Aisha Rahman", "On alerts, the designs are ready, but we still haven't agreed whether alerts are per theme or per product category."],
      ["Nina Patel", "The research says per theme. In all six interviews, people described the problem as returns about sizing went up, not as a category. Category can be a filter on the alert."],
      [MAYA, "Then let's decide now. Alerts are per theme, with an optional category filter. We can revisit after Cobalt has used it for a month."],
      ["Aisha Rahman", "Great, that simplifies the settings screen. The alerts frontend is about eight points, including the email template."],
      ["Diego Alvarez", "The alert job needs a threshold. For version one, can we use a simple week-over-week spike rule instead of anything statistical?"],
      [SAM, "Yes. Spike rule for version one: a theme's volume is up at least fifty percent week over week, with a minimum of twenty mentions, so small themes don't create noise."],
      [MAYA, "Agreed. Let's keep the threshold configurable but not exposed in the UI yet."],
      [SAM, "Carry-over next. The CSV export bug where non-English characters break. Aisha, where is that?"],
      ["Aisha Rahman", "Root cause is the file encoding. We write UTF-8 without a byte order mark and Excel misreads it. The fix is done, it just needs review."],
      [SAM, "I'll review it today. The other carry-over is the slow dashboard query for accounts with more than a million comments."],
      ["Diego Alvarez", "I added an index on theme and created date in staging. P95 went from 4.2 seconds to 600 milliseconds. It needs a migration plan for production because the table is large."],
      [SAM, "Let's run the migration in the Saturday maintenance window. I'll write the runbook."],
      ["Nina Patel", "One request. Can we reserve two points for accessibility fixes on the new filters panel? Keyboard focus is broken in the date picker."],
      [SAM, "Yes, two points. Aisha, can you take it alongside the alerts work?"],
      ["Aisha Rahman", "Yes, they touch the same components."],
      [SAM, "So the sprint is: Bazaarvoice queue and backfill, eight points, Diego. Alerts frontend, eight points, Aisha. Alerts job, five points. Accessibility, two points. Index migration, three points. That's twenty-six, which leaves some buffer."],
      [MAYA, "Good. I'll let Cobalt know alerts are targeted for the end of this sprint."],
      [SAM, "Thanks, all. Standup tomorrow at nine thirty as usual."],
    ],
    summary:
      "Sprint 42 planning with about 32 points of capacity, since Diego is out for two days, and 14 points of carry-over. The team prioritised the Bazaarvoice queue and backfill for the Harbor & Pine pilot, followed by theme alerts for Cobalt Fitness. Alerts will be per theme with an optional category filter and use a simple week-over-week spike rule for version one. A new dashboard index cut P95 query time from 4.2 s to 600 ms in staging and will be migrated during the Saturday maintenance window. Committed scope is 26 points, leaving a small buffer.",
    keyTopics: [
      "Bazaarvoice connector and backfill",
      "Theme alerts design",
      "Alert spike threshold",
      "Dashboard query performance",
      "Accessibility fixes",
    ],
    decisions: [
      {
        description: "Theme alerts are per theme, with an optional product-category filter.",
        context: "All six user interviews framed problems as themes rather than categories; revisit after Cobalt has used it for a month.",
      },
      {
        description: "Use a week-over-week spike rule for v1 alerts: at least a 50% increase and a minimum of 20 mentions.",
        context: "Avoids building a statistical model for v1 while keeping small themes from creating noise.",
      },
      {
        description: "Run the dashboard index migration in the Saturday maintenance window.",
        context: "The comments table is large, so the migration needs a runbook and a low-traffic window.",
      },
    ],
    actionItems: [
      { description: "Finish the Bazaarvoice export queue and twelve-month backfill job", assignee: "Diego Alvarez", dueInDays: 3, status: "IN_PROGRESS", turn: 4 },
      { description: "Build the theme alerts frontend and email template", assignee: "Aisha Rahman", dueInDays: 10, status: "OPEN", turn: 8 },
      { description: "Review the CSV export encoding fix", assignee: SAM, dueInDays: -2, status: "DONE", turn: 14 },
      { description: "Write the runbook for the dashboard index migration", assignee: SAM, dueInDays: 3, status: "IN_PROGRESS", turn: 16 },
      { description: "Fix keyboard focus in the filters panel date picker", assignee: "Aisha Rahman", dueInDays: 7, status: "OPEN", turn: 18 },
      { description: "Tell Cobalt Fitness that alerts are targeted for the end of the sprint", assignee: MAYA, dueInDays: -1, status: "DONE", turn: 21 },
    ],
    followupEmail: `Subject: Sprint 42 plan

Hi team,

Here is the plan we agreed this morning.

Committed scope (26 of ~32 points)
- Bazaarvoice export queue and backfill, 8 points (Diego)
- Theme alerts frontend and email template, 8 points (Aisha)
- Theme alerts job, 5 points
- Filters panel accessibility fixes, 2 points (Aisha)
- Dashboard index migration, 3 points (Sam)

Decisions
- Alerts are per theme, with an optional category filter.
- v1 alerts use a week-over-week spike rule: +50% and at least 20 mentions. The threshold is configurable but not in the UI yet.
- The index migration runs in the Saturday maintenance window.

Action items
- Sam: review the CSV encoding fix today and write the migration runbook.
- Maya: let Cobalt Fitness know alerts land at the end of the sprint.

Standup tomorrow at 9:30 as usual.

Sam`,
  },
  {
    id: "6f1c2a0e-4b7d-4c1a-9e3f-5d0e1a2b3d03",
    title: "Client kickoff — Cobalt Fitness",
    daysAgo: 5,
    hour: 16,
    createdBy: "jordan",
    turns: [
      [JORDAN, "Welcome, Elena and Marcus, and thanks for signing. The goal today is to agree what success looks like for the first ninety days, who owns what, and how we'll communicate."],
      ["Elena Petrova", "Thanks, Jordan. For context, we have 38 clubs and about 120,000 members. Cancellations are our biggest problem. Members tell us why in the exit survey and in app reviews, but we don't act on it fast enough."],
      [MAYA, "What would success look like at ninety days, in your words?"],
      ["Elena Petrova", "Two things. First, a weekly view of the top five reasons members cancel, by club. Second, at least one change we've made because of it, with a measurable effect on cancellations."],
      [JORDAN, "That's a good, concrete bar. Let's write it down as the success criteria: weekly top five cancellation reasons by club, and one shipped change with a measured impact by day ninety."],
      ["Elena Petrova", "Agreed."],
      [SAM, "On the data side, Marcus, which systems are we connecting?"],
      ["Marcus Lee", "The exit survey is in Typeform, app reviews come from the App Store and Google Play, and member support runs in Freshdesk. Every member record in Salesforce also has a club ID."],
      [SAM, "Typeform and Freshdesk are native connectors. App store reviews come through a third-party feed. For club-level breakdowns we'll need to join on member ID from Salesforce."],
      ["Marcus Lee", "I can give you a nightly export of member ID to club ID. I'd rather not open Salesforce API access yet."],
      [SAM, "A nightly SFTP export works. Please include only member ID, club ID and join date. We don't need names or contact details."],
      ["Elena Petrova", "Good, our privacy team will like that."],
      [MAYA, "For communication, we suggest a weekly thirty minute check-in for the first six weeks, then every two weeks, and a shared Slack channel for quick questions."],
      ["Elena Petrova", "Weekly works. Slack is fine, but anything that needs a decision should come by email so it's on record."],
      [JORDAN, "Understood. Decisions by email, quick questions in Slack."],
      ["Marcus Lee", "Timeline question. When would we see the first dashboard?"],
      [SAM, "If Typeform and Freshdesk are connected this week and the SFTP export starts next week, the first themed view could be ready within two weeks."],
      ["Elena Petrova", "That's good timing. Our regional managers meet in three weeks, and I'd love to show them something real."],
      [MAYA, "Then let's aim for a first version a few days before that meeting, so there's time to review it together."],
      ["Elena Petrova", "One more request. I'd like an alert when a new cancellation reason spikes at a specific club."],
      [MAYA, "Theme alerts are planned for our next sprint, and we can add club as a filter."],
      [JORDAN, "To summarise: success criteria are agreed, Marcus sends the nightly export with three fields, Sam connects Typeform and Freshdesk this week, and Maya targets the first dashboard before the regional managers meeting."],
      ["Elena Petrova", "Perfect. Thanks, everyone."],
    ],
    summary:
      "Kickoff with Cobalt Fitness (38 clubs, about 120,000 members), whose main goal is reducing cancellations. The 90-day success criteria are a weekly view of the top five cancellation reasons by club and one shipped change with measured impact. Data will come from Typeform, Freshdesk and app store reviews, joined to clubs through a nightly SFTP export limited to member ID, club ID and join date. The team will hold weekly check-ins for six weeks, with decisions confirmed by email. The first dashboard is targeted ahead of Cobalt's regional managers meeting in three weeks.",
    keyTopics: [
      "90-day success criteria",
      "Cancellation reasons by club",
      "Typeform, Freshdesk and app review data",
      "Data minimisation for the club mapping",
      "Communication cadence",
    ],
    decisions: [
      {
        description: "90-day success criteria: weekly top five cancellation reasons by club, plus one shipped change with a measured impact.",
        context: "Proposed by Jordan Ellis from Elena Petrova's goals and agreed on the call.",
      },
      {
        description: "Map members to clubs through a nightly SFTP export limited to member ID, club ID and join date.",
        context: "Cobalt prefers not to grant Salesforce API access yet, and the reduced field list avoids personal data.",
      },
      {
        description: "Decisions are confirmed by email; Slack is for quick questions only.",
        context: "Elena Petrova wants every decision on record.",
      },
    ],
    actionItems: [
      { description: "Send the kickoff recap and success criteria by email", assignee: JORDAN, dueInDays: -4, status: "DONE", turn: 4 },
      { description: "Set up the nightly SFTP export (member ID, club ID, join date)", assignee: "Marcus Lee", dueInDays: 2, status: "IN_PROGRESS", turn: 9 },
      { description: "Create the shared Slack channel and weekly check-in invite", assignee: MAYA, dueInDays: -4, status: "DONE", turn: 12 },
      { description: "Connect Typeform and Freshdesk", assignee: SAM, dueInDays: -2, status: "DONE", turn: 16 },
      { description: "Deliver the first cancellation-themes dashboard before the regional managers meeting", assignee: MAYA, dueInDays: 12, status: "OPEN", turn: 18 },
      { description: "Add club as a filter on theme alerts", assignee: SAM, dueInDays: 8, status: "OPEN", turn: 20 },
    ],
    followupEmail: `Subject: Cobalt Fitness x Lumen: kickoff recap and success criteria

Hi Elena and Marcus,

Thank you for a productive kickoff. As agreed, decisions go by email, so here is the record.

Success criteria for the first 90 days
1. A weekly view of the top five cancellation reasons, by club.
2. At least one change shipped because of it, with a measured effect on cancellations.

Data
- Typeform exit survey and Freshdesk: Sam connects both this week.
- App Store and Google Play reviews: through our review feed.
- Club mapping: a nightly SFTP export from Marcus with member ID, club ID and join date only.

Cadence
- Weekly 30-minute check-in for six weeks, then every two weeks.
- Shared Slack channel for quick questions.

Timeline
- First themed dashboard a few days before your regional managers meeting.
- Theme alerts with a club filter are planned for our next sprint.

Best regards,
Jordan Ellis
Lumen Labs`,
  },
  {
    id: "6f1c2a0e-4b7d-4c1a-9e3f-5d0e1a2b3d04",
    title: "Hiring debrief — Senior Backend Engineer",
    daysAgo: 6,
    hour: 17,
    createdBy: "sam",
    turns: [
      ["Grace Liu", "Thanks for joining. This is the debrief for Daniel Reyes, senior backend engineer. He did four interviews: system design with Sam, coding with Diego, product sense with Maya, and values with Jordan. Let's go around with hire or no hire first, then the evidence."],
      [SAM, "Strong hire from me. In system design he built backpressure into the ingestion pipeline from the start, and when I added a rate-limited source he moved to a queue with per-source concurrency without prompting."],
      ["Grace Liu", "Diego couldn't join, but his written feedback is a hire. Clean, well-tested code, and he finished the exercise with time left. His one concern was that Daniel went quiet when he got stuck on an edge case instead of talking it through."],
      [MAYA, "Hire from me, leaning strong. He asked how customers would use the data before proposing anything, and he pushed back on one of my requirements with a good reason."],
      [JORDAN, "Hire. He was candid about a project that failed at his last company and what he'd do differently. My only question is whether he wants to mentor. He's been the only senior on his team for two years."],
      [SAM, "I asked him about that. He said he misses having juniors to work with, and he gave a concrete example of onboarding an intern. I'm not worried."],
      ["Grace Liu", "On logistics, his expectation is 165,000 base. Our band for the role tops out at 160,000. He also expects a competing offer by the end of next week."],
      [JORDAN, "He's the strongest backend candidate we've seen this year, and the roadmap depends on this hire. I'm comfortable going to 160 base and closing the gap with equity."],
      [MAYA, "Agreed. Losing him would cost us far more than five thousand dollars."],
      [SAM, "I'd like to address Diego's point about going quiet. I'd pair him with a strong communicator on his first project."],
      [JORDAN, "That's reasonable. Sam, would you be his onboarding buddy?"],
      [SAM, "Yes. His first project would be the audit logs work, which is well scoped."],
      ["Grace Liu", "Then the decision is to extend an offer. Do we need references first?"],
      [JORDAN, "Two references, but let's not wait. Make the offer contingent on references so we don't lose him to the competing offer."],
      ["Grace Liu", "Understood. I'll call him tomorrow with a verbal offer and send the written offer the same day."],
      [MAYA, "Can we also ask which of his previous systems he's proudest of? It would help us plan his first ninety days."],
      ["Grace Liu", "I'll add that to the call."],
      [JORDAN, "Good. Thanks, everyone. That was a fast, clear debrief."],
    ],
    summary:
      "Debrief for Daniel Reyes, candidate for Senior Backend Engineer, after four interviews. All interviewers recommended hiring, with Sam Okafor rating him a strong hire for system design; the only concern raised was that he went quiet when stuck during the coding exercise. His salary expectation of $165,000 is above the $160,000 band, and he expects a competing offer next week. The team agreed to offer the top of the band plus equity, contingent on two references, with Sam as onboarding buddy and audit logs as his first project.",
    keyTopics: [
      "Interview feedback",
      "Communication when stuck",
      "Compensation and competing offer",
      "References",
      "Onboarding plan",
    ],
    decisions: [
      {
        description: "Extend an offer to Daniel Reyes for Senior Backend Engineer.",
        context: "Every interviewer recommended hire; Sam Okafor rated him a strong hire.",
      },
      {
        description: "Offer $160,000 base, the top of the band, and close the gap with equity.",
        context: "The candidate expects $165,000 and has a competing offer due next week.",
      },
      {
        description: "Make the offer contingent on two references instead of waiting for them.",
        context: "Avoids losing the candidate to the competing offer.",
      },
      {
        description: "Sam Okafor is Daniel's onboarding buddy, and his first project is audit logs.",
        context: "Addresses Diego's feedback about communication when stuck.",
      },
    ],
    actionItems: [
      { description: "Prepare the equity proposal to close the salary gap", assignee: JORDAN, dueInDays: -5, status: "DONE", turn: 7 },
      { description: "Draft a 30-60-90 day onboarding plan with audit logs as the first project", assignee: SAM, dueInDays: 6, status: "OPEN", turn: 11 },
      { description: "Collect two references for Daniel Reyes", assignee: "Grace Liu", dueInDays: 1, status: "IN_PROGRESS", turn: 13 },
      { description: "Call Daniel with a verbal offer and send the written offer", assignee: "Grace Liu", dueInDays: -5, status: "DONE", turn: 14 },
    ],
    followupEmail: `Subject: Debrief outcome: Daniel Reyes, Senior Backend Engineer

Hi all,

Thanks for the quick debrief. Summary of the outcome:

Decision
- We are extending an offer to Daniel Reyes.
- Base salary of $160,000 (top of band), with additional equity to close the gap to his $165,000 expectation.
- The offer is contingent on two references, so we can move before his competing offer.

Onboarding
- Sam is his onboarding buddy.
- His first project is audit logs.

Action items
- Grace: call Daniel with a verbal offer tomorrow and send the written offer the same day. Ask which past system he is proudest of.
- Grace: collect two references.
- Jordan: prepare the equity proposal.
- Sam: draft a 30-60-90 day onboarding plan.

Grace`,
  },
  {
    id: "6f1c2a0e-4b7d-4c1a-9e3f-5d0e1a2b3d05",
    title: "Product roadmap review — next quarter",
    daysAgo: 8,
    hour: 14,
    createdBy: "maya",
    shareToken: DEMO_SHARE_TOKEN,
    turns: [
      [MAYA, "This is the quarterly roadmap review. I've grouped the candidates into three bets: enterprise readiness, AI weekly summaries, and self-serve onboarding. Realistically we can fund two."],
      [JORDAN, "Let's start with what the pipeline is telling us. Of the last eight enterprise deals, five asked for SSO with SCIM provisioning and three asked for audit logs. Two of those deals are still open."],
      [SAM, "SSO we already have. SCIM and audit logs are about six weeks of work for two engineers. Audit logs are mostly plumbing. SCIM is where the edge cases are."],
      [MAYA, "AI summaries is the bet customers mention most in interviews. People want a weekly paragraph on what changed in their feedback, not just charts."],
      ["Nina Patel", "The prototype tested well. Seven of eight participants said they'd forward the weekly summary to their leadership team. That's the strongest signal we've had for anything this year."],
      [SAM, "The risk with summaries is accuracy. If it states a trend that isn't in the data, we lose trust quickly. I'd want every sentence linked to the underlying comments."],
      ["Nina Patel", "The prototype already does that. Each claim has a show-me-the-comments link."],
      [JORDAN, "And self-serve onboarding?"],
      [MAYA, "Trial-to-paid is at eleven percent. Most trials stall when connecting the first data source. A guided setup could help, but we have no hard data on how much."],
      [JORDAN, "Then I'd fund enterprise readiness and AI summaries, and run a cheap experiment on onboarding instead of a full project."],
      [SAM, "I agree. Enterprise readiness unblocks revenue we can already see, and summaries is our differentiation."],
      [MAYA, "For onboarding, the cheapest experiment is concierge setup. We offer a fifteen minute call to every new trial for a month and measure conversion."],
      ["Nina Patel", "I can design the in-app prompt for that in a day."],
      [JORDAN, "Good. So the decision is: next quarter funds enterprise readiness and AI summaries, and onboarding gets a one-month concierge experiment."],
      [MAYA, "Agreed. On sequencing, I'd ship audit logs first because two open deals are waiting on them, then SCIM, while the summaries team starts in parallel."],
      [SAM, "That works if we hire the second backend engineer by the end of next month. Otherwise summaries slips by about four weeks."],
      [JORDAN, "The hiring debrief for the backend role is this week. Let's treat that hire as a dependency on the roadmap."],
      [MAYA, "I'll write that into the roadmap doc as a risk, with the four-week slip as the fallback."],
      ["Nina Patel", "For summaries, I'd like two more rounds of testing on tone. Some participants felt the draft was too upbeat when the news was bad."],
      [MAYA, "Let's make it neutral by default. We can add a tone setting later if anyone asks for it."],
      [JORDAN, "Last item, external communication. I'd like to share the roadmap themes with customers, without dates."],
      [MAYA, "Themes without dates is fine. I'll prepare a customer-facing version."],
      [JORDAN, "Great. Thanks, everyone."],
    ],
    summary:
      "Quarterly roadmap review of three candidate bets: enterprise readiness, AI weekly summaries and self-serve onboarding. Enterprise asks (SCIM, audit logs) came up in five of the last eight deals, and seven of eight prototype testers said they would forward an AI weekly summary to leadership. The team funded enterprise readiness and AI summaries, and chose a one-month concierge experiment for onboarding instead of a full project, since trial-to-paid sits at 11% with no data on what guided setup would change. Audit logs ship first, and the plan depends on hiring a second backend engineer by the end of next month.",
    keyTopics: [
      "Enterprise readiness: SCIM and audit logs",
      "AI weekly summaries",
      "Onboarding experiment",
      "Hiring dependency",
      "Customer-facing roadmap",
    ],
    decisions: [
      {
        description: "Next quarter funds enterprise readiness (audit logs, SCIM) and AI weekly summaries.",
        context: "Enterprise asks appeared in five of the last eight deals; seven of eight prototype testers would forward the summary.",
      },
      {
        description: "Self-serve onboarding gets a one-month concierge experiment instead of a full project.",
        context: "Trial-to-paid is 11%, but there is no data yet on how much guided setup would help.",
      },
      {
        description: "Ship audit logs before SCIM.",
        context: "Two open deals are waiting on audit logs.",
      },
      {
        description: "AI summaries use a neutral tone by default.",
        context: "Testers found the draft too upbeat when the news was bad.",
      },
      {
        description: "Share roadmap themes with customers, without dates.",
        context: "Jordan Ellis wants customers to see direction without committing to timelines.",
      },
    ],
    actionItems: [
      { description: "Design the in-app prompt for the concierge onboarding experiment", assignee: "Nina Patel", dueInDays: -2, status: "DONE", turn: 12 },
      { description: "Scope audit logs and break the work into tickets", assignee: SAM, dueInDays: 3, status: "IN_PROGRESS", turn: 14 },
      { description: "Add the backend-hire dependency and four-week fallback to the roadmap doc", assignee: MAYA, dueInDays: -3, status: "DONE", turn: 17 },
      { description: "Run two more rounds of tone testing on AI summaries", assignee: "Nina Patel", dueInDays: 7, status: "IN_PROGRESS", turn: 18 },
      { description: "Prepare a customer-facing version of the roadmap themes, without dates", assignee: MAYA, dueInDays: 5, status: "OPEN", turn: 21 },
    ],
    followupEmail: `Subject: Roadmap review: what we are funding next quarter

Hi team,

Thanks for a focused review. Here is where we landed.

Funded
1. Enterprise readiness: audit logs first (two open deals are waiting), then SCIM.
2. AI weekly summaries: every sentence links to its source comments, with a neutral tone by default.

Experiment instead of a project
- Self-serve onboarding: offer a 15-minute concierge setup call to every new trial for one month and measure trial-to-paid (currently 11%).

Risks
- The plan assumes we hire a second backend engineer by the end of next month. If not, summaries slips by about four weeks.

Action items
- Sam: scope audit logs and break the work into tickets.
- Nina: design the concierge prompt and run two more rounds of tone testing.
- Maya: add the hiring dependency to the roadmap doc and prepare a customer-facing version without dates.

Maya`,
  },
];
