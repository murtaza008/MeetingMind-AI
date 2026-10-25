import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { forbidInDemo, requireSessionUser } from "@/lib/session";
import { requireOrgMember } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

/** Toggles a public read-only share link for this meeting on/off. */
export async function POST(_request: Request, ctx: RouteContext<"/api/meetings/[id]/share">) {
  try {
    const { id } = await ctx.params;
    const user = await requireSessionUser();
    const meeting = await prisma.meeting.findUnique({ where: { id }, include: { workspace: true } });
    if (!meeting) return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    await requireOrgMember(user.id, meeting.workspace.orgId);
    // Visitors may share a meeting, but not break a link someone else was given.
    if (meeting.shareToken) forbidInDemo(user, "Turning off a share link");

    const updated = await prisma.meeting.update({
      where: { id },
      data: { shareToken: meeting.shareToken ? null : randomUUID() },
    });
    return NextResponse.json({ shareToken: updated.shareToken });
  } catch (error) {
    return handleApiError(error);
  }
}
