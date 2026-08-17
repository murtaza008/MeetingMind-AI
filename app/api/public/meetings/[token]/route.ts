import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/handle-error";
import { MEETING_DETAIL_INCLUDE, shapeMeetingDetail } from "@/lib/meetings";

/** Unauthenticated read-only view for a meeting's share link. No audio, transcript/summary only. */
export async function GET(_request: Request, ctx: RouteContext<"/api/public/meetings/[token]">) {
  try {
    const { token } = await ctx.params;
    const meeting = await prisma.meeting.findUnique({
      where: { shareToken: token },
      include: MEETING_DETAIL_INCLUDE,
    });
    if (!meeting) {
      return NextResponse.json({ error: "This link is invalid or no longer shared." }, { status: 404 });
    }
    return NextResponse.json(shapeMeetingDetail(meeting));
  } catch (error) {
    return handleApiError(error);
  }
}
