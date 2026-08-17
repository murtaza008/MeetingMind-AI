import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireOrgMember } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    await requireOrgMember(userId, orgId);

    const items = await prisma.actionItem.findMany({
      where: { meeting: { workspace: { orgId } } },
      orderBy: { createdAt: "desc" },
      include: { meeting: { select: { id: true, title: true, meetingDate: true } } },
    });

    return NextResponse.json(
      items.map((i) => ({
        id: i.id,
        meetingId: i.meetingId,
        description: i.description,
        assigneeLabel: i.assigneeLabel,
        dueDate: i.dueDate,
        status: i.status,
        meeting: i.meeting,
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
