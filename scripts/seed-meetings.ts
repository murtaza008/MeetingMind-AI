/**
 * Seeds demo meetings into an existing user's workspace.
 *
 *   npx tsx scripts/seed-meetings.ts --dry     # show what it would do, write nothing
 *   npx tsx scripts/seed-meetings.ts           # actually insert
 *   npx tsx scripts/seed-meetings.ts you@mail.com
 *
 * Safe to re-run: meetings are matched by title inside the workspace, so an
 * existing meeting is skipped rather than duplicated.
 *
 * All three meetings share the same audio file (scripts/demo-meeting.wav) —
 * only the first one's transcript matches what the audio actually says. The
 * other two carry their own written transcripts so their detail pages don't
 * look like copies of each other. The transcripts/summaries here are written
 * by hand, not real Gemini output: upload a recording in the app to see the
 * real pipeline run.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const DRY_RUN = process.argv.includes("--dry");
const EMAIL = (
  process.argv.slice(2).find((a) => !a.startsWith("--")) ??
  process.env.SEED_USER_EMAIL ??
  "murtazaaa7798@gmail.com"
).toLowerCase();

const AUDIO_PATH = join(import.meta.dirname, "demo-meeting.wav");
const AUDIO_MIME = "audio/wav";
const AUDIO_SECONDS = 38;

type Segment = { speaker: string; start: number; end: number; text: string };

type SeedMeeting = {
  title: string;
  /** Days ago the meeting happened — staggers the list so it looks lived-in. */
  daysAgo: number;
  segments: Segment[];
  summary: string;
  keyTopics: string[];
  followupEmail: string;
  decisions: { description: string; context: string }[];
  actionItems: {
    description: string;
    assigneeLabel: string;
    inDays: number;
    status?: "OPEN" | "DONE";
  }[];
};

const MEETINGS: SeedMeeting[] = [
  {
    // This one matches scripts/demo-meeting.wav word for word.
    title: "Q3 Planning — Leadership Sync",
    daysAgo: 2,
    segments: [
      {
        speaker: "Alice",
        start: 0,
        end: 8.2,
        text: "Good morning everyone. Let's keep this short. We need to finalise the Q3 marketing budget by Friday.",
      },
      {
        speaker: "Bob",
        start: 8.8,
        end: 15.1,
        text: "Agreed. I'll pull the updated numbers from finance and send them across by tomorrow afternoon.",
      },
      {
        speaker: "Alice",
        start: 15.7,
        end: 24.3,
        text: "Perfect. The other thing, the Henderson contract renewal is coming up in three weeks and nobody has spoken to them yet.",
      },
      {
        speaker: "Bob",
        start: 24.9,
        end: 31.2,
        text: "I'll reach out to Henderson this week and set up a call before the renewal date.",
      },
      {
        speaker: "Alice",
        start: 31.8,
        end: 37.9,
        text: "Great. So Friday for the budget, and Henderson gets a call this week. That's everything.",
      },
    ],
    summary:
      "Alice opened the sync to lock down the Q3 marketing budget, setting Friday as the deadline. Bob agreed and committed to pulling updated figures from finance by tomorrow afternoon. Alice then raised the Henderson contract renewal, due in three weeks with no contact made yet. Bob took ownership of reaching out to Henderson and booking a call ahead of the renewal date.",
    keyTopics: ["Q3 marketing budget", "Updated finance figures", "Henderson contract renewal"],
    followupEmail:
      "Hi team,\n\nQuick recap of today's sync. We're finalising the Q3 marketing budget by Friday. Bob is sending the updated numbers from finance tomorrow afternoon, and will contact Henderson this week to set up a call before their renewal date.\n\nThanks,\nAlice",
    decisions: [
      {
        description: "The Q3 marketing budget will be finalised by Friday.",
        context: "Alice set the deadline and Bob confirmed the finance figures would arrive in time.",
      },
    ],
    actionItems: [
      {
        description: "Pull updated budget numbers from finance and send them to the team",
        assigneeLabel: "Bob",
        inDays: 1,
      },
      {
        description: "Contact Henderson and book a call before the contract renewal date",
        assigneeLabel: "Bob",
        inDays: 5,
      },
    ],
  },
  {
    title: "Product Roadmap Review",
    daysAgo: 6,
    segments: [
      {
        speaker: "Alice",
        start: 0,
        end: 9.4,
        text: "We have three things fighting for the same slot this quarter, so let's decide today rather than carry it again.",
      },
      {
        speaker: "Bob",
        start: 10.1,
        end: 19.6,
        text: "Bulk import is the one customers keep asking for. The reporting rebuild is bigger, but nobody has blocked on it yet.",
      },
      {
        speaker: "Alice",
        start: 20.2,
        end: 28.8,
        text: "Then bulk import ships this quarter and the reporting rebuild moves to Q4. I'll update the roadmap today.",
      },
      {
        speaker: "Bob",
        start: 29.4,
        end: 37.5,
        text: "Works for me. I'll write the spec for bulk import and get it in front of engineering by Thursday.",
      },
    ],
    summary:
      "The team resolved a scheduling conflict between three competing roadmap items. Bob argued that bulk import had the strongest customer demand, while the reporting rebuild had no blocked customers. Alice decided to ship bulk import this quarter and push the reporting rebuild to Q4, and will update the roadmap the same day. Bob committed to writing the bulk import spec for engineering by Thursday.",
    keyTopics: ["Roadmap prioritisation", "Bulk import", "Reporting rebuild", "Q4 planning"],
    followupEmail:
      "Hi team,\n\nRoadmap decision from today: bulk import ships this quarter, the reporting rebuild moves to Q4. I'm updating the roadmap now, and Bob has the bulk import spec going to engineering by Thursday.\n\nThanks,\nAlice",
    decisions: [
      {
        description: "Bulk import ships this quarter; the reporting rebuild moves to Q4.",
        context: "Customer demand for bulk import outweighed the reporting rebuild, which had no blocked customers.",
      },
    ],
    actionItems: [
      {
        description: "Update the public roadmap with the revised quarter plan",
        assigneeLabel: "Alice",
        inDays: -5,
        status: "DONE",
      },
      {
        description: "Write the bulk import spec and hand it to engineering",
        assigneeLabel: "Bob",
        inDays: -2,
        status: "DONE",
      },
    ],
  },
  {
    title: "Client Onboarding — Vertex Logistics",
    daysAgo: 11,
    segments: [
      {
        speaker: "Alice",
        start: 0,
        end: 8.9,
        text: "Vertex signed last week. They run a forty truck fleet, so the priority is getting their routes imported cleanly.",
      },
      {
        speaker: "Bob",
        start: 9.5,
        end: 18.7,
        text: "Their data is in two different systems. I'd rather we do the import for them the first time than hand them a CSV template.",
      },
      {
        speaker: "Alice",
        start: 19.3,
        end: 28.1,
        text: "Agreed, we'll handle the first import ourselves. Let's target go live on the fifteenth so they're running before Q4.",
      },
      {
        speaker: "Bob",
        start: 28.7,
        end: 37.6,
        text: "I'll schedule the training session with their ops team and send Sarah the onboarding checklist this week.",
      },
    ],
    summary:
      "Following Vertex Logistics signing, the team planned their onboarding around a forty truck fleet and route data split across two systems. Bob recommended handling the first data import internally rather than sending the client a CSV template, and Alice agreed. The team set a go-live target of the fifteenth so Vertex is operational before Q4. Bob will schedule training with the client's ops team and send the onboarding checklist.",
    keyTopics: ["Vertex Logistics onboarding", "Route data import", "Go-live date", "Ops training"],
    followupEmail:
      "Hi team,\n\nVertex onboarding plan: we're handling their first route import ourselves rather than sending a template, and targeting go-live on the fifteenth. Bob is scheduling training with their ops team and sending Sarah the onboarding checklist this week.\n\nThanks,\nAlice",
    decisions: [
      {
        description: "We will run the first route data import for Vertex ourselves instead of sending a CSV template.",
        context: "Their route data sits across two systems, making a self-serve import error prone.",
      },
      {
        description: "Vertex go-live is targeted for the fifteenth.",
        context: "Chosen so the client is fully running before Q4 begins.",
      },
    ],
    actionItems: [
      {
        description: "Schedule the training session with the Vertex ops team",
        assigneeLabel: "Bob",
        inDays: -6,
        status: "DONE",
      },
      {
        description: "Send Sarah the onboarding checklist",
        assigneeLabel: "Bob",
        inDays: 2,
      },
    ],
  },
];

function shiftDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — check your .env file.");
  }

  // Prisma's Bytes field wants a Uint8Array backed by a plain ArrayBuffer;
  // Node's Buffer is backed by ArrayBufferLike, so copy it into a fresh one.
  let audio: Uint8Array<ArrayBuffer>;
  try {
    const file = readFileSync(AUDIO_PATH);
    audio = new Uint8Array(new ArrayBuffer(file.byteLength));
    audio.set(file);
  } catch {
    throw new Error(
      `Could not read ${AUDIO_PATH}.\n` +
        "  Generate it first, or drop any short .wav there under that name.",
    );
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (!user) {
      console.error(`\n✗ No user found with email "${EMAIL}" in this database.`);
      console.error(
        "  The DATABASE_URL in .env may point to a different database than your\n" +
          "  deployed app uses. Re-run with that connection string, e.g.\n" +
          '  DATABASE_URL="postgresql://…" npx tsx scripts/seed-meetings.ts\n',
      );
      process.exitCode = 1;
      return;
    }

    const membership = await prisma.orgMember.findFirst({
      where: { userId: user.id },
      include: { org: { include: { workspaces: { orderBy: { createdAt: "asc" } } } } },
      orderBy: { createdAt: "asc" },
    });
    const workspace = membership?.org.workspaces[0];
    if (!membership || !workspace) {
      console.error(
        `\n✗ ${EMAIL} exists but has no org/workspace yet.\n` +
          "  Log into the app and finish onboarding first, then re-run this script.\n",
      );
      process.exitCode = 1;
      return;
    }

    console.log(`\nUser:      ${user.email} (${user.displayName ?? "no name"})`);
    console.log(`Org:       ${membership.org.name}`);
    console.log(`Workspace: ${workspace.name} [${workspace.id}]`);
    console.log(`Audio:     ${(audio.length / 1024).toFixed(0)} KB, ~${AUDIO_SECONDS}s`);
    console.log(`Mode:      ${DRY_RUN ? "DRY RUN — nothing will be written" : "WRITE"}\n`);

    let created = 0;
    let skipped = 0;

    for (const meeting of MEETINGS) {
      const existing = await prisma.meeting.findFirst({
        where: { workspaceId: workspace.id, title: meeting.title },
        select: { id: true },
      });

      if (existing) {
        console.log(`  – ${meeting.title} — already exists, skipped`);
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(
          `  + ${meeting.title} — ${meeting.segments.length} segments, ` +
            `${meeting.decisions.length} decision(s), ${meeting.actionItems.length} action item(s)`,
        );
        created++;
        continue;
      }

      const meetingDate = shiftDays(-meeting.daysAgo);

      // Writing ~1.6 MB of audio over Neon's serverless driver takes far longer
      // than Prisma's 5s default interactive-transaction timeout.
      await prisma.$transaction(async (tx) => {
        const row = await tx.meeting.create({
          data: {
            workspaceId: workspace.id,
            createdById: user.id,
            title: meeting.title,
            meetingDate,
            createdAt: meetingDate,
            durationSeconds: AUDIO_SECONDS,
            audio,
            audioMimeType: AUDIO_MIME,
            status: "READY",
          },
        });

        await tx.transcript.create({
          data: {
            meetingId: row.id,
            // Matches how app/api/meetings/upload/route.ts builds fullText.
            fullText: meeting.segments.map((s) => `${s.speaker}: ${s.text}`).join("\n"),
            segments: meeting.segments,
            createdAt: meetingDate,
          },
        });

        await tx.meetingSummary.create({
          data: {
            meetingId: row.id,
            summaryText: meeting.summary,
            keyTopics: meeting.keyTopics,
            followupEmail: meeting.followupEmail,
            generatedAt: meetingDate,
          },
        });

        if (meeting.decisions.length) {
          await tx.decision.createMany({
            data: meeting.decisions.map((d) => ({
              meetingId: row.id,
              description: d.description,
              context: d.context,
              createdAt: meetingDate,
            })),
          });
        }

        if (meeting.actionItems.length) {
          await tx.actionItem.createMany({
            data: meeting.actionItems.map((a) => ({
              meetingId: row.id,
              description: a.description,
              assigneeLabel: a.assigneeLabel,
              dueDate: shiftDays(a.inDays),
              status: a.status ?? "OPEN",
              createdAt: meetingDate,
            })),
          });
        }
      }, { timeout: 120_000, maxWait: 30_000 });

      console.log(
        `  + ${meeting.title} — ${meeting.segments.length} segments, ` +
          `${meeting.decisions.length} decision(s), ${meeting.actionItems.length} action item(s)`,
      );
      created++;
    }

    console.log(
      `\n${DRY_RUN ? "Would add" : "Added"} ${created} meeting${created === 1 ? "" : "s"}` +
        (skipped ? `, skipped ${skipped} that already existed.` : ".") +
        "\n",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\nSeed failed:", error instanceof Error ? error.message : error, "\n");
  process.exit(1);
});
