import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/org";
import { analyzeMeetingAudio } from "@/lib/gemini";
import { FREE_AUDIO_MAX_BYTES, FREE_MEETING_LIMIT } from "@/lib/plans";
import { handleApiError } from "@/lib/handle-error";

// Longest a single request can run before the platform kills it. Gemini
// audio analysis of a long recording can take a while on the free tier —
// see README "Known issues" for the tradeoff this implies on Vercel Hobby.
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const form = await request.formData();
    const file = form.get("file");
    const title = form.get("title");
    const workspaceId = form.get("workspaceId");
    const durationSecondsRaw = form.get("durationSeconds");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No audio file provided." }, { status: 400 });
    }
    if (typeof workspaceId !== "string" || !workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId." }, { status: 400 });
    }
    if (file.size > FREE_AUDIO_MAX_BYTES) {
      return NextResponse.json(
        { error: `That file is too large — keep recordings under ${Math.round(FREE_AUDIO_MAX_BYTES / (1024 * 1024))}MB.` },
        { status: 413 },
      );
    }

    const { workspace } = await requireWorkspaceMember(userId, workspaceId);
    const org = await prisma.org.findUniqueOrThrow({ where: { id: workspace.orgId } });

    if (org.plan === "FREE") {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const count = await prisma.meeting.count({
        where: { workspace: { orgId: org.id }, createdAt: { gte: monthStart } },
      });
      if (count >= FREE_MEETING_LIMIT) {
        return NextResponse.json(
          {
            error: `The Free plan allows ${FREE_MEETING_LIMIT} meetings per month. Upgrade to Team in Billing for unlimited meetings.`,
          },
          { status: 402 },
        );
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const durationSeconds = Number(durationSecondsRaw) || 0;
    const mimeType = file.type || "audio/webm";
    const meetingTitle =
      typeof title === "string" && title.trim()
        ? title.trim()
        : file.name.replace(/\.[^.]+$/, "") || "Untitled meeting";

    const meeting = await prisma.meeting.create({
      data: {
        workspaceId,
        title: meetingTitle,
        durationSeconds: Math.round(durationSeconds),
        audio: buffer,
        audioMimeType: mimeType,
        status: "PROCESSING",
        createdById: userId,
      },
    });

    try {
      const analysis = await analyzeMeetingAudio({ buffer, mimeType, durationSeconds });

      await prisma.$transaction([
        prisma.transcript.create({
          data: {
            meetingId: meeting.id,
            fullText: analysis.segments.map((s) => `${s.speaker}: ${s.text}`).join("\n"),
            segments: analysis.segments,
          },
        }),
        prisma.meetingSummary.create({
          data: {
            meetingId: meeting.id,
            summaryText: analysis.summary,
            keyTopics: analysis.keyTopics,
            followupEmail: analysis.followupEmail,
          },
        }),
        ...(analysis.decisions.length
          ? [
              prisma.decision.createMany({
                data: analysis.decisions.map((d) => ({
                  meetingId: meeting.id,
                  description: d.description,
                  context: d.context,
                })),
              }),
            ]
          : []),
        ...(analysis.actionItems.length
          ? [
              prisma.actionItem.createMany({
                data: analysis.actionItems.map((a) => ({
                  meetingId: meeting.id,
                  description: a.description,
                  assigneeLabel: a.assignee || "Unassigned",
                  dueDate: a.dueDate ? new Date(a.dueDate) : null,
                  sourceSegmentRef: a.at,
                })),
              }),
            ]
          : []),
        prisma.meeting.update({ where: { id: meeting.id }, data: { status: "READY" } }),
      ], { timeout: 20000 });
    } catch (aiError) {
      const message = aiError instanceof Error ? aiError.message : "Processing failed.";
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: "FAILED", error: message },
      });
    }

    return NextResponse.json({ id: meeting.id }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
