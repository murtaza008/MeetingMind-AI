import { prisma } from "@/lib/prisma";
import { DEMO_DAILY_UPLOAD_LIMIT, DEMO_MAX_AUDIO_SECONDS } from "@/lib/demo";

/** Some containers report a fraction of a second over; don't reject a clean 3:00 clip. */
const DURATION_TOLERANCE_SECONDS = 2;

export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** How many of today's shared demo uploads are already used. */
export async function demoUploadsUsedToday(): Promise<number> {
  const row = await prisma.demoUsage.findUnique({ where: { day: utcDayKey() } });
  return row?.uploads ?? 0;
}

/**
 * Atomically claims one of today's demo upload slots. Returns false when the
 * cap is reached. A single conditional upsert, so two visitors uploading at
 * the same moment can't both slip past the limit.
 */
export async function claimDemoUploadSlot(): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ uploads: number }[]>`
    INSERT INTO "DemoUsage" ("day", "uploads") VALUES (${utcDayKey()}, 1)
    ON CONFLICT ("day") DO UPDATE SET "uploads" = "DemoUsage"."uploads" + 1
    WHERE "DemoUsage"."uploads" < ${DEMO_DAILY_UPLOAD_LIMIT}
    RETURNING "uploads"`;
  return rows.length > 0;
}

/**
 * Best-effort server-side duration check. The client-reported duration is
 * checked first; when the container header carries a duration (WAV, MP3, M4A,
 * most uploaded files) it is checked too, so an edited request can't sneak a
 * long recording past the cap.
 */
export async function isWithinDemoDuration(buffer: Buffer, mimeType: string, reportedSeconds: number) {
  const max = DEMO_MAX_AUDIO_SECONDS + DURATION_TOLERANCE_SECONDS;
  if (!(reportedSeconds > 0) || reportedSeconds > max) return false;
  try {
    const { parseBuffer } = await import("music-metadata");
    const metadata = await parseBuffer(new Uint8Array(buffer), { mimeType }, { duration: true });
    const parsed = metadata.format.duration;
    if (parsed && Number.isFinite(parsed) && parsed > max) return false;
  } catch {
    // Unparseable container (e.g. a streamed MediaRecorder webm): fall back to the reported duration.
  }
  return true;
}
