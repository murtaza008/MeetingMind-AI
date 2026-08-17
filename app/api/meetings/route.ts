import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireWorkspaceMember } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const q = searchParams.get("q")?.trim();
    if (!workspaceId) return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    await requireWorkspaceMember(userId, workspaceId);

    const meetings = await prisma.meeting.findMany({
      where: {
        workspaceId,
        ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      },
      orderBy: { meetingDate: "desc" },
      include: {
        workspace: { select: { name: true } },
        creator: { select: { displayName: true, email: true } },
        actionItems: { select: { status: true } },
      },
    });

    return NextResponse.json(
      meetings.map((m) => ({
        id: m.id,
        title: m.title,
        meetingDate: m.meetingDate,
        durationSeconds: m.durationSeconds,
        status: m.status,
        workspaceId: m.workspaceId,
        workspaceName: m.workspace.name,
        openActionCount: m.actionItems.filter((a) => a.status === "OPEN").length,
        actionCount: m.actionItems.length,
        creatorName: m.creator.displayName ?? m.creator.email,
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
