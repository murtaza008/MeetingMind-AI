import { readFile } from "node:fs/promises";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "./generated/prisma/client";
import { DEMO_EMAIL } from "./demo";
// Written by scripts/demo-audio/generate.mts alongside prisma/demo-audio/*.mp3.
import demoAudio from "./demo-audio.json";
import {
  DEMO_MEETINGS,
  DEMO_ORG_ID,
  DEMO_ORG_NAME,
  DEMO_ORG_SLUG,
  DEMO_PEOPLE,
  DEMO_WORKSPACE_ID,
  DEMO_WORKSPACE_NAME,
  type DemoPersonKey,
} from "./demo-data";

const DAY_MS = 24 * 60 * 60 * 1000;
// Spoken English runs ~150 words a minute; derive segment timing from that so
// the seeded transcripts carry believable, gap-free start/end seconds.
const WORDS_PER_SECOND = 2.3;

/** Email addresses reserved for the demo; nobody else may sign up with these domains. */
export const DEMO_RESERVED_DOMAINS = ["meetingmind.demo", "lumenlabs.demo"];

function startOfUtcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

type DemoAudio = { file: string; durationSeconds: number; segments: number[][] };

/** The generated recording for a meeting, if its timings still line up with the transcript. */
function audioFor(meetingId: string, turnCount: number): DemoAudio | null {
  const audio = (demoAudio as Record<string, DemoAudio>)[meetingId];
  if (!audio) return null;
  if (audio.segments.length !== turnCount) {
    console.warn(`Demo audio for ${meetingId} is stale; run scripts/demo-audio/generate.mts.`);
    return null;
  }
  return audio;
}

function buildSegments(turns: [string, string][], audio: DemoAudio | null) {
  if (audio) {
    return turns.map(([speaker, text], i) => ({ speaker, start: audio.segments[i][0], end: audio.segments[i][1], text }));
  }
  let cursor = 0;
  return turns.map(([speaker, text]) => {
    const seconds = Math.max(2, Math.round(text.split(/\s+/).length / WORDS_PER_SECOND));
    const segment = { speaker, start: cursor, end: cursor + seconds, text };
    cursor += seconds;
    return segment;
  });
}

/**
 * Wipes and rebuilds the public demo organization. Only rows owned by the demo
 * accounts are touched: the demo org (whose cascade also removes meetings and
 * audio that visitors uploaded), the demo users' memberships, and the daily
 * upload counter. Real users and their orgs are never read or written.
 */
export async function resetDemoData(prisma: PrismaClient, options: { password: string; now?: Date }) {
  const { password } = options;
  if (!password || password.length < 16) {
    throw new Error("DEMO_PASSWORD must be set to a random value of at least 16 characters.");
  }
  const now = options.now ?? new Date();
  const today = startOfUtcDay(now);
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(
    async (tx) => {
      const userIds = {} as Record<DemoPersonKey, string>;
      for (const [key, person] of Object.entries(DEMO_PEOPLE) as [DemoPersonKey, (typeof DEMO_PEOPLE)[DemoPersonKey]][]) {
        // Teammates never get a password: they exist to own action items, not to sign in.
        const hash = person.email === DEMO_EMAIL ? passwordHash : null;
        const user = await tx.user.upsert({
          where: { email: person.email },
          update: { passwordHash: hash, displayName: person.name, avatarUrl: null },
          create: { email: person.email, passwordHash: hash, displayName: person.name },
        });
        userIds[key] = user.id;
      }
      const demoUserIds = Object.values(userIds);

      // Deleting the org cascades to its workspaces, meetings (and their stored
      // audio), transcripts, summaries, decisions, action items and invites.
      const removedOrgs = await tx.org.deleteMany({
        where: { OR: [{ id: DEMO_ORG_ID }, { createdBy: { in: demoUserIds } }] },
      });
      await tx.orgMember.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.demoUsage.deleteMany({});

      await tx.org.create({
        data: {
          id: DEMO_ORG_ID,
          name: DEMO_ORG_NAME,
          slug: DEMO_ORG_SLUG,
          plan: "BUSINESS",
          createdBy: userIds.jordan,
          createdAt: new Date(today - DEMO_PEOPLE.jordan.joinedDaysAgo * DAY_MS),
        },
      });
      await tx.orgMember.createMany({
        data: (Object.keys(DEMO_PEOPLE) as DemoPersonKey[]).map((key) => ({
          orgId: DEMO_ORG_ID,
          userId: userIds[key],
          role: DEMO_PEOPLE[key].role,
          createdAt: new Date(today - DEMO_PEOPLE[key].joinedDaysAgo * DAY_MS),
        })),
      });
      await tx.workspace.create({
        data: {
          id: DEMO_WORKSPACE_ID,
          orgId: DEMO_ORG_ID,
          name: DEMO_WORKSPACE_NAME,
          slug: "lumen-hq",
          createdAt: new Date(today - DEMO_PEOPLE.jordan.joinedDaysAgo * DAY_MS),
        },
      });

      let actionItemCount = 0;
      for (const meeting of DEMO_MEETINGS) {
        const audio = audioFor(meeting.id, meeting.turns.length);
        const segments = buildSegments(meeting.turns, audio);
        const durationSeconds = audio?.durationSeconds ?? Math.round(segments.at(-1)?.end ?? 0);
        const meetingDate = new Date(today - meeting.daysAgo * DAY_MS + meeting.hour * 60 * 60 * 1000);
        const processedAt = new Date(meetingDate.getTime() + (durationSeconds + 45) * 1000);
        // Small offsets keep the createdAt ordering (used by the UI) stable.
        const at = (offsetMs: number) => new Date(processedAt.getTime() + offsetMs);

        await tx.meeting.create({
          data: {
            id: meeting.id,
            workspaceId: DEMO_WORKSPACE_ID,
            title: meeting.title,
            meetingDate,
            durationSeconds,
            status: "READY",
            shareToken: meeting.shareToken ?? null,
            createdById: userIds[meeting.createdBy],
            createdAt: processedAt,
            audioMimeType: audio ? "audio/mpeg" : null,
            transcript: {
              create: {
                fullText: segments.map((s) => `${s.speaker}: ${s.text}`).join("\n"),
                segments,
                createdAt: processedAt,
              },
            },
            summary: {
              create: {
                summaryText: meeting.summary,
                keyTopics: meeting.keyTopics,
                followupEmail: meeting.followupEmail,
                generatedAt: processedAt,
              },
            },
            decisions: {
              create: meeting.decisions.map((d, i) => ({ ...d, createdAt: at(i) })),
            },
            actionItems: {
              create: meeting.actionItems.map((a, i) => ({
                description: a.description,
                assigneeLabel: a.assignee,
                // Stored as UTC midnight, the same shape Gemini's YYYY-MM-DD dates are saved in.
                dueDate: new Date(today + a.dueInDays * DAY_MS),
                status: a.status,
                sourceSegmentRef: segments[a.turn]?.start ?? null,
                createdAt: at(i),
              })),
            },
          },
          select: { id: true },
        });
        actionItemCount += meeting.actionItems.length;
      }

      return {
        removedOrgs: removedOrgs.count,
        meetings: DEMO_MEETINGS.length,
        actionItems: actionItemCount,
        members: demoUserIds.length,
      };
    },
    { maxWait: 15_000, timeout: 45_000 },
  );

  // Recordings are a few MB in total, so they're written after the
  // transaction to keep it short. A missing file only costs the audio player.
  let recordings = 0;
  for (const meeting of DEMO_MEETINGS) {
    const audio = audioFor(meeting.id, meeting.turns.length);
    if (!audio) continue;
    try {
      const bytes = await readFile(join(process.cwd(), "prisma", "demo-audio", audio.file));
      await prisma.meeting.update({ where: { id: meeting.id }, data: { audio: bytes }, select: { id: true } });
      recordings++;
    } catch (error) {
      console.error(`Could not attach demo audio ${audio.file}`, error);
      await prisma.meeting.update({ where: { id: meeting.id }, data: { audioMimeType: null }, select: { id: true } });
    }
  }
  return { ...result, recordings };
}
