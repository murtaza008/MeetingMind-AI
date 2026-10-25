import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidInDemo, requireSessionUser } from "@/lib/session";
import { requireOrgRole, ADMIN_ROLES } from "@/lib/org";
import { handleApiError } from "@/lib/handle-error";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/orgs/[orgId]/invites/[inviteId]">,
) {
  try {
    const { orgId, inviteId } = await ctx.params;
    const user = await requireSessionUser();
    forbidInDemo(user, "Managing invites");
    await requireOrgRole(user.id, orgId, ADMIN_ROLES);

    await prisma.orgInvite.delete({ where: { id: inviteId, orgId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
