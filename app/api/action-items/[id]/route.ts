import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { requireOrgMember } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

const UpdateInput = z.object({
  status: z.enum(["OPEN", "DONE"]).optional(),
  assigneeLabel: z.string().trim().max(120).optional(),
  dueDate: z.string().nullable().optional(),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/action-items/[id]">) {
  try {
    const { id } = await ctx.params;
    const userId = await requireUserId();
    const item = await prisma.actionItem.findUnique({
      where: { id },
      include: { meeting: { include: { workspace: true } } },
    });
    if (!item) return NextResponse.json({ error: "Action item not found." }, { status: 404 });
    await requireOrgMember(userId, item.meeting.workspace.orgId);

    const body = UpdateInput.parse(await request.json());
    const updated = await prisma.actionItem.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.assigneeLabel !== undefined ? { assigneeLabel: body.assigneeLabel } : {}),
        ...(body.dueDate !== undefined ? { dueDate: body.dueDate ? new Date(body.dueDate) : null } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
