import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireOrgMember } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

export async function GET(_request: Request, ctx: RouteContext<"/api/meetings/[id]/audio">) {
  try {
    const { id } = await ctx.params;
    const userId = await requireUserId();
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      select: { audio: true, audioMimeType: true, workspace: { select: { orgId: true } } },
    });
    if (!meeting || !meeting.audio) {
      return NextResponse.json({ error: "No audio stored for this meeting." }, { status: 404 });
    }
    await requireOrgMember(userId, meeting.workspace.orgId);

    return new NextResponse(new Uint8Array(meeting.audio), {
      headers: {
        "Content-Type": meeting.audioMimeType ?? "audio/webm",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
