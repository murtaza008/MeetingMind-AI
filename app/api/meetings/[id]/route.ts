import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireOrgMember } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";
import { MEETING_DETAIL_INCLUDE, shapeMeetingDetail } from "@/lib/meetings";

export async function GET(_request: Request, ctx: RouteContext<"/api/meetings/[id]">) {
  try {
    const { id } = await ctx.params;
    const userId = await requireUserId();
    const meeting = await prisma.meeting.findUnique({ where: { id }, include: MEETING_DETAIL_INCLUDE });
    if (!meeting) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    await requireOrgMember(userId, meeting.workspace.orgId);

    return NextResponse.json(shapeMeetingDetail(meeting));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/meetings/[id]">) {
  try {
    const { id } = await ctx.params;
    const userId = await requireUserId();
    const meeting = await prisma.meeting.findUnique({ where: { id }, include: { workspace: true } });
    if (!meeting) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    await requireOrgMember(userId, meeting.workspace.orgId);

    await prisma.meeting.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
